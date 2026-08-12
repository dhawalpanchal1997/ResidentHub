import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from langchain_core.prompts import ChatPromptTemplate
from app.models.meeting import Meeting, MeetingChunk
from app.services.ai_factory import get_llm
from app.core.config import settings

logger = logging.getLogger(__name__)

QA_SYSTEM_PROMPT = """You are ResidentHub Assistant, an accurate and helpful AI copilot for residential society members.
Answer the user's question strictly based on the provided context of past society meetings, resolutions, and budget approvals.

If the answer cannot be found in the context, politely state that this topic was not discussed or recorded in the meeting minutes.
Always cite the relevant meeting date and resolution ID if available.
"""

async def answer_society_query(query: str, db: AsyncSession, meeting_id: Optional[str] = None) -> Dict[str, Any]:
    # 1. Try vector search first for relevant chunks
    relevant_chunks = await vector_search_chunks(query, db, meeting_id)
    
    if relevant_chunks:
        # Build context from vector search results
        context_blocks = []
        sources_set = set()
        
        for chunk in relevant_chunks:
            context_blocks.append(f"[{chunk.category.upper()}] {chunk.content}")
            sources_set.add((chunk.meeting_title, str(chunk.meeting_date), chunk.meeting_type))
        
        full_context = "\n\n".join(context_blocks)
        sources = [{"title": t[0], "date": t[1], "type": t[2]} for t in sources_set]
        
        # Query LLM with vector search context
        llm = get_llm()
        if llm is not None:
            try:
                prompt = ChatPromptTemplate.from_messages([
                    ("system", QA_SYSTEM_PROMPT),
                    ("human", "Society Meeting Context (from semantic search):\n{context}\n\nUser Question: {query}")
                ])
                chain = prompt | llm
                response = await chain.ainvoke({"context": full_context, "query": query})
                answer_text = response.content if hasattr(response, "content") else str(response)
                return {
                    "query": query,
                    "answer": answer_text,
                    "sources": sources
                }
            except Exception as e:
                logger.warning(f"RAG LLM error: {e}. Using deterministic context matcher.")
    
    # 2. Fallback: Fetch relevant meeting records
    if meeting_id:
        result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
        meetings = result.scalars().all()
    else:
        result = await db.execute(select(Meeting).where(Meeting.is_published == "published").order_by(Meeting.meeting_date.desc()).limit(10))
        meetings = result.scalars().all()

    if not meetings:
        return {
            "query": query,
            "answer": "No published society meetings or records were found in the system yet. Once the committee uploads meeting minutes, I can answer questions about resolutions, budgets, and action items.",
            "sources": []
        }

    # Build context from meetings & structured summaries
    context_blocks = []
    sources = []
    
    for m in meetings:
        sources.append({"title": m.title, "date": str(m.meeting_date), "type": m.meeting_type})
        summary_str = ""
        if m.structured_summary:
            import json
            summary_str = json.dumps(m.structured_summary, indent=2)
        context_blocks.append(f"--- Meeting: {m.title} ({m.meeting_date}) [{m.meeting_type}] ---\nSummary & Decisions:\n{summary_str}\nRaw Notes Snippet:\n{m.raw_transcript[:500]}")

    full_context = "\n\n".join(context_blocks)

    # 3. Query LLM if available
    llm = get_llm()
    if llm is not None:
        try:
            prompt = ChatPromptTemplate.from_messages([
                ("system", QA_SYSTEM_PROMPT),
                ("human", "Society Meeting Context:\n{context}\n\nUser Question: {query}")
            ])
            chain = prompt | llm
            response = await chain.ainvoke({"context": full_context, "query": query})
            answer_text = response.content if hasattr(response, "content") else str(response)
            return {
                "query": query,
                "answer": answer_text,
                "sources": sources
            }
        except Exception as e:
            logger.warning(f"RAG LLM error: {e}. Using deterministic context matcher.")

    # 4. Deterministic keyword matching fallback
    q_lower = query.lower()
    matched_points = []
    for m in meetings:
        if m.structured_summary:
            resolutions = m.structured_summary.get("resolutions", [])
            budgets = m.structured_summary.get("budget_approvals", [])
            actions = m.structured_summary.get("action_items", [])
            
            for r in resolutions:
                if any(k in r.get("description", "").lower() or k in r.get("title", "").lower() for k in q_lower.split()):
                    matched_points.append(f"• In meeting '{m.title}' ({m.meeting_date}): {r.get('description')}")
            for b in budgets:
                if any(k in b.get("expense_category", "").lower() or k in b.get("notes", "").lower() for k in q_lower.split()):
                    matched_points.append(f"• Budget Approval: ₹{b.get('approved_amount')} for {b.get('expense_category')} ({b.get('notes', '')})")
            for a in actions:
                if any(k in a.get("task", "").lower() for k in q_lower.split()):
                    matched_points.append(f"• Action Item: {a.get('task')} assigned to {a.get('assigned_to')}")

    if matched_points:
        answer_text = f"Here is what was found regarding your question:\n\n" + "\n".join(matched_points[:5])
    else:
        answer_text = f"Based on recorded meetings ({', '.join([m.title for m in meetings[:3]])}), no direct resolution or discussion matched '{query}'. Please check with the Managing Committee or search for a specific keyword like 'lift', 'painting', or 'security'."

    return {
        "query": query,
        "answer": answer_text,
        "sources": sources
    }


async def vector_search_chunks(query: str, db: AsyncSession, meeting_id: Optional[str] = None) -> List[Any]:
    """
    Perform vector similarity search on meeting chunks using pgvector or SQLite fallback.
    """
    try:
        # Generate query embedding
        from langchain_ollama import OllamaEmbeddings
        embeddings_model = OllamaEmbeddings(
            base_url=settings.OLLAMA_BASE_URL,
            model="nomic-embed-text:latest"
        )
        query_embedding = await embeddings_model.aembed_query(query)
        
        # Build the query
        if meeting_id:
            sql = """
                SELECT mc.*, m.title as meeting_title, m.meeting_date, m.meeting_type
                FROM meeting_chunks mc
                JOIN meetings m ON mc.meeting_id = m.id
                WHERE m.id = :meeting_id
                ORDER BY mc.embedding <=> :embedding
                LIMIT 10
            """
        else:
            sql = """
                SELECT mc.*, m.title as meeting_title, m.meeting_date, m.meeting_type
                FROM meeting_chunks mc
                JOIN meetings m ON mc.meeting_id = m.id
                WHERE m.is_published = 'published'
                ORDER BY mc.embedding <=> :embedding
                LIMIT 10
            """
        
        # Check if we're using PostgreSQL with pgvector
        conn = await db.execute(text("SELECT 1"))
        dialect = conn.bind.dialect.name if conn.bind else "sqlite"
        
        if dialect == "postgresql":
            # Use pgvector similarity search
            result = await db.execute(text(sql), {"meeting_id": meeting_id, "embedding": query_embedding} if meeting_id else {"embedding": query_embedding})
        else:
            # SQLite fallback - cosine similarity on JSON embeddings
            # This is a simplified fallback - in practice you'd need to compute in Python
            return []
        
        chunks = result.mappings().all()
        return chunks
        
    except Exception as e:
        logger.warning(f"Vector search failed: {e}. Falling back to keyword search.")
        return []