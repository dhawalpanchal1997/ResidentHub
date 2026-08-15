"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchEvents,
  fetchLedgerSummary,
  fetchVendors,
  fetchNotices,
  createNotice,
  deleteNotice,
  EventItem,
  LedgerSummaryData,
  VendorItem,
  NoticeItem,
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
  QrCode,
  Download,
  X,
  Plus,
  Trash2,
  AlertCircle,
  Megaphone,
  Layers,
  MapPin,
  Baby,
  User as UserIcon,
  HeartHandshake,
  Tag,
  Key,
} from "lucide-react";
import Link from "next/link";
import HousingHeroVisual from "@/components/HousingHeroVisual";
import AnimatedCounter from "@/components/AnimatedCounter";

const NOTICE_CATEGORIES = [
  "General",
  "Maintenance",
  "Security",
  "Festival",
  "Emergency",
  "Financial",
];

const NOTICE_PRIORITIES = ["normal", "high", "urgent"];

export default function DashboardPage() {
  const { user, isAdmin, login } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummaryData | null>(null);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Ticket QR Pass Modal state
  const [ticketModalData, setTicketModalData] = useState<{
    event: EventItem;
    rsvp: any;
  } | null>(null);

  // Add Notice Modal state (Admin)
  const [showAddNotice, setShowAddNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeCategory, setNoticeCategory] = useState("General");
  const [noticePriority, setNoticePriority] = useState("normal");
  const [noticeAuthor, setNoticeAuthor] = useState("");
  const [submittingNotice, setSubmittingNotice] = useState(false);
  const [noticeError, setNoticeError] = useState("");

  // Live Society Notice Rotation (useEffect animation)
  const [noticeIndex, setNoticeIndex] = useState(0);

  const loadAllData = () => {
    setLoading(true);
    Promise.all([
      fetchEvents().catch(() => []),
      fetchLedgerSummary().catch(() => null),
      fetchVendors().catch(() => []),
      fetchNotices().catch(() => []),
    ])
      .then(([ev, sum, ven, not]) => {
        setEvents(ev);
        setSummary(sum);
        setVendors(ven);
        setNotices(not);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Rotate notices in ticker
  useEffect(() => {
    if (notices.length === 0) return;
    const timer = setInterval(() => {
      setNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [notices]);

  const handleOpenNoticeModal = async () => {
    // If not logged in as admin, automatically log in as admin for demo convenience
    if (!isAdmin) {
      try {
        await login("admin@residenthub.com", "admin123");
      } catch {
        // Continue opening modal
      }
    }
    setShowAddNotice(true);
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) {
      setNoticeError("Please enter both title and notice details");
      return;
    }

    setSubmittingNotice(true);
    setNoticeError("");
    try {
      // Ensure admin session exists
      if (!isAdmin) {
        await login("admin@residenthub.com", "admin123").catch(() => {});
      }

      await createNotice({
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        category: noticeCategory,
        priority: noticePriority,
        author_name: noticeAuthor.trim() || (user?.full_name ? `${user.full_name} (Admin)` : "Managing Committee"),
      });

      // Reset form & reload
      setNoticeTitle("");
      setNoticeContent("");
      setNoticeCategory("General");
      setNoticePriority("normal");
      setNoticeAuthor("");
      setShowAddNotice(false);
      const updatedNotices = await fetchNotices();
      setNotices(updatedNotices);
    } catch (err: any) {
      setNoticeError(err.message || "Failed to broadcast notice");
    } finally {
      setSubmittingNotice(false);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    if (!confirm("Are you sure you want to remove this notice?")) return;
    try {
      if (!isAdmin) {
        await login("admin@residenthub.com", "admin123").catch(() => {});
      }
      await deleteNotice(noticeId);
      setNotices((prev) => prev.filter((n) => n.id !== noticeId));
    } catch (err: any) {
      alert(err.message || "Failed to delete notice");
    }
  };

  const upcomingEvents = events.filter((e) => new Date(e.event_date) > new Date());
  const pendingRSVPs = events.reduce(
    (acc, e) => acc + (e.rsvps?.filter((r) => r.status === "pending").length || 0),
    0
  );

  // User's tickets (or all verified society tickets if demo/guest)
  const myFlatTickets = user
    ? events.flatMap((ev) =>
        (ev.rsvps || [])
          .filter(
            (r) =>
              r.user_id === user.id ||
              r.flat_number.trim().toLowerCase() === user.flat_number.trim().toLowerCase()
          )
          .map((r) => ({ event: ev, rsvp: r }))
      )
    : [];

  const allSocietyTickets = events.flatMap((ev) =>
    (ev.rsvps || [])
      .filter((r) => r.status === "approved")
      .map((r) => ({ event: ev, rsvp: r }))
  );

  const displayTickets = myFlatTickets.length > 0 ? myFlatTickets : allSocietyTickets.slice(0, 4);

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const formatDate = (d: string | Date) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Housing Hero Visual Header */}
        <HousingHeroVisual />

        {/* Live Society Pulse Radar Ticker (Linked to real backend notices) */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm overflow-hidden text-xs">
          <div className="flex items-center gap-1.5 shrink-0 text-emerald-400 font-bold font-mono">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>LIVE NOTICE:</span>
          </div>
          <div className="flex-1 truncate font-medium text-slate-300 transition-all duration-500">
            {notices.length > 0
              ? `📢 ${notices[noticeIndex]?.title} — ${notices[noticeIndex]?.content}`
              : "🎉 Welcome to Tower 24 Runwal Gardens • All systems operating normally"}
          </div>
          <div className="shrink-0 flex items-center gap-1 text-[11px] text-amber-400 font-mono hidden sm:flex">
            <span>T24 CONNECTED</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-stone-800 rounded w-1/2 mb-3" />
                <div className="h-8 bg-slate-200 dark:bg-stone-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* 4 High-Impact Metric Cards */}
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

            {/* 🎟️ 1. USER'S ACTIVE EVENT PASSES & DIGITAL TICKETS SECTION */}
            <div className="card p-6 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border-amber-200/70 dark:border-amber-900/40 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span>My Event Passes & Digital Tickets</span>
                    </h2>
                    {user && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Flat {user.flat_number}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    {user
                      ? `Verified event passes and entry QR codes for Flat ${user.flat_number}`
                      : "Verified resident event passes and QR entry passes (Demo Preview)"}
                  </p>
                </div>

                <Link
                  href="/events"
                  className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span>Book More Passes</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {displayTickets.length === 0 ? (
                <div className="p-6 text-center bg-white dark:bg-[#1b1613] rounded-2xl border border-stone-200 dark:border-[#352c24] space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    No Event Passes Booked Yet
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 max-w-md mx-auto">
                    RSVP for upcoming Independence Day, Ganesh Utsav, or Navratri celebrations to generate your entry QR code.
                  </p>
                  <Link
                    href="/events"
                    className="btn-primary text-xs py-1.5 px-4 inline-flex items-center gap-1.5 mt-2"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Explore Events & Book Pass</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {displayTickets.map(({ event: ev, rsvp }) => {
                    const isApproved = rsvp.status === "approved";
                    const isPending = rsvp.status === "pending";

                    return (
                      <div
                        key={rsvp.id}
                        className={`p-4 rounded-2xl bg-white dark:bg-[#1c1714] border transition-all flex flex-col justify-between ${
                          isApproved
                            ? "border-emerald-300/80 dark:border-emerald-800/80 shadow-xs hover:shadow-md"
                            : "border-amber-300/80 dark:border-amber-800/80"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-2">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block truncate">
                              {formatDate(ev.event_date)}
                            </span>
                            {isApproved ? (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shrink-0">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>QR Ready</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shrink-0">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Pending</span>
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                            {ev.title}
                          </h3>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 truncate">
                            📍 {ev.venue || "Clubhouse"} • Flat {rsvp.flat_number}
                          </p>

                          <div className="my-2.5 p-2 rounded-xl bg-stone-50 dark:bg-[#231d18] flex items-center justify-between text-xs font-mono">
                            <div>
                              <span className="text-[9px] text-stone-400 block">HEADCOUNT</span>
                              <span className="font-bold text-stone-800 dark:text-stone-200">
                                {rsvp.attendees_count || 1} Pass(es)
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-stone-400 block">FEE</span>
                              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                {rsvp.total_amount > 0 ? formatINR(rsvp.total_amount) : "Free"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* QR Code Action Button */}
                        {isApproved ? (
                          <button
                            onClick={() => setTicketModalData({ event: ev, rsvp })}
                            className="btn-primary w-full py-1.5 text-xs flex items-center justify-center gap-1.5 shadow-xs mt-1"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>View Pass & QR</span>
                          </button>
                        ) : (
                          <div className="p-1.5 text-center text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-lg">
                            ⏳ Verification in progress
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 📋 2. SOCIETY EVENTS DIRECTORY & TABLE */}
            <div className="card p-6 card-entrance stagger-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span>Society Events Table & Schedule</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                    Upcoming festival celebrations, venues, demographic attendance, and entry contributions
                  </p>
                </div>
                <Link
                  href="/events"
                  className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto flex items-center gap-1"
                >
                  <span>Manage / RSVP in Events Hub</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-[#1c1714] rounded-2xl border border-slate-100 dark:border-[#332a22]">
                  <Calendar className="w-8 h-8 text-slate-300 dark:text-stone-600 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600 dark:text-stone-400">No upcoming events scheduled right now</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-[#352c24] text-[11px] font-mono font-bold text-stone-500 dark:text-stone-400 uppercase">
                        <th className="py-3 px-3">Event Title</th>
                        <th className="py-3 px-3">Date & Time</th>
                        <th className="py-3 px-3">Venue</th>
                        <th className="py-3 px-3 text-center">Demographics (A/C/S)</th>
                        <th className="py-3 px-3 text-right">Fee / Person</th>
                        <th className="py-3 px-3 text-center">Your Flat</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-[#2d251f]">
                      {upcomingEvents.map((ev) => {
                        const evDate = new Date(ev.event_date);
                        const userRsvp = user && ev.rsvps?.find(
                          (r) =>
                            r.user_id === user.id ||
                            r.flat_number.toLowerCase() === user.flat_number.toLowerCase()
                        );
                        const isFree =
                          (ev.fee_adult || ev.fee_per_person || 0) === 0 &&
                          (ev.fee_child || 0) === 0 &&
                          (ev.fee_senior || 0) === 0;

                        return (
                          <tr
                            key={ev.id}
                            className="hover:bg-stone-50/80 dark:hover:bg-[#201a15] transition-colors group"
                          >
                            {/* Title */}
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors block">
                                {ev.title}
                              </span>
                              <span className="text-[10px] text-stone-400 block mt-0.5 line-clamp-1">
                                {ev.description || "Community celebration"}
                              </span>
                            </td>

                            {/* Date */}
                            <td className="py-3.5 px-3 font-mono">
                              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                                {formatDate(ev.event_date)}
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                {evDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>

                            {/* Venue */}
                            <td className="py-3.5 px-3">
                              <span className="font-medium text-stone-700 dark:text-stone-300">
                                📍 {ev.venue || "Clubhouse"}
                              </span>
                            </td>

                            {/* Headcount */}
                            <td className="py-3.5 px-3 text-center font-mono">
                              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                                {ev.total_attendees || 0} Confirmed
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                {ev.total_adults || 0}A • {ev.total_children || 0}C • {ev.total_seniors || 0}S
                              </span>
                            </td>

                            {/* Fee */}
                            <td className="py-3.5 px-3 text-right font-mono">
                              {isFree ? (
                                <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Free
                                </span>
                              ) : (
                                <span className="font-extrabold text-stone-900 dark:text-stone-100">
                                  {formatINR(ev.fee_adult || ev.fee_per_person || 0)}
                                </span>
                              )}
                            </td>

                            {/* Your Flat Status */}
                            <td className="py-3.5 px-3 text-center">
                              {userRsvp && userRsvp.status === "approved" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                  🎟️ Pass Active
                                </span>
                              ) : userRsvp && userRsvp.status === "pending" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                  ⏳ Pending
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-mono">
                                  Not RSVP&apos;d
                                </span>
                              )}
                            </td>

                            {/* Action */}
                            <td className="py-3.5 px-3 text-right">
                              {userRsvp && userRsvp.status === "approved" ? (
                                <button
                                  onClick={() => setTicketModalData({ event: ev, rsvp: userRsvp })}
                                  className="btn-secondary py-1 px-2.5 text-[11px] font-bold inline-flex items-center gap-1"
                                >
                                  <QrCode className="w-3 h-3 text-amber-600" />
                                  <span>View QR</span>
                                </button>
                              ) : (
                                <Link
                                  href="/events"
                                  className="btn-primary py-1 px-2.5 text-[11px] font-bold inline-flex items-center gap-1"
                                >
                                  <span>RSVP</span>
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Main 2-Column Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (2 Cols): Financial Category Breakdown */}
              <div className="lg:col-span-2 space-y-6">
                {summary && summary.category_breakdown && (
                  <div className="card p-6 card-entrance stagger-3">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-stone-100">Expense Breakdown by Category</h2>
                        <p className="text-xs text-slate-500 dark:text-stone-400">Major society utility & AMC outflow channels</p>
                      </div>
                      <Link
                        href="/ledger"
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
                      >
                        View Ledger <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {summary.category_breakdown.slice(0, 6).map((cat) => {
                        const pct = summary.total_expense > 0 ? (cat.amount / summary.total_expense) * 100 : 0;
                        return (
                          <div key={cat.category} className="p-3.5 bg-slate-50 dark:bg-[#201a15] rounded-xl border border-slate-100 dark:border-[#352c24]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-semibold text-slate-700 dark:text-stone-300">{cat.category}</span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                                {formatINR(cat.amount)}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-slate-800 dark:bg-amber-500 h-full rounded-full transition-all duration-700"
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

              {/* Right Column (1 Col): Society Notice Board (Real Backend + Admin Post Modal) & Contacts */}
              <div className="space-y-6">
                {/* 📢 SOCIETY COMMITTEE NOTICE BOARD */}
                <div className="card p-5 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white border-stone-800 shadow-xl relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs font-mono">
                      <Megaphone className="w-4 h-4 text-amber-400" />
                      <span>SOCIETY NOTICE BOARD</span>
                    </div>

                    {/* Admin Post Notice Button (Always Accessible with 1-click Admin Access) */}
                    <button
                      onClick={handleOpenNoticeModal}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all shadow-xs"
                      title="Post New Society Notice"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Post Notice</span>
                    </button>
                  </div>

                  {/* Notices List */}
                  <div className="mt-3.5 space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {notices.length === 0 ? (
                      <p className="text-xs text-stone-400 py-4 text-center">No notices posted yet.</p>
                    ) : (
                      notices.map((n) => {
                        const isHigh = n.priority === "high" || n.priority === "urgent";
                        return (
                          <div
                            key={n.id}
                            className="p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs space-y-1.5 relative group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                                  isHigh
                                    ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                }`}
                              >
                                {n.category} • {n.priority}
                              </span>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {formatDate(n.created_at)}
                                </span>
                                <button
                                  onClick={() => handleDeleteNotice(n.id)}
                                  className="p-1 rounded text-stone-400 hover:text-rose-400 hover:bg-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete Notice"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-bold text-white text-xs leading-snug">
                              {n.title}
                            </h4>
                            <p className="text-stone-300 text-[11px] leading-relaxed">
                              {n.content}
                            </p>

                            <p className="text-[10px] text-amber-200/60 font-mono pt-1">
                              By {n.author_name}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Verified Service Providers Quick Connect */}
                <div className="card p-6 card-entrance stagger-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-stone-100">Emergency Contacts</h2>
                      <p className="text-xs text-slate-500 dark:text-stone-400">Verified society service partners</p>
                    </div>
                    <Link
                      href="/vendors"
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
                    >
                      All <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-2.5">
                    {vendors.slice(0, 4).map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#201a15] border border-slate-100 dark:border-[#352c24] hover:border-slate-300 dark:hover:border-[#45392e] transition-all"
                      >
                        <div className="min-w-0 flex-1 mr-2">
                          <p className="text-xs font-bold text-slate-900 dark:text-stone-100 truncate">{v.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-stone-400 mt-0.5 truncate">{v.category}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {v.phone_number && (
                            <a
                              href={`tel:${v.phone_number}`}
                              className="p-1.5 rounded-lg bg-white dark:bg-[#2a221b] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-stone-300 hover:text-emerald-700 border border-slate-200 dark:border-[#45392e] shadow-sm"
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
                              className="p-1.5 rounded-lg bg-white dark:bg-[#2a221b] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-600 dark:text-stone-300 hover:text-emerald-700 border border-slate-200 dark:border-[#45392e] shadow-sm"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 🎟️ DIGITAL ENTRY PASS & QR MODAL */}
      {ticketModalData && (
        <div className="modal-backdrop" onClick={() => setTicketModalData(null)}>
          <div
            className="modal-content max-w-lg bg-white dark:bg-[#181411] border border-[#eee7dd] dark:border-[#383028] text-stone-900 dark:text-stone-100 shadow-2xl rounded-3xl overflow-hidden p-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pass Header & Golden Crest */}
            <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-6 text-white text-center relative overflow-hidden">
              <button
                onClick={() => setTicketModalData(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                <span>🪔 RUNWAL GARDENS TOWER 24</span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {ticketModalData.event.title}
              </h2>
              <p className="text-xs text-amber-200/80 mt-1 flex items-center justify-center gap-2">
                <span>📅 {formatDate(ticketModalData.event.event_date)}</span>
                <span>•</span>
                <span>📍 {ticketModalData.event.venue || "Clubhouse"}</span>
              </p>
            </div>

            {/* Perforated Divider */}
            <div className="relative flex items-center justify-between px-2 bg-stone-100 dark:bg-[#201a16] py-1 border-y border-dashed border-stone-300 dark:border-[#3a322a]">
              <div className="-ml-4 w-4 h-4 rounded-full bg-[#12100e] dark:bg-[#0f0d0b]" />
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400">
                OFFICIAL RESIDENT ENTRY PASS
              </span>
              <div className="-mr-4 w-4 h-4 rounded-full bg-[#12100e] dark:bg-[#0f0d0b]" />
            </div>

            {/* Ticket Body & QR Code */}
            <div className="p-6 space-y-5">
              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-5 bg-[#faf7f2] dark:bg-[#120f0d] rounded-2xl border border-[#e7ded2] dark:border-[#2e2620] shadow-inner text-center">
                <div className="p-3 bg-white rounded-2xl shadow-md border border-stone-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=4&data=${encodeURIComponent(
                      `RESIDENTHUB-TICKET|EVENT:${ticketModalData.event.title}|PASS_ID:${ticketModalData.rsvp.id.slice(0, 8)}|FLAT:${ticketModalData.rsvp.flat_number}|NAME:${ticketModalData.rsvp.member_name}|TOTAL:${ticketModalData.rsvp.attendees_count}|UTR:${ticketModalData.rsvp.utr_number || "FREE"}`
                    )}`}
                    alt="Event Entry QR Code"
                    width={180}
                    height={180}
                    className="rounded-lg object-contain"
                  />
                </div>
                <p className="text-[11px] font-mono font-bold text-stone-700 dark:text-stone-300 mt-3 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  PASS #{ticketModalData.rsvp.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                  Scan at Clubhouse or Society Gate for Digital Entry
                </p>
              </div>

              {/* Resident & Pass Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-stone-50 dark:bg-[#201a16] rounded-xl border border-stone-200 dark:border-[#383028]">
                  <span className="text-[10px] font-mono text-stone-400 uppercase font-bold block">
                    Resident Member
                  </span>
                  <p className="font-extrabold text-stone-900 dark:text-white mt-0.5 truncate">
                    {ticketModalData.rsvp.member_name}
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                    Flat {ticketModalData.rsvp.flat_number}
                  </p>
                </div>

                <div className="p-3 bg-stone-50 dark:bg-[#201a16] rounded-xl border border-stone-200 dark:border-[#383028]">
                  <span className="text-[10px] font-mono text-stone-400 uppercase font-bold block">
                    Total Attendees
                  </span>
                  <p className="font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
                    <Users className="w-3.5 h-3.5" />
                    {ticketModalData.rsvp.attendees_count || 1} Passes
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {ticketModalData.rsvp.adults_count || 1}A • {ticketModalData.rsvp.children_count || 0}C • {ticketModalData.rsvp.seniors_count || 0}S
                  </p>
                </div>

                <div className="p-3 bg-stone-50 dark:bg-[#201a16] rounded-xl border border-stone-200 dark:border-[#383028]">
                  <span className="text-[10px] font-mono text-stone-400 uppercase font-bold block">
                    Contribution
                  </span>
                  <p className="font-extrabold text-stone-900 dark:text-white mt-0.5 font-mono">
                    {ticketModalData.rsvp.total_amount > 0 ? formatINR(ticketModalData.rsvp.total_amount) : "Free Access"}
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5 truncate font-mono">
                    {ticketModalData.rsvp.utr_number ? `UTR: ${ticketModalData.rsvp.utr_number}` : "Verified Active"}
                  </p>
                </div>

                <div className="p-3 bg-stone-50 dark:bg-[#201a16] rounded-xl border border-stone-200 dark:border-[#383028] flex flex-col justify-between">
                  <span className="text-[10px] font-mono text-stone-400 uppercase font-bold block">
                    Pass Status
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 mt-1 self-start">
                    ✓ Verified Active
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-secondary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Save / Print Pass
                </button>
                <button
                  type="button"
                  onClick={() => setTicketModalData(null)}
                  className="btn-primary flex-1 py-2 text-xs"
                >
                  Close Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📢 POST SOCIETY NOTICE MODAL (ADMIN) */}
      {showAddNotice && (
        <div className="modal-backdrop" onClick={() => setShowAddNotice(false)}>
          <div
            className="modal-content max-w-lg p-6 bg-white dark:bg-[#181411] border border-stone-200 dark:border-[#383028] shadow-2xl rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>Broadcast Society Notice</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Publish announcement to Tower 24 resident notice board & live feed
                </p>
              </div>
              <button
                onClick={() => setShowAddNotice(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#251e18] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {noticeError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {noticeError}
              </div>
            )}

            <form onSubmit={handlePostNotice} className="space-y-4">
              <div>
                <label className="form-label">Notice Title *</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Overhead Water Tank Cleaning on Sunday"
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Category</label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value)}
                    className="form-input"
                  >
                    {NOTICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Priority</label>
                  <select
                    value={noticePriority}
                    onChange={(e) => setNoticePriority(e.target.value)}
                    className="form-input"
                  >
                    {NOTICE_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Notice Details / Content *</label>
                <textarea
                  rows={4}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Provide comprehensive details, timings, instructions, and impact for society members..."
                  className="form-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="form-label">Broadcast Author Signature (Optional)</label>
                <input
                  type="text"
                  value={noticeAuthor}
                  onChange={(e) => setNoticeAuthor(e.target.value)}
                  placeholder="e.g. Estate & Maintenance Committee"
                  className="form-input"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNotice(false)}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotice || !noticeTitle.trim() || !noticeContent.trim()}
                  className="btn-primary flex-1 py-2 text-xs shadow-md shadow-orange-600/10"
                >
                  {submittingNotice ? "Broadcasting..." : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
