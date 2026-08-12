"""Add pgvector support, indexes, constraints and schema enhancements

Revision ID: 001_add_vector_and_indexes
Revises: 4542c4b3e3d6
Create Date: 2026-08-12 17:40:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_add_vector_and_indexes'
down_revision: Union[str, None] = '4542c4b3e3d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add pgvector extension for PostgreSQL (skip for SQLite)
    conn = op.get_bind()
    if conn.dialect.name == 'postgresql':
        op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    
    # Add embedding column to meeting_chunks for vector search
    # Using a JSON column as fallback for SQLite, Vector for PostgreSQL
    if conn.dialect.name == 'postgresql':
        from pgvector.sqlalchemy import Vector
        op.add_column('meeting_chunks', sa.Column('embedding', Vector(1536), nullable=True))
    else:
        op.add_column('meeting_chunks', sa.Column('embedding', sa.JSON(), nullable=True))
    
    # Add indexes for better query performance
    # User indexes
    op.create_index('ix_users_society_id', 'users', ['society_id'])
    op.create_index('ix_users_flat_number', 'users', ['flat_number'])
    op.create_index('ix_users_role', 'users', ['role'])
    
    # Event indexes
    op.create_index('ix_events_society_id', 'events', ['society_id'])
    op.create_index('ix_events_event_date', 'events', ['event_date'])
    op.create_index('ix_events_created_by', 'events', ['created_by'])
    
    # RSVP indexes
    op.create_index('ix_event_rsvps_event_id', 'event_rsvps', ['event_id'])
    op.create_index('ix_event_rsvps_user_id', 'event_rsvps', ['user_id'])
    op.create_index('ix_event_rsvps_status', 'event_rsvps', ['status'])
    
    # Ledger indexes
    op.create_index('ix_ledger_transactions_society_id', 'ledger_transactions', ['society_id'])
    op.create_index('ix_ledger_transactions_type', 'ledger_transactions', ['transaction_type'])
    op.create_index('ix_ledger_transactions_category', 'ledger_transactions', ['category'])
    op.create_index('ix_ledger_transactions_date', 'ledger_transactions', ['transaction_date'])
    op.create_index('ix_ledger_transactions_logged_by', 'ledger_transactions', ['logged_by'])
    
    # Vendor indexes
    op.create_index('ix_service_providers_society_id', 'service_providers', ['society_id'])
    op.create_index('ix_service_providers_category', 'service_providers', ['category'])
    op.create_index('ix_provider_reviews_provider_id', 'provider_reviews', ['provider_id'])
    op.create_index('ix_provider_reviews_user_id', 'provider_reviews', ['user_id'])
    
    # Meeting indexes
    op.create_index('ix_meetings_society_id', 'meetings', ['society_id'])
    op.create_index('ix_meetings_meeting_date', 'meetings', ['meeting_date'])
    op.create_index('ix_meetings_is_published', 'meetings', ['is_published'])
    op.create_index('ix_meetings_created_by', 'meetings', ['created_by'])
    
    # Meeting chunk indexes
    op.create_index('ix_meeting_chunks_meeting_id', 'meeting_chunks', ['meeting_id'])
    op.create_index('ix_meeting_chunks_category', 'meeting_chunks', ['category'])
    
    # Add check constraints for data integrity (PostgreSQL only)
    if conn.dialect.name == 'postgresql':
        op.create_check_constraint(
            'ck_users_role',
            'users',
            "role IN ('admin', 'member')"
        )
        
        op.create_check_constraint(
            'ck_ledger_transaction_type',
            'ledger_transactions',
            "transaction_type IN ('income', 'expense')"
        )
        
        op.create_check_constraint(
            'ck_event_rsvps_status',
            'event_rsvps',
            "status IN ('pending', 'approved', 'rejected')"
        )
        
        op.create_check_constraint(
            'ck_meetings_type',
            'meetings',
            "meeting_type IN ('AGM', 'EGM', 'Monthly Committee', 'General Body')"
        )
        
        op.create_check_constraint(
            'ck_meetings_published',
            'meetings',
            "is_published IN ('draft', 'published')"
        )
        
        op.create_check_constraint(
            'ck_provider_reviews_rating',
            'provider_reviews',
            'rating >= 1 AND rating <= 5'
        )


def downgrade() -> None:
    from alembic import op
    conn = op.get_bind()
    
    # Drop check constraints (skip for SQLite as they may not exist)
    if conn.dialect.name == 'postgresql':
        op.drop_constraint('ck_users_role', 'users', type_='check')
        op.drop_constraint('ck_ledger_transaction_type', 'ledger_transactions', type_='check')
        op.drop_constraint('ck_event_rsvps_status', 'event_rsvps', type_='check')
        op.drop_constraint('ck_meetings_type', 'meetings', type_='check')
        op.drop_constraint('ck_meetings_published', 'meetings', type_='check')
        op.drop_constraint('ck_provider_reviews_rating', 'provider_reviews', type_='check')
    
    # Drop indexes
    op.drop_index('ix_users_society_id', 'users')
    op.drop_index('ix_users_flat_number', 'users')
    op.drop_index('ix_users_role', 'users')
    op.drop_index('ix_events_society_id', 'events')
    op.drop_index('ix_events_event_date', 'events')
    op.drop_index('ix_events_created_by', 'events')
    op.drop_index('ix_event_rsvps_event_id', 'event_rsvps')
    op.drop_index('ix_event_rsvps_user_id', 'event_rsvps')
    op.drop_index('ix_event_rsvps_status', 'event_rsvps')
    op.drop_index('ix_ledger_transactions_society_id', 'ledger_transactions')
    op.drop_index('ix_ledger_transactions_type', 'ledger_transactions')
    op.drop_index('ix_ledger_transactions_category', 'ledger_transactions')
    op.drop_index('ix_ledger_transactions_date', 'ledger_transactions')
    op.drop_index('ix_ledger_transactions_logged_by', 'ledger_transactions')
    op.drop_index('ix_service_providers_society_id', 'service_providers')
    op.drop_index('ix_service_providers_category', 'service_providers')
    op.drop_index('ix_provider_reviews_provider_id', 'provider_reviews')
    op.drop_index('ix_provider_reviews_user_id', 'provider_reviews')
    op.drop_index('ix_meetings_society_id', 'meetings')
    op.drop_index('ix_meetings_meeting_date', 'meetings')
    op.drop_index('ix_meetings_is_published', 'meetings')
    op.drop_index('ix_meetings_created_by', 'meetings')
    op.drop_index('ix_meeting_chunks_meeting_id', 'meeting_chunks')
    op.drop_index('ix_meeting_chunks_category', 'meeting_chunks')
    
    # Drop embedding column
    op.drop_column('meeting_chunks', 'embedding')
    
    # Note: pgvector extension is not dropped as it might be used by other tables