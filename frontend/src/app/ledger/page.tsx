"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchLedger, fetchLedgerSummary, createLedgerEntry, deleteLedgerEntry,
  parseStatementText, parseStatementFile, commitStatementTransactions,
  fetchStatementDocuments, fetchStatementDocument,
  LedgerItem, LedgerSummaryData, ParsedBankTransaction, StatementParseResponse,
  StatementDocumentItem,
} from "@/lib/api";
import {
  DollarSign, Plus, TrendingUp, TrendingDown, Wallet, X, Trash2,
  ArrowUpRight, ArrowDownRight, Receipt, Filter, Sparkles, Upload,
  FileText, CheckCircle, AlertCircle, RefreshCw, Check, ArrowRight,
  ShieldCheck, HelpCircle, Search, Tag, FileSpreadsheet, Eye,
  SlidersHorizontal, AlertTriangle, Layers, Calendar, ChevronDown, ChevronUp,
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
  const [activeTab, setActiveTab] = useState<"ledger" | "statements">("ledger");

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Statement Documents History State
  const [statementDocs, setStatementDocs] = useState<StatementDocumentItem[]>([]);
  const [loadingStatements, setLoadingStatements] = useState(false);
  const [selectedDocDetails, setSelectedDocDetails] = useState<StatementDocumentItem | null>(null);

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

  // Smart Sorting & Filter State in AI Preview
  const [previewSortBy, setPreviewSortBy] = useState<"confidence" | "date_desc" | "amount_desc" | "category">("confidence");
  const [previewFilter, setPreviewFilter] = useState<"all" | "rsvps" | "anomalies">("all");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const loadStatementsHistory = useCallback(async () => {
    if (!user) return;
    setLoadingStatements(true);
    try {
      const data = await fetchStatementDocuments();
      setStatementDocs(data.statements || []);
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to load statements history");
    } finally {
      setLoadingStatements(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    if (activeTab === "statements") {
      loadStatementsHistory();
    }
  }, [loadData, loadStatementsHistory, activeTab]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAmount <= 0) {
      showFeedback("error", "Amount must be greater than 0");
      return;
    }
    setCreating(true);
    try {
      await createLedgerEntry({
        transaction_type: newType,
        category: newCategory,
        amount: newAmount,
        transaction_date: newDate,
        description: newDesc,
      });
      showFeedback("success", "Transaction logged successfully!");
      setShowCreate(false);
      setNewAmount(0);
      setNewDesc("");
      await loadData();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDeleteEntry = async () => {
    if (!confirmDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteLedgerEntry(confirmDeleteId);
      showFeedback("success", "Transaction deleted!");
      setConfirmDeleteId(null);
      await loadData();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setIsDeleting(false);
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
      const res = await commitStatementTransactions(selectedTxs, parsedData?.statement_id);
      setCommitResultMsg(
        `Added ${res.ledger_entries_created} transactions to ledger and automatically verified ${res.rsvps_approved} RSVPs!`
      );
      setAiStep("success");
      await loadData();
      if (activeTab === "statements") {
        await loadStatementsHistory();
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Failed to commit statement");
    } finally {
      setIsCommitting(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setEditableTransactions(prev => prev.map(t => ({ ...t, selected: checked })));
  };

  const toggleTxSelect = (tempId: string) => {
    setEditableTransactions(prev =>
      prev.map(t => (t.temp_id === tempId ? { ...t, selected: !t.selected } : t))
    );
  };

  const updateTxCategory = (tempId: string, category: string) => {
    setEditableTransactions(prev =>
      prev.map(t => (t.temp_id === tempId ? { ...t, category } : t))
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

  // Sorted & Filtered Transactions in AI Preview
  const sortedAndFilteredAiTransactions = useMemo(() => {
    let list = [...editableTransactions];

    // Filter
    if (previewFilter === "rsvps") {
      list = list.filter(t => t.matched_rsvp_id || t.auto_approve_rsvp);
    } else if (previewFilter === "anomalies") {
      list = list.filter(t => t.is_anomaly || t.match_confidence === "none" || t.match_confidence === "low");
    }

    // Sort
    list.sort((a, b) => {
      if (previewSortBy === "confidence") {
        const confWeight: Record<string, number> = { high: 1, medium: 2, low: 3, none: 4 };
        return (confWeight[a.match_confidence] || 4) - (confWeight[b.match_confidence] || 4);
      }
      if (previewSortBy === "date_desc") {
        return new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime();
      }
      if (previewSortBy === "amount_desc") {
        return b.amount - a.amount;
      }
      if (previewSortBy === "category") {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });

    return list;
  }, [editableTransactions, previewSortBy, previewFilter]);

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

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-slide-in ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedback.type === "success" ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            {feedback.text}
          </div>
        )}

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Society Financial Ledger</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                Audited
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Transparent, real-time balance tracking, bank reconciliation, and automated event audits.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Switcher: Ledger vs Statement Uploads */}
            <div className="p-1 bg-slate-100 dark:bg-stone-800 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-stone-700">
              <button
                type="button"
                onClick={() => setActiveTab("ledger")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "ledger"
                    ? "bg-white dark:bg-stone-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:text-stone-400"
                }`}
              >
                Transactions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("statements")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "statements"
                    ? "bg-white dark:bg-stone-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-900 dark:text-stone-400"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Statement History
              </button>
            </div>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setAiStep("input");
                    setStatementText("");
                    setSelectedFile(null);
                    setShowAiModal(true);
                  }}
                  className="btn-primary bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/25 border-none flex items-center gap-1.5 text-xs font-bold py-2.5 px-4 rounded-xl"
                >
                  <Sparkles className="w-4 h-4 text-violet-200 animate-pulse" />
                  AI Reconcile Statement
                </button>

                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="btn-secondary flex items-center gap-1.5 text-xs font-bold py-2.5 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4 text-slate-600" />
                  Add Entry
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4 High-Impact KPI Financial Metric Cards (Consistent with Issues & Helpdesk) */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Society Reserve / Net Balance */}
            <div className="stat-card-balance p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 font-mono">SOCIETY RESERVE</span>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold tracking-tight font-mono text-emerald-400">
                  <AnimatedCounter value={summary.current_balance} formatter={(v) => formatINR(v)} />
                </p>
                <p className="text-[11px] text-emerald-300/90 font-medium flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Net Liquid Reserve Fund
                </p>
              </div>
            </div>

            {/* 2. Total Inflow / Income */}
            <div className="stat-card-income p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 font-mono">TOTAL INFLOW</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-amber-950 dark:text-amber-100 font-mono">
                  <AnimatedCounter value={summary.total_income} formatter={(v) => formatINR(v)} />
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/90 font-medium mt-1">
                  Maintenance & RSVPs
                </p>
              </div>
            </div>

            {/* 3. Total Outflow / Expenses */}
            <div className="stat-card-expense p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 font-mono">TOTAL OUTFLOW</span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-rose-700 dark:text-rose-300" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-rose-950 dark:text-rose-100 font-mono">
                  <AnimatedCounter value={summary.total_expense} formatter={(v) => formatINR(v)} />
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300/90 font-medium mt-1">
                  Utilities, AMC & Vendors
                </p>
              </div>
            </div>

            {/* 4. Audited Ledger Entries / Health */}
            <div className="stat-card-neutral p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-teal-300 font-mono">AUDITED ENTRIES</span>
                <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-teal-950 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-teal-600 dark:text-teal-300" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-slate-900 dark:text-teal-100 font-mono">
                  <AnimatedCounter value={ledger.length} suffix=" Records" />
                </p>
                <p className="text-[11px] text-slate-500 dark:text-teal-300/90 font-medium mt-1">
                  100% Traceable Transactions
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 1: TRANSACTIONS LIST ───────────────────────── */}
        {activeTab === "ledger" && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm border border-slate-200/80">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by description or category..."
                    className="form-input pl-9 text-xs py-2 w-full bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-input text-xs py-2 bg-slate-50 border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Type Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto justify-center">
                {(["all", "income", "expense"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
                      filterType === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions Table */}
            <div className="card overflow-hidden shadow-sm border border-slate-200/80">
              {loading ? (
                <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  Loading transactions...
                </div>
              ) : filteredLedger.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No transactions found matching the selected criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4">Reference / Source</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        {isAdmin && <th className="py-3 px-4 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLedger.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                            {formatDate(item.transaction_date)}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                            {item.description}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                            {item.statement_id ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                <FileSpreadsheet className="w-3 h-3" />
                                Bank Statement Doc
                              </span>
                            ) : item.receipt_url ? (
                              <span className="font-mono text-slate-600">{item.receipt_url}</span>
                            ) : (
                              <span className="text-slate-400 italic">Direct Entry</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-extrabold text-right whitespace-nowrap text-sm">
                            <span className={item.transaction_type === "income" ? "text-emerald-700" : "text-rose-600"}>
                              {item.transaction_type === "income" ? "+" : "-"}{formatINR(item.amount)}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete entry"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: STATEMENT UPLOADS HISTORY ───────────────── */}
        {activeTab === "statements" && (
          <div className="space-y-4">
            <div className="card p-5 shadow-sm border border-slate-200/80">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Uploaded Bank Statements</h2>
                  <p className="text-xs text-slate-500">History of all raw bank statement batches processed into the society ledger</p>
                </div>
                <button
                  type="button"
                  onClick={loadStatementsHistory}
                  className="btn-secondary text-xs font-bold py-1.5 px-3 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingStatements ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {loadingStatements ? (
                <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-violet-600" />
                  Loading statements archive...
                </div>
              ) : statementDocs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No statement documents stored yet. Use <b>AI Reconcile Statement</b> to upload and commit your first batch.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {statementDocs.map((doc) => (
                    <div key={doc.id} className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-xs">{doc.filename}</h3>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                doc.status === "committed"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Uploaded by <span className="font-semibold text-slate-700">{doc.uploader_name}</span> • {formatDate(doc.created_at)} • {(doc.file_size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-sans font-semibold">Transactions</span>
                          <span className="font-bold text-slate-800">{doc.total_transactions_count} rows</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-600 block font-sans font-semibold">Inflow</span>
                          <span className="font-bold text-emerald-700">{formatINR(doc.total_income_amount)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-rose-600 block font-sans font-semibold">Outflow</span>
                          <span className="font-bold text-rose-700">{formatINR(doc.total_expense_amount)}</span>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            const details = await fetchStatementDocument(doc.id);
                            setSelectedDocDetails(details);
                          }}
                          className="p-2 rounded-xl text-violet-600 hover:bg-violet-50 transition-colors"
                          title="View raw document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Raw Statement Document Viewer Modal */}
      {selectedDocDetails && (
        <div className="modal-backdrop" onClick={() => setSelectedDocDetails(null)}>
          <div className="modal-content p-6 max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">{selectedDocDetails.filename}</h2>
                <p className="text-xs text-slate-500">Uploaded {formatDate(selectedDocDetails.created_at)} by {selectedDocDetails.uploader_name}</p>
              </div>
              <button onClick={() => setSelectedDocDetails(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs max-h-96 overflow-y-auto whitespace-pre-wrap">
              {selectedDocDetails.raw_content}
            </div>

            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setSelectedDocDetails(null)} className="btn-secondary text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="modal-content p-6 max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">AI Bank Statement Reconciliation</h2>
                    {parsedData?.model_used && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-100 text-violet-800 border border-violet-200">
                        {parsedData.model_used}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">Semantic auto-matching with Society Events, RSVPs, Vendors, and Utility Rules</p>
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
                    {isParsing ? "Reconciling with LLM..." : "Analyze & Reconcile"}
                  </button>
                </div>
              </div>
            )}

            {/* Wizard Step 2: Preview & Smart Sorting Confirmation */}
            {aiStep === "preview" && parsedData && (
              <div className="space-y-4">
                {/* Financial Summary */}
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

                {/* Smart Sort & Filter Controls Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 text-xs">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-slate-700">Sort by:</span>
                    <select
                      value={previewSortBy}
                      onChange={(e) => setPreviewSortBy(e.target.value as any)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      <option value="confidence">✨ AI Confidence (Action First)</option>
                      <option value="date_desc">📅 Date (Newest First)</option>
                      <option value="amount_desc">💰 Amount (Highest First)</option>
                      <option value="category">🏷️ Category</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700">Filter:</span>
                    <select
                      value={previewFilter}
                      onChange={(e) => setPreviewFilter(e.target.value as any)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                    >
                      <option value="all">All Transactions</option>
                      <option value="rsvps">🎟️ RSVP Matches Only</option>
                      <option value="anomalies">⚠️ Anomalies / Unmatched</option>
                    </select>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    <button
                      type="button"
                      onClick={() => toggleSelectAll(true)}
                      className="text-[11px] font-semibold text-violet-600 hover:underline"
                    >
                      All
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(false)}
                      className="text-[11px] font-semibold text-slate-500 hover:underline"
                    >
                      None
                    </button>
                  </div>
                </div>

                {/* Transactions Card List */}
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                  {sortedAndFilteredAiTransactions.map((tx) => (
                    <div
                      key={tx.temp_id}
                      className={`p-3.5 rounded-2xl border transition-all text-xs ${
                        tx.selected ? "bg-white border-violet-300 shadow-sm" : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={tx.selected}
                          onChange={() => toggleTxSelect(tx.temp_id)}
                          className="mt-1 rounded text-violet-600 focus:ring-violet-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-slate-900 truncate text-xs">{tx.description}</p>
                            <span className={`font-mono font-extrabold ${tx.transaction_type === "income" ? "text-emerald-700" : "text-rose-600"}`}>
                              {tx.transaction_type === "income" ? "+" : "-"}{formatINR(tx.amount)}
                            </span>
                          </div>

                          {/* Raw Narration */}
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                            Raw: {tx.raw_narration}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-1.5 font-mono text-[11px] text-slate-500">
                            <span>{tx.transaction_date}</span>
                            <span>•</span>
                            <select
                              value={tx.category}
                              onChange={(e) => updateTxCategory(tx.temp_id, e.target.value)}
                              className="px-2 py-0.5 rounded-md border border-slate-200 bg-white font-sans text-[11px] font-semibold text-slate-800"
                            >
                              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase font-sans ${
                                tx.match_confidence === "high"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : tx.match_confidence === "medium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {tx.match_confidence} Confidence
                            </span>
                          </div>

                          {/* AI Reasoning Chip */}
                          {tx.ai_reasoning && (
                            <div className="mt-2 p-2 rounded-xl bg-violet-50/60 border border-violet-100 text-[11px] text-violet-900 flex items-start gap-1.5 font-sans">
                              <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                              <span>{tx.ai_reasoning}</span>
                            </div>
                          )}

                          {/* Match Action Highlight */}
                          {tx.auto_approve_rsvp && (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              🎯 Linked RSVP: {tx.matched_entity_info || "Flat Resident"} [Auto-Approve]
                            </div>
                          )}
                          {tx.matched_event_id && !tx.auto_approve_rsvp && (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              🎉 Event Budget Sync
                            </div>
                          )}
                          {tx.is_anomaly && (
                            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              ⚠️ Anomaly Flagged
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
                <h3 className="text-xl font-bold text-slate-900">Reconciliation & Persistence Complete!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {commitResultMsg}
                </p>
                <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 text-xs text-violet-900 max-w-sm mx-auto">
                  📄 Statement document saved and permanently referenced in the ledger audit log.
                </div>
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

      {/* 🗑️ IN-APP DELETE CONFIRMATION MODAL */}
      {confirmDeleteId && (
        <div className="modal-backdrop z-50 animate-fade-in">
          <div className="modal-content max-w-sm text-center p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                Delete Ledger Entry?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                className="btn-secondary w-full py-2.5 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteEntry}
                disabled={isDeleting}
                className="btn-primary w-full py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white border-none shadow-md shadow-rose-500/20"
              >
                {isDeleting ? "Deleting..." : "Delete Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
