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
  Clock,
  Building2,
  Sparkles,
  ArrowRight,
  Shield,
  Phone,
  MessageSquare,
  ChevronRight,
  Zap,
  CheckCircle2,
  Radio,
  Home,
} from "lucide-react";
import Link from "next/link";
import HousingHeroVisual from "@/components/HousingHeroVisual";
import AnimatedCounter from "@/components/AnimatedCounter";

const LIVE_NOTICES = [
  "🎉 Flat B-201 RSVP approved for Diwali Grand Celebration!",
  "⚡ Common area rooftop solar meter synced with grid",
  "🛡️ 24/7 Gate security patrol shift check complete",
  "💧 Water reservoir tank level: 94% (Normal)",
  "🏢 Schindler Lift A & B scheduled quarterly AMC complete",
];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummaryData | null>(null);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Society Notice Rotation (useEffect animation)
  const [noticeIndex, setNoticeIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setNoticeIndex((prev) => (prev + 1) % LIVE_NOTICES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

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

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <AppShell>
      {!user ? (
        <div className="flex flex-col items-center justify-center min-h-[75vh] text-center max-w-3xl mx-auto space-y-8">
          <HousingHeroVisual />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
            <div className="card p-5 text-center card-entrance stagger-1">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Events & RSVPs</h3>
              <p className="text-xs text-slate-500">Tiered pricing & family headcounts</p>
            </div>
            <div className="card p-5 text-center card-entrance stagger-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Financial Ledger</h3>
              <p className="text-xs text-slate-500">AI bank statement reconciliation</p>
            </div>
            <div className="card p-5 text-center card-entrance stagger-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Vendor Directory</h3>
              <p className="text-xs text-slate-500">Verified contacts & resident ratings</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Housing Hero Visual Header */}
          <HousingHeroVisual />

          {/* Live Society Pulse Radar Ticker */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm overflow-hidden text-xs">
            <div className="flex items-center gap-1.5 shrink-0 text-emerald-400 font-bold font-mono">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>LIVE FEED:</span>
            </div>
            <div className="flex-1 truncate font-medium text-slate-300 transition-all duration-500 key={noticeIndex}">
              {LIVE_NOTICES[noticeIndex]}
            </div>
            <div className="shrink-0 flex items-center gap-1 text-[11px] text-slate-400 font-mono hidden sm:flex">
              <span>96 FLATS CONNECTED</span>
            </div>
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
              {/* 4 High-Impact Metric Cards with useEffect Animated Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Fund Balance */}
                <div className="stat-card-balance p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 font-mono">SOCIETY RESERVE</span>
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold tracking-tight font-mono">
                      <AnimatedCounter
                        value={summary?.current_balance || 0}
                        formatter={formatINR}
                      />
                    </p>
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      Live Verified Ledger
                    </p>
                  </div>
                </div>

                {/* 2. Total Inflow */}
                <div className="stat-card-income p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-amber-300 font-mono">TOTAL INFLOW</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-700 dark:text-amber-300" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-emerald-950 dark:text-amber-100 font-mono">
                      <AnimatedCounter
                        value={summary?.total_income || 0}
                        formatter={(val) => `+${formatINR(val)}`}
                      />
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-amber-200/90 font-medium mt-1">
                      Maintenance & Event RSVPs
                    </p>
                  </div>
                </div>

                {/* 3. Total Outflow */}
                <div className="stat-card-expense p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 font-mono">TOTAL OUTFLOW</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-rose-700 dark:text-rose-300" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-rose-950 dark:text-rose-100 font-mono">
                      <AnimatedCounter
                        value={summary?.total_expense || 0}
                        formatter={(val) => `-${formatINR(val)}`}
                      />
                    </p>
                    <p className="text-[11px] text-rose-700 dark:text-rose-200/90 font-medium mt-1">
                      Utilities & Vendor Invoices
                    </p>
                  </div>
                </div>

                {/* 4. Active Events */}
                <div className="stat-card-neutral p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-teal-300 font-mono">UPCOMING EVENTS</span>
                    <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-teal-900/50 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-slate-700 dark:text-teal-300" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-teal-100 font-mono">
                      <AnimatedCounter
                        value={upcomingEvents.length}
                        suffix=" Active"
                      />
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-teal-200/90 font-medium mt-1">
                      {pendingRSVPs > 0 ? `${pendingRSVPs} RSVPs pending verification` : "All RSVPs reconciled"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main 2-Column Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2 Cols): Upcoming Events & Actions */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Upcoming Events Showcase */}
                  <div className="card p-6 card-entrance stagger-2">
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
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-medium text-slate-600">No upcoming events right now</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.slice(0, 3).map((ev) => {
                          const evDate = new Date(ev.event_date);
                          const userRsvp = user && ev.rsvps?.find(r => r.user_id === user.id || r.flat_number.toLowerCase() === user.flat_number.toLowerCase());
                          const isFree =
                            (ev.fee_adult || ev.fee_per_person || 0) === 0 &&
                            (ev.fee_child || 0) === 0 &&
                            (ev.fee_senior || 0) === 0;

                          return (
                            <Link
                              key={ev.id}
                              href="/events"
                              className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8fafc] hover:bg-white dark:bg-[#211d19] dark:hover:bg-[#2a2420] border border-[#e2e8f0] hover:border-amber-400 dark:border-[#38322c] dark:hover:border-amber-500/50 hover:shadow-md transition-all group"
                            >
                              {/* Date Block */}
                              <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#171412] border border-[#e2e8f0] dark:border-[#38322c] flex flex-col items-center justify-center shrink-0 shadow-sm">
                                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                                  {evDate.toLocaleDateString("en-IN", { month: "short" })}
                                </span>
                                <span className="text-base font-extrabold text-slate-900 dark:text-stone-100 leading-none">
                                  {evDate.getDate()}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate flex items-center gap-2">
                                  <span>{ev.title}</span>
                                  {userRsvp && userRsvp.status === "approved" && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 shrink-0">
                                      🎟️ Ticket QR Ready
                                    </span>
                                  )}
                                  {userRsvp && userRsvp.status === "pending" && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 shrink-0">
                                      ⏳ RSVP Pending
                                    </span>
                                  )}
                                  {userRsvp && userRsvp.status === "rejected" && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-700 shrink-0">
                                      ❌ RSVP Rejected
                                    </span>
                                  )}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-stone-400 flex items-center gap-2 mt-0.5 truncate">
                                  <span>{ev.venue || "Clubhouse"}</span>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700 dark:text-stone-300">
                                    {ev.total_attendees} Confirmed Attendees
                                  </span>
                                </p>
                              </div>

                              <div className="shrink-0 text-right">
                                {isFree ? (
                                  <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">Free</span>
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-900 dark:text-stone-100 font-mono">
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
                    <div className="card p-6 card-entrance stagger-3">
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
                            <div key={cat.category} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-semibold text-slate-700">{cat.category}</span>
                                <span className="text-xs font-bold text-slate-900 font-mono">
                                  {formatINR(cat.amount)}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-slate-800 h-full rounded-full transition-all duration-700"
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
                  <div className="card p-6 card-entrance stagger-2">
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
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 hover:bg-white transition-all"
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
                  <div className="card p-5 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white border-emerald-500/30 card-entrance stagger-3 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-xs">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Managing Committee Notice
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
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
