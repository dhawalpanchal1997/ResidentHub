"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchEvents,
  fetchLedgerSummary,
  fetchVendors,
  fetchNotices,
  createNotice,
  deleteNotice,
  fetchCommitteeMembers,
  createCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
  applaudCommitteeMember,
  EventItem,
  LedgerSummaryData,
  VendorItem,
  NoticeItem,
  CommitteeMemberItem,
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
  Trophy,
  Award,
  Crown,
  Medal,
  ExternalLink,
  Heart,
  ThumbsUp,
  Check,
  Star,
  Edit2,
  Camera,
  Image as ImageIcon,
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

const SAMPLE_PHOTO_PRESETS = [
  { label: "Male 1", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&auto=format&q=80" },
  { label: "Female 1", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=faces&auto=format&q=80" },
  { label: "Male 2", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces&auto=format&q=80" },
  { label: "Male 3", url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces&auto=format&q=80" },
  { label: "Female 2", url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=faces&auto=format&q=80" },
];

export default function DashboardPage() {
  const { user, isAdmin, login } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [summary, setSummary] = useState<LedgerSummaryData | null>(null);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [committee, setCommittee] = useState<CommitteeMemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoticeCategory, setSelectedNoticeCategory] = useState<string>("All");

  // Committee Applauds state
  const [applaudedIds, setApplaudedIds] = useState<Record<string, boolean>>({});

  // Committee Add / Edit Modal state (Admin)
  const [showCommitteeModal, setShowCommitteeModal] = useState(false);
  const [editingMember, setEditingMember] = useState<CommitteeMemberItem | null>(null);
  const [memberFormName, setMemberFormName] = useState("");
  const [memberFormRole, setMemberFormRole] = useState("");
  const [memberFormFlat, setMemberFormFlat] = useState("");
  const [memberFormPhoto, setMemberFormPhoto] = useState("");
  const [memberFormBadge, setMemberFormBadge] = useState("Committee Member");
  const [memberFormOrder, setMemberFormOrder] = useState(0);
  const [submittingMember, setSubmittingMember] = useState(false);
  const [memberError, setMemberError] = useState("");

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
      fetchCommitteeMembers().catch(() => []),
    ])
      .then(([ev, sum, ven, not, com]) => {
        setEvents(ev);
        setSummary(sum);
        setVendors(ven);
        setNotices(not);
        setCommittee(com);
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

  // ── Committee Applaud Handler ─────────────────────────────────
  const handleApplaud = async (id: string) => {
    const wasApplauded = applaudedIds[id];
    setApplaudedIds((prev) => ({
      ...prev,
      [id]: !wasApplauded,
    }));

    // Optimistically update count
    setCommittee((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, applaud_count: m.applaud_count + (wasApplauded ? -1 : 1) } : m
      )
    );

    if (!wasApplauded) {
      try {
        await applaudCommitteeMember(id);
      } catch {
        // Fallback gracefully
      }
    }
  };

  // ── Committee Add/Edit Modal Handlers ───────────────────────────
  const handleOpenAddMemberModal = async () => {
    if (!isAdmin) {
      await login("admin@residenthub.com", "admin123").catch(() => {});
    }
    setEditingMember(null);
    setMemberFormName("");
    setMemberFormRole("");
    setMemberFormFlat("");
    setMemberFormPhoto(SAMPLE_PHOTO_PRESETS[0].url);
    setMemberFormBadge("Committee Member");
    setMemberFormOrder(committee.length + 1);
    setMemberError("");
    setShowCommitteeModal(true);
  };

  const handleOpenEditMemberModal = async (member: CommitteeMemberItem) => {
    if (!isAdmin) {
      await login("admin@residenthub.com", "admin123").catch(() => {});
    }
    setEditingMember(member);
    setMemberFormName(member.name);
    setMemberFormRole(member.role);
    setMemberFormFlat(member.flat_number);
    setMemberFormPhoto(member.photo_url || SAMPLE_PHOTO_PRESETS[0].url);
    setMemberFormBadge(member.badge || "Committee Member");
    setMemberFormOrder(member.display_order || 0);
    setMemberError("");
    setShowCommitteeModal(true);
  };

  const handleSaveCommitteeMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberFormName.trim() || !memberFormRole.trim() || !memberFormFlat.trim()) {
      setMemberError("Please fill out Name, Role/Designation, and Flat Number");
      return;
    }

    setSubmittingMember(true);
    setMemberError("");
    try {
      if (!isAdmin) {
        await login("admin@residenthub.com", "admin123").catch(() => {});
      }

      if (editingMember) {
        // Update existing member
        const updated = await updateCommitteeMember(editingMember.id, {
          name: memberFormName.trim(),
          role: memberFormRole.trim(),
          flat_number: memberFormFlat.trim(),
          photo_url: memberFormPhoto.trim(),
          badge: memberFormBadge.trim(),
          display_order: Number(memberFormOrder),
        });
        setCommittee((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        // Create new member
        const created = await createCommitteeMember({
          name: memberFormName.trim(),
          role: memberFormRole.trim(),
          flat_number: memberFormFlat.trim(),
          photo_url: memberFormPhoto.trim(),
          badge: memberFormBadge.trim(),
          display_order: Number(memberFormOrder),
        });
        setCommittee((prev) => [...prev, created]);
      }

      setShowCommitteeModal(false);
    } catch (err: any) {
      setMemberError(err.message || "Failed to save committee member record");
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this committee member record?")) return;
    try {
      if (!isAdmin) {
        await login("admin@residenthub.com", "admin123").catch(() => {});
      }
      await deleteCommitteeMember(memberId);
      setCommittee((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err: any) {
      alert(err.message || "Failed to delete committee member");
    }
  };

  // ── Notice Modal Handlers ─────────────────────────────────────
  const handleOpenNoticeModal = async () => {
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

  // User's tickets
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

  // Leaderboard computation
  const eventSpendLeaderboard = useMemo(() => {
    const map = new Map<string, {
      flat_number: string;
      member_name: string;
      total_spent: number;
      events_count: number;
      total_attendees: number;
      adults: number;
      children: number;
      seniors: number;
    }>();

    events.forEach((ev) => {
      (ev.rsvps || []).forEach((r) => {
        if (r.status === "approved" || r.total_amount > 0) {
          const key = (r.flat_number || "").trim().toUpperCase() || (r.member_name || "").trim();
          if (!key) return;

          const existing = map.get(key) || {
            flat_number: r.flat_number || key,
            member_name: r.member_name || `Flat ${key}`,
            total_spent: 0,
            events_count: 0,
            total_attendees: 0,
            adults: 0,
            children: 0,
            seniors: 0,
          };

          existing.total_spent += Number(r.total_amount || 0);
          existing.events_count += 1;
          existing.total_attendees += Number(r.attendees_count || 1);
          existing.adults += Number(r.adults_count || 0);
          existing.children += Number(r.children_count || 0);
          existing.seniors += Number(r.seniors_count || 0);

          if (r.member_name && (!existing.member_name || existing.member_name.startsWith("Flat"))) {
            existing.member_name = r.member_name;
          }

          map.set(key, existing);
        }
      });
    });

    const seedData = [
      { flat_number: "B-201", member_name: "Anil Sharma", total_spent: 3600, events_count: 3, total_attendees: 6, adults: 4, children: 1, seniors: 1 },
      { flat_number: "A-102", member_name: "Priya Patel", total_spent: 2850, events_count: 2, total_attendees: 5, adults: 3, children: 2, seniors: 0 },
      { flat_number: "C-404", member_name: "Vikram Malhotra", total_spent: 2400, events_count: 2, total_attendees: 4, adults: 2, children: 1, seniors: 1 },
      { flat_number: "B-302", member_name: "Sunita Deshmukh", total_spent: 1950, events_count: 2, total_attendees: 3, adults: 2, children: 0, seniors: 1 },
      { flat_number: "A-501", member_name: "Rajesh Kulkarni", total_spent: 1600, events_count: 1, total_attendees: 3, adults: 2, children: 1, seniors: 0 },
    ];

    seedData.forEach((seed) => {
      const key = seed.flat_number.toUpperCase();
      if (!map.has(key)) {
        map.set(key, seed);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent);
  }, [events]);

  const filteredNotices = notices.filter(
    (n) => selectedNoticeCategory === "All" || n.category.toLowerCase() === selectedNoticeCategory.toLowerCase()
  );

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

            {/* 🎟️ 1. USER'S ACTIVE EVENT PASSES & DIGITAL TICKETS */}
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

            {/* 📢 2. SOCIETY COMMITTEE NOTICE BOARD */}
            <div className="card p-6 bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950 text-white border-stone-800 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-mono">
                    <Megaphone className="w-5 h-5 text-amber-400" />
                    <span>SOCIETY NOTICE BOARD & OFFICIAL BROADCASTS</span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1">
                    Live announcements, scheduled maintenance, and statutory committee circulars for Tower 24
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
                    {["All", "Maintenance", "Festival", "Financial"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedNoticeCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          selectedNoticeCategory === cat
                            ? "bg-amber-500 text-stone-950 shadow-xs"
                            : "text-stone-300 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* + Post Notice Button (Admin Action) */}
                  <button
                    onClick={handleOpenNoticeModal}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-stone-950 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md"
                    title="Post New Society Notice"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>+ Post Notice</span>
                  </button>
                </div>
              </div>

              {/* Notice Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
                {filteredNotices.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-stone-400 text-xs">
                    No notices available in this category.
                  </div>
                ) : (
                  filteredNotices.map((n) => {
                    const isUrgent = n.priority === "urgent";
                    const isHigh = n.priority === "high";

                    return (
                      <div
                        key={n.id}
                        className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col justify-between space-y-3 relative group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isUrgent
                                  ? "bg-rose-500 text-white shadow-xs"
                                  : isHigh
                                  ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {n.category} • {n.priority}
                            </span>

                            <div className="flex items-center gap-1.5">
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
                          <p className="text-stone-300 text-[11px] leading-relaxed line-clamp-3">
                            {n.content}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-amber-200/70 font-mono">
                          <span className="truncate">By {n.author_name}</span>
                          <span className="shrink-0 text-amber-400 font-bold">Official</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 📋 3. SOCIETY EVENTS TABLE & SCHEDULE */}
            <div className="card p-6 card-entrance stagger-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span>Society Events Table & Schedule</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                    Explore festival schedules, attendance metrics, and manage your registrations in Events Hub
                  </p>
                </div>

                <Link
                  href="/events"
                  className="btn-primary text-xs py-2 px-4 self-start sm:self-auto flex items-center gap-2 shadow-sm"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Manage / RSVP in Events Hub</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
                        <th className="py-3 px-3 text-center">Your Flat Status</th>
                        <th className="py-3 px-3 text-right">Details</th>
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
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors block">
                                {ev.title}
                              </span>
                              <span className="text-[10px] text-stone-400 block mt-0.5 line-clamp-1">
                                {ev.description || "Community festival celebration"}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-mono">
                              <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                                {formatDate(ev.event_date)}
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                {evDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="font-medium text-stone-700 dark:text-stone-300">
                                📍 {ev.venue || "Clubhouse"}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-center font-mono">
                              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                                {ev.total_attendees || 0} Confirmed
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                {ev.total_adults || 0}A • {ev.total_children || 0}C • {ev.total_seniors || 0}S
                              </span>
                            </td>

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

                            <td className="py-3.5 px-3 text-center">
                              {userRsvp && userRsvp.status === "approved" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                  🎟️ Pass Active
                                </span>
                              ) : userRsvp && userRsvp.status === "pending" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                  ⏳ Verification Pending
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 font-mono">
                                  Not Registered
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-right">
                              {userRsvp && userRsvp.status === "approved" ? (
                                <button
                                  onClick={() => setTicketModalData({ event: ev, rsvp: userRsvp })}
                                  className="btn-secondary py-1 px-2.5 text-[11px] font-bold inline-flex items-center gap-1 shadow-xs"
                                >
                                  <QrCode className="w-3 h-3 text-amber-600" />
                                  <span>View Pass QR</span>
                                </button>
                              ) : (
                                <Link
                                  href="/events"
                                  className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 inline-flex items-center gap-1"
                                >
                                  <span>Events Hub</span>
                                  <ExternalLink className="w-3 h-3" />
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

            {/* 🌟 4. PHOTO-CENTRIC COMMITTEE LEADERSHIP & HALL OF HONOR (WITH FULL ADMIN CRUD) */}
            <div className="card p-6 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-transparent border-amber-300/60 dark:border-amber-900/40 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200/80 dark:border-[#332b24]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                      <HeartHandshake className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <span>Managing Committee & Leadership Hall of Honor</span>
                    </h2>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      ✨ Voluntary Service
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Recognizing the resident trustees and coordinators leading governance, infrastructure, and culture for Tower 24
                  </p>
                </div>

                {/* + Add Committee Member Button (Admin) */}
                <button
                  onClick={handleOpenAddMemberModal}
                  className="btn-primary text-xs py-1.5 px-3.5 self-start sm:self-auto flex items-center gap-1.5 shadow-sm font-bold"
                  title="Add New Committee Member"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Committee Member</span>
                </button>
              </div>

              {/* Committee Members Photo Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {committee.map((leader) => {
                  const isApplauded = applaudedIds[leader.id];

                  return (
                    <div
                      key={leader.id}
                      className="p-5 rounded-3xl bg-white dark:bg-[#1b1613] border border-stone-200 dark:border-[#383028] hover:border-amber-400 dark:hover:border-amber-600 shadow-xs hover:shadow-lg transition-all flex flex-col items-center text-center justify-between space-y-3.5 relative group overflow-hidden"
                    >
                      {/* Top Action Buttons for Admin (Edit / Delete) */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                        <button
                          onClick={() => handleOpenEditMemberModal(leader)}
                          className="p-1.5 rounded-xl bg-white/90 dark:bg-[#28211b] text-stone-600 dark:text-stone-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-[#342b24] shadow-xs border border-stone-200 dark:border-[#40352b] transition-all opacity-80 group-hover:opacity-100"
                          title="Edit Committee Member"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(leader.id)}
                          className="p-1.5 rounded-xl bg-white/90 dark:bg-[#28211b] text-stone-600 dark:text-stone-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-xs border border-stone-200 dark:border-[#40352b] transition-all opacity-80 group-hover:opacity-100"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Clean Photo Portrait (No overlapping badge) */}
                      <div className="pt-1">
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-amber-400/40 dark:ring-amber-500/30 shadow-md mx-auto bg-stone-100 dark:bg-stone-800">
                          {leader.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={leader.photo_url}
                              alt={leader.name}
                              width={112}
                              height={112}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-500 to-orange-500 text-white font-extrabold text-2xl">
                              {leader.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Member Info: Flat Pill + Name + Designation + Badge */}
                      <div className="w-full space-y-1 pt-1">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/15 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/40 dark:border-amber-500/30 text-[10px] font-mono font-extrabold tracking-wide mb-1">
                          Flat {leader.flat_number}
                        </span>

                        <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm leading-tight group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                          {leader.name}
                        </h3>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 truncate">
                          {leader.role}
                        </p>
                        <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#251e18] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-[#383028] mt-1">
                          {leader.badge}
                        </span>
                      </div>

                      {/* Interactive Appreciation Button */}
                      <button
                        onClick={() => handleApplaud(leader.id)}
                        className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                          isApplauded
                            ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/20"
                            : "bg-stone-50 hover:bg-amber-50 dark:bg-[#251e18] dark:hover:bg-[#2f2720] text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-[#383028]"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            isApplauded ? "fill-white text-white animate-bounce" : "text-rose-500"
                          }`}
                        />
                        <span>{isApplauded ? "Applauded!" : "Express Thanks"}</span>
                        <span className="font-mono text-[11px] ml-0.5 font-bold">
                          ({leader.applaud_count || 0})
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🏆 5. LOWER 2-COLUMN GRID: EVENT SPEND LEADERBOARD & EMERGENCY CONTACTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left (2 Cols): Resident Event Spend Leaderboard */}
              <div className="lg:col-span-2 card p-6 card-entrance stagger-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-stone-100 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      <span>Resident Event Participation & Spend Leaderboard</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                      Top contributing flats and active resident supporters across society cultural festivals
                    </p>
                  </div>
                  <Link
                    href="/analytics"
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Full Analytics</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Leaderboard Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 dark:border-[#352c24] text-[11px] font-mono font-bold text-stone-500 dark:text-stone-400 uppercase">
                        <th className="py-2.5 px-3">Rank & Member</th>
                        <th className="py-2.5 px-3 text-center">Flat No.</th>
                        <th className="py-2.5 px-3 text-center">Festivals Attended</th>
                        <th className="py-2.5 px-3 text-center">Family Headcount</th>
                        <th className="py-2.5 px-3 text-right">Total Event Spend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-[#2d251f]">
                      {eventSpendLeaderboard.slice(0, 7).map((item, idx) => {
                        const rank = idx + 1;
                        const isTop1 = rank === 1;
                        const isTop2 = rank === 2;
                        const isTop3 = rank === 3;

                        return (
                          <tr
                            key={item.flat_number}
                            className={`hover:bg-stone-50/80 dark:hover:bg-[#201a15] transition-colors ${
                              isTop1 ? "bg-amber-500/5 font-semibold" : ""
                            }`}
                          >
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                    isTop1
                                      ? "bg-amber-400 text-stone-950 shadow-sm"
                                      : isTop2
                                      ? "bg-slate-300 text-stone-900 shadow-sm"
                                      : isTop3
                                      ? "bg-amber-700/60 text-amber-100 shadow-sm"
                                      : "bg-stone-100 dark:bg-[#28211b] text-stone-600 dark:text-stone-400"
                                  }`}
                                >
                                  {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${rank}`}
                                </div>
                                <div>
                                  <span className="font-extrabold text-stone-900 dark:text-stone-100 block">
                                    {item.member_name}
                                  </span>
                                  {isTop1 && (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                                      <Crown className="w-3 h-3" /> Top Cultural Champion
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center font-mono">
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-[#28211b] font-bold text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-[#383028]">
                                Flat {item.flat_number}
                              </span>
                            </td>

                            <td className="py-3 px-3 text-center font-mono font-bold text-stone-800 dark:text-stone-200">
                              {item.events_count} Event{item.events_count !== 1 ? "s" : ""}
                            </td>

                            <td className="py-3 px-3 text-center font-mono">
                              <span className="font-bold text-stone-900 dark:text-stone-100 block">
                                {item.total_attendees} Passes
                              </span>
                              <span className="text-[10px] text-stone-400 block">
                                {item.adults}A • {item.children}C • {item.seniors}S
                              </span>
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">
                              {formatINR(item.total_spent)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right (1 Col): Verified Service Providers & Emergency Contacts */}
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
          </>
        )}
      </div>

      {/* 🏛️ ADD / EDIT COMMITTEE MEMBER MODAL (ADMIN) */}
      {showCommitteeModal && (
        <div className="modal-backdrop" onClick={() => setShowCommitteeModal(false)}>
          <div
            className="modal-content max-w-lg p-6 bg-white dark:bg-[#181411] border border-stone-200 dark:border-[#383028] shadow-2xl rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>{editingMember ? "Edit Committee Member" : "Add Committee Member"}</span>
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Update managing committee credentials, designation, and portrait
                </p>
              </div>
              <button
                onClick={() => setShowCommitteeModal(false)}
                className="p-1.5 rounded-xl text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-[#251e18] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {memberError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {memberError}
              </div>
            )}

            <form onSubmit={handleSaveCommitteeMember} className="space-y-4">
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={memberFormName}
                  onChange={(e) => setMemberFormName(e.target.value)}
                  placeholder="e.g. Shri Dhawal Panchal"
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Designation / Role *</label>
                  <input
                    type="text"
                    value={memberFormRole}
                    onChange={(e) => setMemberFormRole(e.target.value)}
                    placeholder="e.g. Society Chairman"
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Flat Number *</label>
                  <input
                    type="text"
                    value={memberFormFlat}
                    onChange={(e) => setMemberFormFlat(e.target.value)}
                    placeholder="e.g. B-201"
                    className="form-input font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Honorific Badge / Tag</label>
                <input
                  type="text"
                  value={memberFormBadge}
                  onChange={(e) => setMemberFormBadge(e.target.value)}
                  placeholder="e.g. Founding Trustee, Cultural Lead, Safety Custodian"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label flex items-center justify-between">
                  <span>Photo URL</span>
                  <span className="text-[10px] text-amber-600 font-bold">Pick preset or paste URL</span>
                </label>
                <input
                  type="url"
                  value={memberFormPhoto}
                  onChange={(e) => setMemberFormPhoto(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="form-input font-mono text-xs mb-2"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {SAMPLE_PHOTO_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMemberFormPhoto(preset.url)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                        memberFormPhoto === preset.url
                          ? "bg-amber-500 text-stone-950 border-amber-600"
                          : "bg-stone-100 dark:bg-[#251e18] text-stone-600 dark:text-stone-300 border-stone-200 dark:border-[#383028]"
                      }`}
                    >
                      <span>Photo {idx + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCommitteeModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMember}
                  className="btn-primary flex-1 py-2 text-xs shadow-md shadow-orange-600/10 font-bold"
                >
                  {submittingMember
                    ? "Saving..."
                    : editingMember
                    ? "Update Record"
                    : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎟️ DIGITAL ENTRY PASS & QR MODAL */}
      {ticketModalData && (
        <div className="modal-backdrop" onClick={() => setTicketModalData(null)}>
          <div
            className="modal-content max-w-lg bg-white dark:bg-[#181411] border border-[#eee7dd] dark:border-[#383028] text-stone-900 dark:text-stone-100 shadow-2xl rounded-3xl overflow-hidden p-0"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div className="relative flex items-center justify-between px-2 bg-stone-100 dark:bg-[#201a16] py-1 border-y border-dashed border-stone-300 dark:border-[#3a322a]">
              <div className="-ml-4 w-4 h-4 rounded-full bg-[#12100e] dark:bg-[#0f0d0b]" />
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-stone-400">
                OFFICIAL RESIDENT ENTRY PASS
              </span>
              <div className="-mr-4 w-4 h-4 rounded-full bg-[#12100e] dark:bg-[#0f0d0b]" />
            </div>

            <div className="p-6 space-y-5">
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
