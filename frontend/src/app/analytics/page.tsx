"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAnalyticsOverview,
  AnalyticsOverviewData,
} from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Sparkles,
  Shield,
  Phone,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw,
  Home,
  Award,
  Layers,
  Zap,
} from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "financials" | "events" | "community">("overview");
  const [timeframe, setTimeframe] = useState<"all" | "year" | "6m">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAnalyticsOverview();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load society analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <AppShell>
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Tower 24 Runwal Gardens • Data Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-stone-100 tracking-tight">
            Society Analytics & Visual Insights
          </h1>
          <p className="text-sm text-slate-600 dark:text-stone-400 font-medium mt-1">
            Real-time financial cashflows, demographic participation, event budgets, and vendor intelligence
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-md shadow-orange-600/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadData} className="underline font-bold text-xs">Retry</button>
        </div>
      )}

      {/* Top 4 KPI High-Impact Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI 1: Society Reserve (High-Contrast Obsidian Stat Card) */}
        <div className="stat-card-balance p-5 rounded-3xl relative overflow-hidden text-white shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider text-amber-300 uppercase">
              Society Reserve Fund
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono mt-2 tracking-tight text-white">
            {loading ? "..." : formatINR(data?.financials.reserve_fund || 0)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-200 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>{data?.financials.savings_rate || 0}% Savings Retention</span>
          </div>
        </div>

        {/* KPI 2: Total Footfall */}
        <div className="card p-5 bg-white dark:bg-[#1c1714] border-stone-200 dark:border-[#383028] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider text-stone-500 dark:text-stone-400 uppercase">
              Festival Footfall
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-stone-900 dark:text-stone-100 mt-2 tracking-tight">
            {loading ? "..." : `${data?.events.total_footfall || 0} Passes`}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-stone-500 dark:text-stone-400">
            <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>Across {data?.events.total_events || 0} Celebrations</span>
          </div>
        </div>

        {/* KPI 3: Community Engagement */}
        <div className="card p-5 bg-white dark:bg-[#1c1714] border-stone-200 dark:border-[#383028] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider text-stone-500 dark:text-stone-400 uppercase">
              Flat Participation
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400 mt-2 tracking-tight">
            {loading ? "..." : `${data?.community.participation_rate || 0}%`}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-stone-500 dark:text-stone-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{data?.community.participating_flats || 0} Active Participating Flats</span>
          </div>
        </div>

        {/* KPI 4: Verified Vendors */}
        <div className="card p-5 bg-white dark:bg-[#1c1714] border-stone-200 dark:border-[#383028] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold tracking-wider text-stone-500 dark:text-stone-400 uppercase">
              Verified Partners
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-stone-900 dark:text-stone-100 mt-2 tracking-tight">
            {loading ? "..." : `${data?.vendors.total_vendors || 0} Vendors`}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-stone-500 dark:text-stone-400">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{data?.vendors.avg_rating || 4.8} / 5.0 Average Rating</span>
          </div>
        </div>
      </div>

      {/* Interactive Category Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-stone-100 dark:bg-[#1c1714] rounded-2xl border border-stone-200 dark:border-[#383028] mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "overview"
              ? "bg-white dark:bg-[#2a221b] text-orange-600 dark:text-orange-400 shadow-sm border border-stone-200 dark:border-[#45392e]"
              : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Executive Summary & Insights</span>
        </button>

        <button
          onClick={() => setActiveTab("financials")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "financials"
              ? "bg-white dark:bg-[#2a221b] text-orange-600 dark:text-orange-400 shadow-sm border border-stone-200 dark:border-[#45392e]"
              : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financial Cashflows & AMC</span>
        </button>

        <button
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "events"
              ? "bg-white dark:bg-[#2a221b] text-orange-600 dark:text-orange-400 shadow-sm border border-stone-200 dark:border-[#45392e]"
              : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Festival Turnout & Demographics</span>
        </button>

        <button
          onClick={() => setActiveTab("community")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === "community"
              ? "bg-white dark:bg-[#2a221b] text-orange-600 dark:text-orange-400 shadow-sm border border-stone-200 dark:border-[#45392e]"
              : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Residency & Local Vendor Network</span>
        </button>
      </div>

      {/* ── TAB 1: EXECUTIVE OVERVIEW & AI INSIGHTS ───────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Smart AI / Algorithmic Insights Grid */}
          <div>
            <h2 className="text-sm font-extrabold uppercase font-mono tracking-wider text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Automated Key Takeaways & Recommendations</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.insights.map((ins, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white dark:bg-[#1b1613] border border-stone-200 dark:border-[#352c24] shadow-xs flex items-start gap-3.5"
                >
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                    {ins.type === "positive" ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : ins.type === "celebration" ? (
                      <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    ) : ins.type === "info" ? (
                      <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                      {ins.title}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                      {ins.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Snapshot Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Financial Health Summary */}
            <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24]">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#2f2720]">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Financial Cashflow</span>
                </h3>
                <Link href="/ledger" className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline">
                  Ledger →
                </Link>
              </div>
              <div className="space-y-3.5 mt-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400">Total Inflow Collected</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                    {formatINR(data?.financials.total_income || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 dark:text-stone-400">Total Society Outflow</span>
                  <span className="font-extrabold text-rose-700 dark:text-rose-400 font-mono">
                    {formatINR(data?.financials.total_expense || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-100 dark:border-[#2f2720]">
                  <span className="font-bold text-stone-900 dark:text-stone-100">Net Reserve Balance</span>
                  <span className="font-extrabold text-blue-700 dark:text-sky-400 font-mono text-sm">
                    {formatINR(data?.financials.reserve_fund || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Demographics Snapshot */}
            <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24]">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#2f2720]">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span>Demographic Footfall</span>
                </h3>
                <Link href="/events" className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline">
                  Events →
                </Link>
              </div>
              <div className="space-y-3 mt-4 text-xs">
                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-stone-700 dark:text-stone-300">Adults ({data?.events.demographics.adults_count || 0})</span>
                    <span className="font-mono text-stone-500">{data?.events.demographics.adults_pct || 0}%</span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full rounded-full" style={{ width: `${data?.events.demographics.adults_pct || 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-stone-700 dark:text-stone-300">Children ({data?.events.demographics.children_count || 0})</span>
                    <span className="font-mono text-stone-500">{data?.events.demographics.children_pct || 0}%</span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${data?.events.demographics.children_pct || 0}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold mb-1">
                    <span className="text-stone-700 dark:text-stone-300">Seniors ({data?.events.demographics.seniors_count || 0})</span>
                    <span className="font-mono text-stone-500">{data?.events.demographics.seniors_pct || 0}%</span>
                  </div>
                  <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${data?.events.demographics.seniors_pct || 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Residency Structure */}
            <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24]">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#2f2720]">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Home className="w-4 h-4 text-amber-600" />
                  <span>Residency Structure</span>
                </h3>
                <span className="text-xs font-mono text-stone-400 font-bold">Runwal T24</span>
              </div>
              <div className="space-y-4 mt-4 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 dark:bg-[#241a13] border border-amber-200/80 dark:border-amber-900/50">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏠</span>
                    <div>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100 block">Flat Owners</span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">Primary Resident Members</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-stone-900 dark:text-white font-mono text-sm">
                    {data?.community.owners || 0} ({data?.community.owners_pct || 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 dark:bg-[#141b24] border border-blue-200/80 dark:border-blue-900/50">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔑</span>
                    <div>
                      <span className="font-extrabold text-stone-900 dark:text-stone-100 block">Registered Tenants</span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">Verified Lease Holders</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-stone-900 dark:text-white font-mono text-sm">
                    {data?.community.renters || 0} ({data?.community.renters_pct || 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: FINANCIAL CASHFLOW & AMC LEDGER ────────────── */}
      {activeTab === "financials" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Monthly Cashflow Inflow vs Outflow Visualizer */}
          <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Monthly Cashflow Trajectory (Inflow vs. Outflow)
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Maintenance billing inflow vs utility and operational AMC outflow
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" /> Inflow
                </span>
                <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400">
                  <div className="w-3 h-3 rounded-full bg-rose-500" /> Outflow
                </span>
              </div>
            </div>

            {/* Visual Bar Graph */}
            <div className="space-y-4">
              {data?.financials.monthly_cashflow.map((m, idx) => {
                const maxVal = Math.max(
                  ...data.financials.monthly_cashflow.flatMap(x => [x.income, x.expense]),
                  200000
                );
                const inPct = Math.round((m.income / maxVal) * 100);
                const outPct = Math.round((m.expense / maxVal) * 100);

                return (
                  <div key={idx} className="p-4 rounded-2xl bg-stone-50/70 dark:bg-[#201a15] border border-stone-200/70 dark:border-[#332a22]">
                    <div className="flex justify-between items-center text-xs font-bold mb-2">
                      <span className="text-stone-900 dark:text-stone-100 font-mono text-sm">{m.month}</span>
                      <span className={`font-mono px-2 py-0.5 rounded-full text-[10px] ${
                        m.net >= 0
                          ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                          : "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300"
                      }`}>
                        Net: {m.net >= 0 ? "+" : ""}{formatINR(m.net)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 w-16">Inflow</span>
                        <div className="flex-1 bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${inPct}%` }} />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-stone-700 dark:text-stone-300 w-20 text-right">
                          {formatINR(m.income)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 w-16">Outflow</span>
                        <div className="flex-1 bg-stone-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${outPct}%` }} />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-stone-700 dark:text-stone-300 w-20 text-right">
                          {formatINR(m.expense)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category-wise Outflow Breakdown */}
          <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24]">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
              Operational & AMC Expense Breakdown by Channel
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
              Percentage distribution of society recurring expenses
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data?.financials.category_outflow.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-stone-50 dark:bg-[#201a15] border border-stone-200/80 dark:border-[#352c24] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div>
                      <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100 block">
                        {cat.category}
                      </span>
                      <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                        {cat.percentage}% of total expenses
                      </span>
                    </div>
                  </div>

                  <span className="text-sm font-extrabold font-mono text-stone-900 dark:text-white">
                    {formatINR(cat.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: FESTIVAL TURNOUT & DEMOGRAPHICS ─────────────── */}
      {activeTab === "events" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Demographic Age Group Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#24170e] dark:to-[#1c140d] border-orange-200/80 dark:border-orange-900/50">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 block">
                Adult Attendees (18-60 yrs)
              </span>
              <p className="text-2xl font-extrabold font-mono text-orange-900 dark:text-orange-200 mt-1">
                {data?.events.demographics.adults_count || 0} Passes
              </p>
              <p className="text-xs text-orange-700/80 dark:text-orange-400/80 mt-1">
                {data?.events.demographics.adults_pct || 0}% of community footfall
              </p>
            </div>

            <div className="card p-5 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-[#261e0b] dark:to-[#1b1508] border-amber-200/80 dark:border-amber-900/50">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Children Attendees (&lt;18 yrs)
              </span>
              <p className="text-2xl font-extrabold font-mono text-amber-900 dark:text-amber-200 mt-1">
                {data?.events.demographics.children_count || 0} Passes
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1">
                {data?.events.demographics.children_pct || 0}% of community footfall
              </p>
            </div>

            <div className="card p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0d2218] dark:to-[#091811] border-emerald-200/80 dark:border-emerald-900/50">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Senior Citizens (&gt;60 yrs)
              </span>
              <p className="text-2xl font-extrabold font-mono text-emerald-900 dark:text-emerald-200 mt-1">
                {data?.events.demographics.seniors_count || 0} Passes
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                {data?.events.demographics.seniors_pct || 0}% of community footfall
              </p>
            </div>
          </div>

          {/* RSVP Status Funnel */}
          <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24]">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
              Event RSVP Verification Status Funnel
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6">
              Track verification throughput and entry pass readiness
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="text-xl font-extrabold font-mono text-emerald-900 dark:text-emerald-200">
                    {data?.events.rsvp_funnel.approved || 0}
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block">
                    Approved QR Passes
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
                <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <span className="text-xl font-extrabold font-mono text-amber-900 dark:text-amber-200">
                    {data?.events.rsvp_funnel.pending || 0}
                  </span>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-bold block">
                    Pending Committee Review
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3">
                <XCircle className="w-8 h-8 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <span className="text-xl font-extrabold font-mono text-rose-900 dark:text-rose-200">
                    {data?.events.rsvp_funnel.rejected || 0}
                  </span>
                  <span className="text-xs text-rose-700 dark:text-rose-400 font-bold block">
                    Rejected (Re-apply Allowed)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Event Budget & P&L ROI Table */}
          <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24] overflow-hidden">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
              Event-by-Event P&L and ROI Performance
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Member contributions collected vs vendor expenses incurred per celebration
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 dark:bg-[#201a15] text-stone-500 dark:text-stone-400 uppercase font-mono text-[10px]">
                  <tr>
                    <th className="py-3 px-4 rounded-l-xl">Event Title</th>
                    <th className="py-3 px-4">Date & Venue</th>
                    <th className="py-3 px-4 text-center">Attendees</th>
                    <th className="py-3 px-4 text-right">Collections</th>
                    <th className="py-3 px-4 text-right">Expenses</th>
                    <th className="py-3 px-4 text-right rounded-r-xl">Net P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-[#2d251e]">
                  {data?.events.performance.map((ev) => (
                    <tr key={ev.id} className="hover:bg-stone-50/50 dark:hover:bg-[#221c17] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-stone-900 dark:text-stone-100">
                        {ev.title}
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 dark:text-stone-400">
                        <span>{ev.date}</span> • <span className="text-[11px]">{ev.venue}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-800 dark:text-stone-200">
                        {ev.attendees}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {formatINR(ev.collection)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                        {formatINR(ev.expense)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          ev.net_balance >= 0
                            ? "bg-blue-100 dark:bg-sky-950/70 text-blue-800 dark:text-sky-300"
                            : "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300"
                        }`}>
                          {ev.net_balance >= 0 ? "+" : ""}{formatINR(ev.net_balance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: COMMUNITY & LOCAL VENDORS ───────────────────── */}
      {activeTab === "community" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Network Distribution */}
            <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24]">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-[#2f2720] mb-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Verified Vendor Ecosystem
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Service partners active in Dombivli / Runwal Gardens
                  </p>
                </div>
                <Link href="/vendors" className="btn-secondary text-xs py-1.5 px-3">
                  Directory →
                </Link>
              </div>

              <div className="space-y-3">
                {data?.vendors.categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-[#201a15] border border-stone-200/70 dark:border-[#352c24]"
                  >
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {cat.category}
                    </span>
                    <span className="text-xs font-mono font-extrabold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-900">
                      {cat.count} Partners
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Rated Community Service Partners */}
            <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24]">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">
                Top Rated Local Service Partners
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
                Recommended by Tower 24 residents
              </p>

              <div className="space-y-3">
                {data?.vendors.top_vendors.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl bg-stone-50 dark:bg-[#201a15] border border-stone-200/70 dark:border-[#352c24] flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100">
                        {v.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                        <span>{v.category}</span>
                        <span>•</span>
                        <span className="font-mono">{v.phone}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800 text-xs font-extrabold font-mono">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{v.rating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
