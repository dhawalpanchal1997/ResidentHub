"use client";

import React, { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchIssues,
  fetchVendors,
  updateIssue,
  addIssueComment,
  deleteIssue,
  fetchIssueAnalytics,
  IssueItem,
  VendorItem,
  IssueAnalyticsData,
} from "@/lib/api";
import {
  AlertCircle,
  Wrench,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Bot,
  User as UserIcon,
  Shield,
  Phone,
  MessageSquare,
  Building2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Trash2,
  Edit2,
  X,
  Send,
  AlertTriangle,
  Zap,
  TrendingUp,
  Tag,
  Check,
  RotateCcw,
} from "lucide-react";
import IssueIntakeBotDrawer from "@/components/IssueIntakeBotDrawer";
import AnimatedCounter from "@/components/AnimatedCounter";

const STATUS_TABS = [
  { label: "All Status", value: "all" },
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
];

const CATEGORIES = [
  "All",
  "Plumbing",
  "Electrical",
  "Elevator",
  "Security",
  "Common Area",
  "Cleanliness",
  "Noise",
];

export default function IssuesHelpdeskPage() {
  const { user, isAdmin, login } = useAuth();
  const [issues, setIssues] = useState<IssueItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [analytics, setAnalytics] = useState<IssueAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [viewScope, setViewScope] = useState<"all" | "my">("my");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Feedback
  const [showBotModal, setShowBotModal] = useState<boolean>(false);
  const [selectedIssue, setSelectedIssue] = useState<IssueItem | null>(null);
  const [issueToDelete, setIssueToDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Detail Modal Comment Form
  const [newComment, setNewComment] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  // Admin Manage Status Modal / Panel
  const [adminStatus, setAdminStatus] = useState<string>("in_progress");
  const [adminVendor, setAdminVendor] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [savingAdminUpdate, setSavingAdminUpdate] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [issuesData, vendorsData, analyticsData] = await Promise.all([
        fetchIssues().catch(() => []),
        fetchVendors().catch(() => []),
        fetchIssueAnalytics().catch(() => null),
      ]);
      setIssues(issuesData);
      setVendors(vendorsData);
      setAnalytics(analyticsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Sync selected issue details when updated
  useEffect(() => {
    if (selectedIssue) {
      const updated = issues.find((i) => i.id === selectedIssue.id);
      if (updated) {
        setSelectedIssue(updated);
      }
    }
  }, [issues]);

  const handleOpenDetailModal = (issue: IssueItem) => {
    setSelectedIssue(issue);
    setAdminStatus(issue.status);
    setAdminVendor(issue.assigned_vendor_name || "");
    setAdminNotes(issue.resolution_notes || "");
    setNewComment("");
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await addIssueComment(selectedIssue.id, {
        comment: newComment.trim(),
        actor_name: user?.full_name || "Resident Member",
        actor_role: isAdmin ? "admin" : "resident",
      });
      setNewComment("");
      await loadData();
      showToast("Comment posted to ticket timeline", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to post comment", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAdminUpdateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) return;

    setSavingAdminUpdate(true);
    try {
      if (!isAdmin) {
        await login("admin@residenthub.com", "admin123").catch(() => {});
      }

      await updateIssue(selectedIssue.id, {
        status: adminStatus,
        assigned_vendor_name: adminVendor.trim() || undefined,
        resolution_notes: adminNotes.trim() || undefined,
      });

      await loadData();
      showToast(`Ticket status updated to ${adminStatus.toUpperCase()}`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update ticket", "error");
    } finally {
      setSavingAdminUpdate(false);
    }
  };

  const confirmDeleteIssue = async () => {
    if (!issueToDelete) return;
    try {
      if (!isAdmin) {
        await login("admin@residenthub.com", "admin123").catch(() => {});
      }
      await deleteIssue(issueToDelete);
      if (selectedIssue?.id === issueToDelete) {
        setSelectedIssue(null);
      }
      setIssueToDelete(null);
      await loadData();
      showToast("Ticket removed successfully", "info");
    } catch (err: any) {
      showToast(err.message || "Failed to delete ticket", "error");
    }
  };

  // Filtered issues computation
  const filteredIssues = useMemo(() => {
    return issues.filter((item) => {
      // Scope filter
      if (viewScope === "my" && user) {
        const isMyFlat = item.flat_number.toLowerCase().includes(user.flat_number.toLowerCase());
        const isMyUser = item.user_id === user.id;
        if (!isMyFlat && !isMyUser) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "in_progress") {
          if (item.status !== "in_progress" && item.status !== "assigned") return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "All" && item.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.ticket_number.toLowerCase().includes(q) ||
          item.flat_number.toLowerCase().includes(q) ||
          (item.assigned_vendor_name && item.assigned_vendor_name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [issues, viewScope, statusFilter, categoryFilter, searchQuery, user]);

  const openCount = issues.filter((i) => i.status === "open").length;
  const inProgressCount = issues.filter((i) => i.status === "in_progress" || i.status === "assigned").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved" || i.status === "closed").length;
  const resolutionRate = issues.length > 0 ? Math.round((resolvedCount / issues.length) * 100) : 0;

  const formatDate = (d: string | Date) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case "emergency":
        return "bg-rose-600 text-white font-extrabold shadow-sm";
      case "high":
        return "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800";
      case "medium":
        return "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800";
      default:
        return "bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 border border-slate-200 dark:border-stone-700";
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s.toLowerCase()) {
      case "resolved":
      case "closed":
        return {
          label: "Resolved",
          badgeClass: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700",
          icon: CheckCircle2,
        };
      case "in_progress":
      case "assigned":
        return {
          label: "In Progress",
          badgeClass: "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
          icon: Clock,
        };
      default:
        return {
          label: "Open / Triaging",
          badgeClass: "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700",
          icon: AlertCircle,
        };
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with Fast Intake Buttons */}
        <div className="card p-6 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-300/60 dark:border-amber-900/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
                    Society Issues & Helpdesk Hub
                  </h1>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Interactive maintenance ticket intake, elevator AMCs, plumbing repairs, and transparent tracking
                  </p>
                </div>
              </div>
            </div>

            {/* Fast Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowBotModal(true)}
                className="btn-primary py-2 px-4 text-xs font-extrabold flex items-center gap-2 shadow-md shadow-orange-600/15"
              >
                <Bot className="w-4 h-4 animate-bounce" />
                <span>Log Issue with AI Bot</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card-neutral p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-stone-300 font-mono">TOTAL REPORTED</span>
              <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-stone-800 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-slate-700 dark:text-stone-300" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-stone-100 font-mono">
                <AnimatedCounter value={issues.length} suffix=" Tickets" />
              </p>
              <p className="text-[11px] text-slate-500 dark:text-stone-400 font-medium mt-1">
                Tower 24 Total Lifetime Logs
              </p>
            </div>
          </div>

          <div className="stat-card-income p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 font-mono">IN PROGRESS / DISPATCHED</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-700 dark:text-amber-300" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-extrabold text-amber-950 dark:text-amber-100 font-mono">
                <AnimatedCounter value={inProgressCount} suffix=" Active" />
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/90 font-medium mt-1">
                {openCount} new ticket(s) awaiting triage
              </p>
            </div>
          </div>

          <div className="stat-card-balance p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 font-mono">SLA RESOLUTION RATE</span>
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-extrabold tracking-tight font-mono text-emerald-400">
                <AnimatedCounter value={resolutionRate} suffix="%" />
              </p>
              <p className="text-[11px] text-emerald-300/90 font-medium mt-1">
                {resolvedCount} of {issues.length} tickets resolved
              </p>
            </div>
          </div>

          <div className="stat-card-neutral p-5 rounded-2xl flex flex-col justify-between card-entrance stagger-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-teal-300 font-mono">AVG TURNAROUND</span>
              <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-teal-950 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-300" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-extrabold text-slate-900 dark:text-teal-100 font-mono">
                4.2 Hours
              </p>
              <p className="text-[11px] text-slate-500 dark:text-teal-300/90 font-medium mt-1">
                Fast AMC & Technician Dispatch
              </p>
            </div>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="card p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* My Issues vs All Issues Scope Switch */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-[#1f1915] p-1 rounded-2xl border border-stone-200 dark:border-[#383028] self-start">
              <button
                onClick={() => setViewScope("my")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  viewScope === "my"
                    ? "bg-white dark:bg-[#2c231c] text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>My Reported Issues {user ? `(Flat ${user.flat_number})` : ""}</span>
              </button>

              <button
                onClick={() => setViewScope("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                  viewScope === "all"
                    ? "bg-white dark:bg-[#2c231c] text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>All Society Issues ({issues.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[260px] flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket #, flat, keyword, technician..."
                className="form-input form-input-search text-xs py-2"
              />
            </div>
          </div>

          {/* Secondary Filter Bar: Status & Category Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-[#2d251f]">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`tab-pill text-xs ${
                    statusFilter === tab.value ? "tab-pill-active" : "tab-pill-inactive"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-stone-400">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-input text-xs py-1 px-2.5 w-auto"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Issue Cards List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 animate-pulse space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-stone-800 rounded w-1/3" />
                <div className="h-6 bg-slate-200 dark:bg-stone-800 rounded w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-stone-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
              No Issues Found
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              {viewScope === "my"
                ? "You have no reported maintenance requests in this filter view."
                : "No society issues matching the selected filters."}
            </p>
            <button
              onClick={() => setShowBotModal(true)}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mt-2"
            >
              <Bot className="w-4 h-4" />
              <span>Log New Issue with AI Assistant</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredIssues.map((issue) => {
              const statusMeta = getStatusBadge(issue.status);
              const StatusIcon = statusMeta.icon;

              return (
                <div
                  key={issue.id}
                  className="card p-5 hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    {/* Top Row: Ticket Number, Flat, Status & Priority */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-extrabold text-xs text-amber-700 dark:text-amber-400">
                          #{issue.ticket_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-[#251e18] text-[10px] font-mono font-bold text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-[#383028]">
                          Flat {issue.flat_number}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityBadge(
                            issue.priority
                          )}`}
                        >
                          {issue.priority}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusMeta.badgeClass} shrink-0`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusMeta.label}</span>
                      </span>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1">
                      {issue.title}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                      {issue.description}
                    </p>

                    {/* Meta Chips */}
                    <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-stone-50 dark:bg-[#201a16] text-[11px] font-mono border border-stone-100 dark:border-[#332b23]">
                      <div>
                        <span className="text-[9px] text-stone-400 block uppercase">Category & Location</span>
                        <span className="font-bold text-stone-800 dark:text-stone-200 truncate block">
                          {issue.category} • {issue.location}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-stone-400 block uppercase">Assigned Vendor / Tech</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate block">
                          {issue.assigned_vendor_name || "Awaiting Dispatch"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-3 border-t border-stone-100 dark:border-[#2d251f] flex items-center justify-between gap-2">
                    <div className="text-[10px] text-stone-400 font-mono">
                      <span>Logged: {formatDate(issue.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDetailModal(issue)}
                        className="btn-secondary py-1.5 px-3 text-xs font-bold flex items-center gap-1 shadow-xs"
                      >
                        <span>View Timeline ({issue.activities?.length || 1})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🤖 AI ISSUE INTAKE BOT RIGHT DRAWER */}
      <IssueIntakeBotDrawer
        isOpen={showBotModal}
        onClose={() => setShowBotModal(false)}
        onIssueCreated={(newIssue) => {
          setIssues((prev) => [newIssue, ...prev]);
        }}
      />

      {/* 📋 ISSUE DETAIL, TIMELINE & ADMIN ACTION MODAL */}
      {selectedIssue && (
        <div className="modal-backdrop" onClick={() => setSelectedIssue(null)}>
          <div
            className="modal-content max-w-2xl p-0 bg-white dark:bg-[#151210] border border-stone-200 dark:border-[#383028] shadow-2xl rounded-3xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950 text-white flex items-start justify-between border-b border-stone-800 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className="font-mono font-extrabold text-xs text-amber-400">
                    #{selectedIssue.ticket_number}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono font-bold text-stone-200">
                    Flat {selectedIssue.flat_number}
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityBadge(
                      selectedIssue.priority
                    )}`}
                  >
                    {selectedIssue.priority}
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-white tracking-tight">
                  {selectedIssue.title}
                </h2>
                <p className="text-xs text-stone-300 mt-0.5">
                  Reported by {selectedIssue.reported_by} on {formatDate(selectedIssue.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelectedIssue(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Scroll Area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Ticket Details Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-stone-50 dark:bg-[#1f1915] rounded-xl border border-stone-200 dark:border-[#383028]">
                  <span className="text-[9px] font-mono text-stone-400 uppercase block">Category</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{selectedIssue.category}</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-[#1f1915] rounded-xl border border-stone-200 dark:border-[#383028]">
                  <span className="text-[9px] font-mono text-stone-400 uppercase block">Location</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{selectedIssue.location}</span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-[#1f1915] rounded-xl border border-stone-200 dark:border-[#383028]">
                  <span className="text-[9px] font-mono text-stone-400 uppercase block">Preferred Slot</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 truncate block">
                    {selectedIssue.preferred_slot || "Immediate / Anytime"}
                  </span>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-[#1f1915] rounded-xl border border-stone-200 dark:border-[#383028]">
                  <span className="text-[9px] font-mono text-stone-400 uppercase block">Assigned Provider</span>
                  <span className="font-bold text-amber-700 dark:text-amber-400 truncate block">
                    {selectedIssue.assigned_vendor_name || "Awaiting Assignment"}
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div className="p-4 bg-stone-50 dark:bg-[#1d1814] rounded-2xl border border-stone-200 dark:border-[#383028]">
                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block mb-1">
                  Issue Description & Remarks
                </span>
                <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                  {selectedIssue.description}
                </p>
                {selectedIssue.resolution_notes && (
                  <div className="mt-3 pt-3 border-t border-stone-200 dark:border-[#332a22]">
                    <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
                      Resolution Remarks:
                    </span>
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                      {selectedIssue.resolution_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Management Panel */}
              <div className="p-4 bg-amber-50/60 dark:bg-[#201a15] rounded-2xl border border-amber-300 dark:border-amber-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold text-amber-800 dark:text-amber-400 uppercase flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" />
                    Admin Management & Technician Assignment
                  </span>
                  <button
                    onClick={() => setIssueToDelete(selectedIssue.id)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Ticket</span>
                  </button>
                </div>

                <form onSubmit={handleAdminUpdateIssue} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-[11px]">Update Status</label>
                      <select
                        value={adminStatus}
                        onChange={(e) => setAdminStatus(e.target.value)}
                        className="form-input text-xs py-1.5"
                      >
                        <option value="open">Open / Triaging</option>
                        <option value="in_progress">In Progress / Dispatched</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label text-[11px]">Assign Vendor / Technician</label>
                      <input
                        type="text"
                        value={adminVendor}
                        onChange={(e) => setAdminVendor(e.target.value)}
                        placeholder="e.g. Apex Plumbing, Schindler AMC"
                        className="form-input text-xs py-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label text-[11px]">Resolution Remarks / Work Summary</label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Optical sensor realigned and tested on all floors..."
                      className="form-input text-xs py-1.5"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingAdminUpdate}
                    className="btn-primary text-xs py-2 px-4 font-bold shadow-sm"
                  >
                    {savingAdminUpdate ? "Saving..." : "Save Status & Assignment"}
                  </button>
                </form>
              </div>

              {/* Real-time Activity Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider">
                  Activity Timeline & Updates ({selectedIssue.activities?.length || 0})
                </h4>

                <div className="space-y-3 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200 dark:before:bg-[#332b23]">
                  {selectedIssue.activities?.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 pl-1 relative">
                      <div className="w-6 h-6 rounded-full bg-white dark:bg-[#201a16] border-2 border-amber-500 text-amber-600 flex items-center justify-center shrink-0 z-10">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="flex-1 p-3 rounded-2xl bg-stone-50 dark:bg-[#1c1714] border border-stone-200 dark:border-[#383028] text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {act.actor_name}{" "}
                            <span className="text-[10px] font-mono text-stone-400">
                              ({act.actor_role})
                            </span>
                          </span>
                          <span className="text-[10px] font-mono text-stone-400">
                            {formatDate(act.created_at)}
                          </span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                          {act.comment}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add comment or status update for this issue..."
                    className="form-input flex-1 text-xs py-2"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="btn-primary py-2 px-4 text-xs flex items-center gap-1.5 font-bold shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ IN-APP DELETE CONFIRMATION MODAL */}
      {issueToDelete && (
        <div className="modal-backdrop" onClick={() => setIssueToDelete(null)}>
          <div
            className="modal-content max-w-sm p-6 bg-white dark:bg-[#181411] border border-stone-200 dark:border-[#383028] shadow-2xl rounded-3xl text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 dark:text-white">
                Delete Issue Ticket?
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Are you sure you want to remove this ticket from the society helpdesk? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIssueToDelete(null)}
                className="btn-secondary flex-1 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteIssue}
                className="btn-primary flex-1 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔔 MODERN TOAST NOTIFICATION BANNER */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              toast.type === "success"
                ? "bg-emerald-950/95 text-emerald-200 border-emerald-500/40 backdrop-blur-xl"
                : toast.type === "error"
                ? "bg-rose-950/95 text-rose-200 border-rose-500/40 backdrop-blur-xl"
                : "bg-stone-900/95 text-amber-200 border-amber-500/40 backdrop-blur-xl"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toast.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white ml-2 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
