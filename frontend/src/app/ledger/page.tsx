"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchLedger, fetchLedgerSummary, createLedgerEntry, deleteLedgerEntry,
  parseStatementText, parseStatementFile, commitStatementTransactions,
  LedgerItem, LedgerSummaryData, ParsedBankTransaction, StatementParseResponse,
} from "@/lib/api";
import {
  DollarSign, Plus, TrendingUp, TrendingDown, Wallet, X, Trash2,
  ArrowUpRight, ArrowDownRight, Receipt, Filter, Sparkles, Upload,
  FileText, CheckCircle, AlertCircle, RefreshCw, Check, ArrowRight,
  ShieldCheck, HelpCircle,
} from "lucide-react";

const CATEGORIES = [
  "Maintenance",
  "Security",
  "Electricity",
  "Lift Maintenance",
  "Gardening & Cleaning",
  "Repairs",
  "Events",
  "Events (RSVP)",
  "Others",
];

const SAMPLE_DEMO_STATEMENT = `Date,Description,Withdrawal,Deposit,Balance
2026-08-10,UPI/7728193821/Priya Patel/B-201/Diwali Gala,,900.00,185900.00
2026-08-11,NEFT/MSEDCL/Common Area Electricity Bill,28400.00,,157500.00
2026-08-12,CHQ-883921 Schindler Lift Quarterly AMC,18000.00,,139500.00
2026-08-13,UPI/9988776655/Amit Deshmukh/A-102/August Maintenance,,4500.00,144000.00
2026-08-14,UPI/INV-CAT-9921/Royal Caterers Dinner Advance,15000.00,,129000.00
2026-08-15,UPI/Apex Security Agency Guard Salaries,45000.00,,84000.00`;

