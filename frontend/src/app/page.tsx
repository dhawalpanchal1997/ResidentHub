"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchEvents,
  fetchLedgerSummary,
  fetchVendors,
  EventItem,
  LedgerSummaryData,
  VendorItem,
} from "@/lib/api";
import {
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Building2,
  Sparkles,
  ArrowRight,
  Shield,
  Phone,
  MessageSquare,
  Receipt,
  Tag,
  Plus,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummaryData | null>(null);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetchEvents().catch(() => []),
      fetchLedgerSummary().catch(() => null),
      fetchVendors().catch(() => []),
    ])
      .then(([ev, sum, ven]) => {
        setEvents(ev);
        setSummary(sum);
        setVendors(ven);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const upcomingEvents = events.filter((e) => new Date(e.event_date) > new Date());
  const pendingRSVPs = events.reduce(
    (acc, e) => acc + (e.rsvps?.filter((r) => r.status === "pending").length || 0),
    0
  );
  const totalCollected = events.reduce((acc, e) => acc + e.total_collected, 0);

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AppShell>
      {!user ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-6 animate-pulse">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Welcome to ResidentHub
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mb-8 leading-relaxed">
            The modern operating system for residential societies. Experience transparent financial ledgers, age-tiered event ticketing, and a verified vendor directory.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
            <div className="card p-5 text-center hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Events & RSVPs</h3>
              <p className="text-xs text-slate-500">Tiered ticketing & family headcounts</p>
            </div>
            <div className="card p-5 text-center hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Financial Ledger</h3>
              <p className="text-xs text-slate-500">AI bank statement reconciliation</p>
            </div>
            <div className="card p-5 text-center hover:border-emerald-300 transition-all">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Vendor Directory</h3>
              <p className="text-xs text-slate-500">Verified contacts & resident ratings</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-slate-950/10 border border-slate-700/60 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentDateStr}
                </span>
                <span className="text-xs text-slate-400 font-medium">Runwal Gardens T24</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {getGreeting()}, {user.full_name.split(" ")[0]}! 👋
              </h1>
              <p className="text-sm text-slate-300 mt-1 max-w-xl">
                {isAdmin
                  ? "Admin Control Center — Overview of society funds, pending RSVPs, and active event budgets."
                  : `Welcome back to your society portal. You are registered in Flat ${user.flat_number}.`}
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-2.5 shrink-0">
              <Link href="/events" className="btn-primary text-xs py-2 px-4 shadow-lg shadow-emerald-500/30">
                <Calendar className="w-3.5 h-3.5" />
                View Events
              </Link>
              {isAdmin && (
                <Link
                  href="/ledger"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  AI Ledger
                </Link>
              )}
            </div>

            {/* Decorative background glow */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-slate-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* 4 High-Impact Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Fund Balance */}
                <div className="stat-card-balance p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">Society Fund Balance</span>
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold tracking-tight font-mono">
                      {formatINR(summary?.current_balance || 0)}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      Live Verified Ledger
                    </p>
                  </div>
                </div>

                {/* 2. Total Inflow */}
                <div className="stat-card-income p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800">Total Inflow / Credits</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-700" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold text-emerald-950 font-mono">
                      {formatINR(summary?.total_income || 0)}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                      Maintenance & Event RSVPs
                    </p>
                  </div>
                </div>

                {/* 3. Total Outflow */}
                <div className="stat-card-expense p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-rose-800">Total Outflow / Debits</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-rose-700" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold text-rose-950 font-mono">
                      {formatINR(summary?.total_expense || 0)}
                    </p>
                    <p className="text-[11px] text-rose-700 font-medium mt-1">
                      Utilities, AMC & Vendor Bills
                    </p>
                  </div>
                </div>

                {/* 4. Active Events & RSVPs */}
                <div className="stat-card-neutral p-5 rounded-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Upcoming Events</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-200/80 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-700" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-extrabold text-slate-900 font-mono">
                      {upcomingEvents.length} Active
                    </p>
                    <p className="text-[11px] text-slate-600 font-medium mt-1">
                      {pendingRSVPs > 0 ? `${pendingRSVPs} RSVPs pending approval` : "All RSVPs processed"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main 2-Column Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2 Cols): Upcoming Events & Actions */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Upcoming Events Showcase */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Upcoming Society Events</h2>
                        <p className="text-xs text-slate-500">Participate with family & reserve spots</p>
                      </div>
                      <Link
                        href="/events"
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        All Events <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {upcomingEvents.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-600">No upcoming events right now</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.slice(0, 3).map((ev) => {
                          const evDate = new Date(ev.event_date);
                          const isFree =
                            (ev.fee_adult || ev.fee_per_person || 0) === 0 &&
                            (ev.fee_child || 0) === 0 &&
                            (ev.fee_senior || 0) === 0;

                          return (
                            <Link
                              key={ev.id}
                              href="/events"
                              className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200/70 hover:border-slate-300 transition-all group"
                            >
                              {/* Date Block */}
                              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                <span className="text-[9px] font-bold text-rose-600 uppercase">
                                  {evDate.toLocaleDateString("en-IN", { month: "short" })}
                                </span>
                                <span className="text-base font-extrabold text-slate-900 leading-none">
                                  {evDate.getDate()}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 truncate">
                                  {ev.title}
                                </h3>
                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 truncate">
                                  <span>{ev.venue || "Clubhouse"}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700">
                                    {ev.total_attendees} Confirmed Attendees
                                  </span>
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                {isFree ? (
                                  <span className="badge bg-emerald-100 text-emerald-800">Free</span>
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-900 font-mono">
                                    {formatINR(ev.fee_adult || ev.fee_per_person || 0)}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Financial Category Breakdown Overview */}
                  {summary && summary.category_breakdown && (
                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h2 className="text-base font-bold text-slate-900">Expense Breakdown by Category</h2>
                          <p className="text-xs text-slate-500">Major society utility & AMC outflow channels</p>
                        </div>
                        <Link
                          href="/ledger"
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          View Ledger <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {summary.category_breakdown.slice(0, 6).map((cat) => {
                          const pct = summary.total_expense > 0 ? (cat.amount / summary.total_expense) * 100 : 0;
                          return (
                            <div key={cat.category} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-slate-700">{cat.category}</span>
                                <span className="text-xs font-bold text-slate-900 font-mono">
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
                </div>

                {/* Right Column (1 Col): Quick Verified Vendors & Society Notices */}
                <div className="space-y-6">
                  {/* Verified Service Providers Quick Connect */}
                  <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">Emergency Contacts</h2>
                        <p className="text-xs text-slate-500">Verified society service partners</p>
                      </div>
                      <Link
                        href="/vendors"
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        All <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="space-y-2.5">
                      {vendors.slice(0, 4).map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all"
                        >
                          <div className="min-w-0 flex-1 mr-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{v.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{v.category}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {v.phone_number && (
                              <a
                                href={`tel:${v.phone_number}`}
                                className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 shadow-sm"
                                title="Call"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {v.whatsapp_number && (
                              <a
                                href={`https://wa.me/${v.whatsapp_number.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 shadow-sm"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Society Committee Notice Board */}
                  <div className="card p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200/80">
                    <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold text-xs">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      Managing Committee Advisory
                    </div>
                    <p className="text-xs text-emerald-950 leading-relaxed">
                      Please ensure all event RSVP payments include your flat number in the transaction remarks for instant automated verification.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AppShell>
  );
}
