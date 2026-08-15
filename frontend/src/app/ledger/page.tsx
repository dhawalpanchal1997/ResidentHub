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
  ShieldCheck, HelpCircle, Search, Tag, FileSpreadsheet, Eye,
} from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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
      showFeedback("success", "Transaction logged successfully!");
      await loadData();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this ledger entry?")) return;
    try {
      await deleteLedgerEntry(id);
      showFeedback("success", "Transaction deleted!");
      await loadData();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  // AI Statement Handlers
  const handleParseStatement = async () => {
    if (!statementText.trim() && !selectedFile) {
      showFeedback("error", "Please paste statement text or upload a CSV file.");
      return;
    }
    setIsParsing(true);
    try {
      let result: StatementParseResponse;
      if (selectedFile) {
        result = await parseStatementFile(selectedFile);
      } else {
        result = await parseStatementText(statementText);
      }
      setParsedData(result);
      setEditableTransactions(result.transactions);
      setAiStep("preview");
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to analyze bank statement");
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitStatement = async () => {
    const selectedTxs = editableTransactions.filter(t => t.selected);
    if (selectedTxs.length === 0) {
      showFeedback("error", "Please select at least 1 transaction to commit.");
      return;
    }
    setIsCommitting(true);
    try {
      const res = await commitStatementTransactions(selectedTxs);
      setCommitResultMsg(
        `Added ${res.ledger_entries_created} transactions to ledger and automatically verified ${res.rsvps_approved} RSVPs!`
      );
      setAiStep("success");
      await loadData();
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to commit statement");
    } finally {
      setIsCommitting(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setEditableTransactions(prev => prev.map(t => ({ ...t, selected: checked })));
  };

  const toggleTxSelect = (index: number) => {
    setEditableTransactions(prev =>
      prev.map((t, idx) => idx === index ? { ...t, selected: !t.selected } : t)
    );
  };

  const updateTxCategory = (index: number, category: string) => {
    setEditableTransactions(prev =>
      prev.map((t, idx) => idx === index ? { ...t, category } : t)
    );
  };

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const filteredLedger = ledger.filter((item) => {
    if (filterType !== "all" && item.transaction_type !== filterType) return false;
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <DollarSign className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in to view financial ledger</h2>
          <p className="text-sm text-slate-500">Access transparent society balance, income, and utility expenditures</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Financial Ledger & AI Reconciliation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete transparent audit trail of society maintenance, utilities, and event budgets
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => {
                setShowAiModal(true);
                setAiStep("input");
                setStatementText("");
                setSelectedFile(null);
                setParsedData(null);
              }}
              className="btn-primary text-xs py-2 px-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/25 border-none"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Statement Upload
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-secondary text-xs py-2 px-3.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Entry
            </button>
          </div>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`mb-6 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 shadow-sm transition-all ${
          feedback.type === "success"
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          {feedback.text}
        </div>
      )}

      {/* 3 Overview Financial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card-balance p-6 rounded-2xl flex flex-col justify-between card-entrance stagger-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 font-mono">CURRENT BALANCE</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold tracking-tight font-mono">
              <AnimatedCounter
                value={summary?.current_balance || 0}
                formatter={formatINR}
              />
            </p>
            <p className="text-xs text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Society Reserve
            </p>
          </div>
        </div>

        <div className="stat-card-income p-6 rounded-2xl flex flex-col justify-between card-entrance stagger-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 font-mono">TOTAL INFLOW (CREDITS)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-emerald-950 font-mono">
              <AnimatedCounter
                value={summary?.total_income || 0}
                formatter={(val) => `+${formatINR(val)}`}
              />
            </p>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              Maintenance dues & Event RSVPs
            </p>
          </div>
        </div>

        <div className="stat-card-expense p-6 rounded-2xl flex flex-col justify-between card-entrance stagger-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 font-mono">TOTAL OUTFLOW (DEBITS)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-rose-700" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-rose-950 font-mono">
              <AnimatedCounter
                value={summary?.total_expense || 0}
                formatter={(val) => `-${formatINR(val)}`}
              />
            </p>
            <p className="text-xs text-rose-700 font-medium mt-1">
              Utilities, Security & Vendor Invoices
            </p>
          </div>
        </div>
      </div>

      {/* Category Spend Progress Overview */}
      {summary?.category_breakdown && summary.category_breakdown.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Expense Breakdown by Category</h2>
          <p className="text-xs text-slate-500 mb-4">Distribution of outflows across verified society operations</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {summary.category_breakdown.map((cat) => {
              const pct = summary.total_expense > 0 ? (cat.amount / summary.total_expense) * 100 : 0;
              return (
                <div key={cat.category} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">{cat.category}</span>
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      {formatINR(cat.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-slate-800 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
            <p className="text-xs text-slate-500">{filteredLedger.length} recorded entries</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filterType === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("income")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filterType === "income" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setFilterType("expense")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  filterType === "expense" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Expense
              </button>
            </div>

            {/* Category Select */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 outline-none"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="form-input pl-8 text-xs py-1.5"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredLedger.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No transactions found</p>
            <p className="text-xs text-slate-500 mt-0.5">Try adjusting your filters or upload a statement</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLedger.map((item) => {
              const isIncome = item.transaction_type === "income";
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 sm:px-6 hover:bg-slate-50/80 transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isIncome ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                    }`}>
                      {isIncome ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900 truncate">{item.description}</p>
                        <span className="badge bg-slate-100 text-slate-700 text-[10px]">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
                        <span>{formatDate(item.transaction_date)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-extrabold font-mono ${
                      isIncome ? "text-emerald-700" : "text-rose-600"
                    }`}>
                      {isIncome ? "+" : "-"}{formatINR(item.amount)}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Log Manual Transaction</h2>
                <p className="text-xs text-slate-500">Record a single credit or debit in the ledger</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="form-label">Transaction Type *</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewType("expense")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      newType === "expense" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Outflow / Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType("income")}
                    className={`py-2 text-xs font-bold rounded-lg transition-all ${
                      newType === "income" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600"
                    }`}
                  >
                    Inflow / Income
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="form-input"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="form-input font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description / Remarks *</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. MSEDCL Common electricity bill payment"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Transaction Date *</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? "Logging..." : "Log Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Bank Statement Reconciliation Wizard Modal */}
      {showAiModal && (
        <div className="modal-backdrop" onClick={() => setShowAiModal(false)}>
          <div className="modal-content p-6 max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">AI Bank Statement Reconciliation</h2>
                  <p className="text-xs text-slate-500">Auto-match RSVP UTRs, utility bills, and vendor expenses</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Wizard Step 1: Input */}
            {aiStep === "input" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="form-label mb-0">Paste Bank Statement or Upload CSV</label>
                  <button
                    type="button"
                    onClick={() => {
                      setStatementText(SAMPLE_DEMO_STATEMENT);
                      setSelectedFile(null);
                    }}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Load Demo Statement
                  </button>
                </div>

                <textarea
                  value={statementText}
                  onChange={(e) => { setStatementText(e.target.value); setSelectedFile(null); }}
                  placeholder="Paste raw bank statement rows (Date, Description, Withdrawal, Deposit)..."
                  className="form-input min-h-[140px] font-mono text-xs resize-y"
                />

                <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center">
                  <input
                    type="file"
                    accept=".csv,.txt,.tsv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setStatementText("");
                      }
                    }}
                    className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                      Attached: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAiModal(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleParseStatement}
                    disabled={isParsing || (!statementText.trim() && !selectedFile)}
                    className="btn-primary flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/25 border-none"
                  >
                    {isParsing ? "Analyzing with AI..." : "Analyze & Reconcile"}
                  </button>
                </div>
              </div>
            )}

            {/* Wizard Step 2: Preview & Match Confirmation */}
            {aiStep === "preview" && parsedData && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-violet-50 rounded-2xl border border-violet-200/80 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-violet-600 font-bold block">DETECTED ROWS</span>
                    <span className="font-extrabold text-violet-950 text-sm">{parsedData.total_detected} Lines</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold block">TOTAL INFLOW</span>
                    <span className="font-extrabold text-emerald-700 text-sm">{formatINR(parsedData.total_income)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-600 font-bold block">TOTAL OUTFLOW</span>
                    <span className="font-extrabold text-rose-700 text-sm">{formatINR(parsedData.total_expense)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">Review Matched Transactions</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(true)}
                      className="text-[11px] font-semibold text-violet-600 hover:underline"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(false)}
                      className="text-[11px] font-semibold text-slate-500 hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
                  {editableTransactions.map((tx, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border transition-all text-xs ${
                        tx.selected ? "bg-white border-violet-300 shadow-sm" : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={tx.selected}
                          onChange={() => toggleTxSelect(idx)}
                          className="mt-1 rounded text-violet-600 focus:ring-violet-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-900 truncate">{tx.description}</p>
                            <span className={`font-mono font-extrabold ${tx.transaction_type === "income" ? "text-emerald-700" : "text-rose-600"}`}>
                              {tx.transaction_type === "income" ? "+" : "-"}{formatINR(tx.amount)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-[11px] text-slate-500">
                            <span>{tx.transaction_date}</span>
                            <span>•</span>
                            <select
                              value={tx.category}
                              onChange={(e) => updateTxCategory(idx, e.target.value)}
                              className="px-2 py-0.5 rounded-md border border-slate-200 bg-white font-sans text-[11px] font-semibold"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>

                          {/* Match Highlight Chips */}
                          {tx.auto_approve_rsvp && (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              🎯 Matched Pending RSVP ({tx.matched_entity_info || "Flat Resident"}) [Auto-Approve]
                            </div>
                          )}
                          {tx.matched_event_id && !tx.auto_approve_rsvp && (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              🎉 Tied to Event Budget
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setAiStep("input")} className="btn-secondary flex-1">
                    Back to Input
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitStatement}
                    disabled={isCommitting || editableTransactions.filter(t => t.selected).length === 0}
                    className="btn-primary flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/25 border-none"
                  >
                    {isCommitting ? "Committing..." : `Commit (${editableTransactions.filter(t => t.selected).length}) to Ledger`}
                  </button>
                </div>
              </div>
            )}

            {/* Wizard Step 3: Success Confirmation */}
            {aiStep === "success" && (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Reconciliation Complete!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {commitResultMsg}
                </p>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="btn-primary py-2 px-6 text-xs"
                >
                  Done & View Ledger
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
