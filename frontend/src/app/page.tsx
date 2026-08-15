"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { fetchEvents, fetchLedgerSummary, fetchVendors, EventItem, LedgerSummaryData, VendorItem } from "@/lib/api";
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
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummaryData | null>(null);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      fetchEvents().catch(() => []),
      fetchLedgerSummary().catch(() => null),
      fetchVendors().catch(() => []),
    ]).then(([ev, sum, ven]) => {
      setEvents(ev);
      setSummary(sum);
      setVendors(ven);
    }).finally(() => setLoading(false));
  }, [user]);

  const upcomingEvents = events.filter(e => new Date(e.event_date) > new Date());
  const pendingRSVPs = events.reduce((acc, e) => acc + (e.rsvps?.filter(r => r.status === "pending").length || 0), 0);
  const totalCollected = events.reduce((acc, e) => acc + e.total_collected, 0);

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <AppShell>
      {!user ? (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
            <Building2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to ResidentHub</h1>
          <p className="text-slate-500 max-w-md mb-8">
            Your all-in-one society management portal. Sign in to access events, financial records, and vendor directory.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg w-full">
            <div className="card p-4 text-center">
              <Calendar className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">Events & RSVP</p>
            </div>
            <div className="card p-4 text-center">
              <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">Transparent Ledger</p>
            </div>
            <div className="card p-4 text-center">
              <Users className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">Vendor Directory</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {getGreeting()}, {user.full_name.split(" ")[0]}!
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {user.role === "admin" ? "Admin Dashboard — Manage your society" : "Your society at a glance"}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card p-5 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-slate-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="card stat-balance p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Fund Balance</span>
                    <DollarSign className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{formatINR(summary?.current_balance || 0)}</p>
                  <p className="text-xs text-blue-600 mt-1">Current net balance</p>
                </div>

                <div className="card stat-income p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Total Income</span>
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">{formatINR(summary?.total_income || 0)}</p>
                  <p className="text-xs text-emerald-600 mt-1">All-time collections</p>
                </div>

                <div className="card stat-expense p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-red-700 uppercase tracking-wide">Total Expenses</span>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">{formatINR(summary?.total_expense || 0)}</p>
                  <p className="text-xs text-red-600 mt-1">All-time expenditure</p>
                </div>

                <div className="card stat-neutral p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Events</span>
                    <Calendar className="w-5 h-5 text-yellow-500" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-900">{events.length}</p>
                  <p className="text-xs text-yellow-600 mt-1">{upcomingEvents.length} upcoming</p>
                </div>
              </div>

              {/* Quick Actions & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Events */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Upcoming Events</h2>
                    <Link href="/events" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      View All <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4">No upcoming events</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingEvents.slice(0, 3).map((ev) => (
                        <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{ev.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {new Date(ev.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              {ev.fee_per_person > 0 && ` • ₹${ev.fee_per_person}/person`}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            {ev.rsvps_count} RSVPs
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Info */}
                <div className="card p-6">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Overview</h2>
                  <div className="space-y-3">
                    {user.role === "admin" && pendingRSVPs > 0 && (
                      <Link href="/events" className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-800">{pendingRSVPs} Pending RSVP{pendingRSVPs > 1 ? "s" : ""}</p>
                          <p className="text-xs text-amber-600">Review and approve/reject</p>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-amber-500" />
                      </Link>
                    )}

                    <Link href="/vendors" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all">
                      <Users className="w-5 h-5 text-slate-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">{vendors.length} Verified Vendors</p>
                        <p className="text-xs text-slate-500">Electricians, plumbers, doctors & more</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-400" />
                    </Link>

                    <Link href="/ledger" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all">
                      <DollarSign className="w-5 h-5 text-slate-500 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800">Financial Transparency</p>
                        <p className="text-xs text-slate-500">View all society income & expenses</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate-400" />
                    </Link>

                    {totalCollected > 0 && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-emerald-800">{formatINR(totalCollected)} Collected via Events</p>
                          <p className="text-xs text-emerald-600">From approved RSVPs</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}