export default function LedgerPage() {
  const { user, isAdmin } = useAuth();
  const [ledger, setLedger] = useState<LedgerItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  // Create manual transaction modal
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState<"income" | "expense">("expense");
  const [newCategory, setNewCategory] = useState("Maintenance");
  const [newAmount, setNewAmount] = useState(0);
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // AI Bank Statement Reconciliation State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiStep, setAiStep] = useState<"input" | "preview" | "success">("input");
  const [statementText, setStatementText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<StatementParseResponse | null>(null);
  const [editableTransactions, setEditableTransactions] = useState<ParsedBankTransaction[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResultMsg, setCommitResultMsg] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [items, sum] = await Promise.all([fetchLedger(), fetchLedgerSummary()]);
      setLedger(items);
      setSummary(sum);
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createLedgerEntry({
        transaction_type: newType,
        category: newCategory,
        amount: newAmount,
        transaction_date: newDate,
        description: newDesc,
      });
      setShowCreate(false);
      setNewType("expense"); setNewCategory("Maintenance"); setNewAmount(0); setNewDesc("");
      showFeedback("success", "Transaction logged!");
      await loadData();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await deleteLedgerEntry(id);
      showFeedback("success", "Transaction deleted");
      await loadData();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // ── AI Statement Handlers ────────────────────────────────────

  const handleParseStatement = async () => {
    if (!selectedFile && !statementText.trim()) {
      showFeedback("error", "Please upload a bank statement file or paste statement text.");
      return;
    }
    setIsParsing(true);
    try {
      let res: StatementParseResponse;
      if (selectedFile) {
        res = await parseStatementFile(selectedFile);
      } else {
        res = await parseStatementText(statementText);
      }
      setParsedData(res);
      setEditableTransactions(res.transactions.map(t => ({ ...t, selected: true })));
      setAiStep("preview");
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to analyze bank statement");
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleSelectAll = (checked: boolean) => {
    setEditableTransactions(prev => prev.map(t => ({ ...t, selected: checked })));
  };

  const handleToggleTransaction = (tempId: string) => {
    setEditableTransactions(prev => prev.map(t => t.temp_id === tempId ? ({ ...t, selected: !t.selected }) : t));
  };

  const handleUpdateCategory = (tempId: string, category: string) => {
    setEditableTransactions(prev => prev.map(t => t.temp_id === tempId ? ({ ...t, category }) : t));
  };

  const handleCommitTransactions = async () => {
    const selected = editableTransactions.filter(t => t.selected);
    if (selected.length === 0) {
      showFeedback("error", "Please select at least one transaction to commit.");
      return;
    }
    setIsCommitting(true);
    try {
      const res = await commitStatementTransactions(
        selected.map(t => ({
          transaction_date: t.transaction_date,
          transaction_type: t.transaction_type,
          amount: t.amount,
          category: t.category,
          description: t.description,
          utr_number: t.utr_number || undefined,
          matched_rsvp_id: t.matched_rsvp_id || undefined,
          matched_event_id: t.matched_event_id || undefined,
          auto_approve_rsvp: t.auto_approve_rsvp,
        }))
      );
      setCommitResultMsg(res.detail);
      setAiStep("success");
      await loadData();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to commit statement transactions");
    } finally {
      setIsCommitting(false);
    }
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const filteredLedger = ledger.filter(t =>
    filterType === "all" ? true : t.transaction_type === filterType
  );

  const maxCategoryAmount = Math.max(...(summary?.category_breakdown.map(c => c.amount) || [1]));

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <DollarSign className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in to view the ledger</h2>
          <p className="text-sm text-slate-500">Transparent society financial records</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financial Ledger</h1>
          <p className="text-sm text-slate-500 mt-0.5">Transparent society income, expenses & automated bank reconciliation</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowAiModal(true);
                setAiStep("input");
                setStatementText("");
                setSelectedFile(null);
                setParsedData(null);
              }}
              className="btn-primary flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-indigo-100"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              AI Statement Upload
            </button>

            <button onClick={() => setShowCreate(true)} className="btn-secondary flex items-center gap-2 border border-slate-200">
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {feedback.text}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card stat-income p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Total Income</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-900">{formatINR(summary?.total_income || 0)}</p>
            </div>
            <div className="card stat-expense p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Total Expenses</span>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-900">{formatINR(summary?.total_expense || 0)}</p>
            </div>
            <div className="card stat-balance p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Net Fund Balance</span>
                <Wallet className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{formatINR(summary?.current_balance || 0)}</p>
            </div>
          </div>

          {/* Category Breakdown */}
          {summary && summary.category_breakdown.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Expense Breakdown by Category</h2>
              <div className="space-y-3">
                {summary.category_breakdown
                  .sort((a, b) => b.amount - a.amount)
                  .map((cat) => (
                    <div key={cat.category} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 w-36 truncate">{cat.category}</span>
                      <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-lg transition-all duration-500"
                          style={{ width: `${(cat.amount / maxCategoryAmount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-24 text-right">{formatINR(cat.amount)}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Monthly Breakdown */}
          {summary && summary.monthly_breakdown.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Monthly Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">Month</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-emerald-600 uppercase">Income</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-red-600 uppercase">Expense</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-blue-600 uppercase">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.monthly_breakdown.map((m) => (
                      <tr key={m.month} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-3 px-3 font-medium text-slate-800">{m.month}</td>
                        <td className="py-3 px-3 text-right text-emerald-700">{formatINR(m.income)}</td>
                        <td className="py-3 px-3 text-right text-red-600">{formatINR(m.expense)}</td>
                        <td className={`py-3 px-3 text-right font-semibold ${m.net >= 0 ? "text-blue-700" : "text-red-700"}`}>
                          {formatINR(m.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-slate-400" />
            {(["all", "income", "expense"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === f ? "bg-slate-800 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <span className="text-xs text-slate-400 ml-2">{filteredLedger.length} entries</span>
          </div>

          {/* Transaction List */}
          <div className="space-y-2">
            {filteredLedger.map((tx) => (
              <div key={tx.id} className="card p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.transaction_type === "income" ? "bg-emerald-100" : "bg-red-100"
                }`}>
                  {tx.transaction_type === "income" ? (
                    <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{tx.description || tx.category}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-medium text-slate-700">{tx.category}</span> • {new Date(tx.transaction_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {tx.receipt_url && (
                      <span className="ml-2 text-blue-600"><Receipt className="w-3 h-3 inline mr-0.5" />Ref: {tx.receipt_url}</span>
                    )}
                  </p>
                </div>
                <p className={`text-sm font-bold whitespace-nowrap ${
                  tx.transaction_type === "income" ? "text-emerald-700" : "text-red-700"
                }`}>
                  {tx.transaction_type === "income" ? "+" : "-"}{formatINR(tx.amount)}
                </p>
                {isAdmin && (
                  <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Manual Add Transaction Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Add Transaction</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="form-label">Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setNewType("income")}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${newType === "income" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    Income
                  </button>
                  <button type="button" onClick={() => setNewType("expense")}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${newType === "expense" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    Expense
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">Category</label>
                <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="form-input">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" min={1} value={newAmount} onChange={(e) => setNewAmount(Number(e.target.value))} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="form-input" required />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Enter details..." className="form-input min-h-[70px] resize-y" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? "Saving..." : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AI Bank Statement Reconciliation Modal ──────────────── */}
      {showAiModal && (
        <div className="modal-backdrop" onClick={() => setShowAiModal(false)}>
          <div
            className={`modal-content p-6 transition-all ${aiStep === "preview" ? "max-w-4xl" : "max-w-xl"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">AI Bank Statement Reconciliation</h2>
                  <p className="text-xs text-slate-500">Auto-detect income/expenses, match Event RSVPs & sync ledger</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* STEP 1: INPUT / UPLOAD */}
            {aiStep === "input" && (
              <div className="space-y-4">
                <div className="p-3.5 bg-violet-50 rounded-xl border border-violet-100 text-xs text-violet-800">
                  <p className="font-semibold flex items-center gap-1 mb-1">
                    <ShieldCheck className="w-4 h-4 text-violet-600" />
                    How AI Reconciliation Works:
                  </p>
                  <p>
                    1. Upload or paste your society bank statement (CSV, TXT, or Excel export).<br />
                    2. AI identifies deposits (maintenance, event ticket RSVPs by UPI/UTR) and withdrawals (utility bills, catering, vendors).<br />
                    3. Auto-verifies pending event RSVPs when UPI references match!
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label mb-0">Bank Statement Text / CSV</label>
                    <button
                      type="button"
                      onClick={() => setStatementText(SAMPLE_DEMO_STATEMENT)}
                      className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      Load Demo Statement
                    </button>
                  </div>
                  <textarea
                    value={statementText}
                    onChange={(e) => setStatementText(e.target.value)}
                    placeholder="Paste bank statement rows here (e.g. Date, Narration, Withdrawal, Deposit)..."
                    className="form-input min-h-[140px] font-mono text-xs resize-y"
                  />
                </div>

                <div>
                  <label className="form-label">Or Upload File (.csv, .txt, .tsv)</label>
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="form-input text-xs"
                  />
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAiModal(false)} className="btn-secondary flex-1">Cancel</button>
                  <button
                    type="button"
                    onClick={handleParseStatement}
                    disabled={isParsing || (!selectedFile && !statementText.trim())}
                    className="btn-primary flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center gap-2"
                  >
                    {isParsing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analyzing Statement...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Analyze & Reconcile
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: PREVIEW & RECONCILIATION TABLE */}
            {aiStep === "preview" && parsedData && (
              <div className="space-y-5">
                {/* Summary Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block">Detected Lines</span>
                    <span className="text-base font-bold text-slate-800">{parsedData.total_detected}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Income</span>
                    <span className="text-base font-bold text-emerald-700">{formatINR(parsedData.total_income)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Total Expenses</span>
                    <span className="text-base font-bold text-red-600">{formatINR(parsedData.total_expense)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Event RSVPs Matched</span>
                    <span className="text-base font-bold text-violet-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {parsedData.total_rsvps_matched} Matched
                    </span>
                  </div>
                </div>

                {/* Table Header Controls */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="select-all-ai"
                      checked={editableTransactions.length > 0 && editableTransactions.every(t => t.selected)}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      className="rounded text-violet-600 focus:ring-violet-500"
                    />
                    <label htmlFor="select-all-ai" className="font-semibold text-slate-700 cursor-pointer">
                      Select All ({editableTransactions.filter(t => t.selected).length}/{editableTransactions.length} selected)
                    </label>
                  </div>
                  <span className="text-slate-400">Review AI categorized items before committing</span>
                </div>

                {/* Transaction Rows */}
                <div className="max-h-[380px] overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {editableTransactions.map((tx) => (
                    <div
                      key={tx.temp_id}
                      className={`p-3 rounded-xl border transition-all ${
                        tx.selected ? "bg-white border-slate-200 shadow-sm" : "bg-slate-100/60 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={tx.selected}
                          onChange={() => handleToggleTransaction(tx.temp_id)}
                          className="mt-1 rounded text-violet-600 focus:ring-violet-500"
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`badge ${tx.transaction_type === "income" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                                  {tx.transaction_type.toUpperCase()}
                                </span>
                                <span className="text-xs text-slate-400">{tx.transaction_date}</span>
                                {tx.utr_number && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                                    Ref: {tx.utr_number}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-slate-800 mt-1">{tx.description}</p>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{tx.raw_narration}</p>
                            </div>

                            <span className={`text-sm font-bold whitespace-nowrap ${
                              tx.transaction_type === "income" ? "text-emerald-700" : "text-red-700"
                            }`}>
                              {tx.transaction_type === "income" ? "+" : "-"}{formatINR(tx.amount)}
                            </span>
                          </div>

                          {/* Smart Entity Match Badge */}
                          {tx.matched_entity_info && (
                            <div className={`mt-2 p-2 rounded-lg text-xs flex items-center justify-between ${
                              tx.match_type === "rsvp" ? "bg-violet-50 border border-violet-200 text-violet-900" : "bg-slate-100 text-slate-700"
                            }`}>
                              <span className="flex items-center gap-1.5 font-medium">
                                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                                {tx.matched_entity_info}
                              </span>
                              {tx.auto_approve_rsvp && (
                                <span className="badge bg-emerald-100 text-emerald-800 text-[10px]">
                                  <Check className="w-3 h-3 inline mr-0.5" /> Auto-Approve RSVP
                                </span>
                              )}
                            </div>
                          )}

                          {/* Category Selector */}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] text-slate-500 font-medium">Category:</span>
                            <select
                              value={tx.category}
                              onChange={(e) => handleUpdateCategory(tx.temp_id, e.target.value)}
                              className="text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white focus:ring-1 focus:ring-violet-500"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAiStep("input")}
                    className="btn-secondary text-xs"
                  >
                    Back to Upload
                  </button>

                  <button
                    type="button"
                    onClick={handleCommitTransactions}
                    disabled={isCommitting || editableTransactions.filter(t => t.selected).length === 0}
                    className="btn-primary text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 flex items-center gap-1.5"
                  >
                    {isCommitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Saving to Database...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Commit {editableTransactions.filter(t => t.selected).length} Transactions
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {aiStep === "success" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Reconciliation Complete!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">{commitResultMsg}</p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    className="btn-primary px-6 text-sm"
                  >
                    Close & View Ledger
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
