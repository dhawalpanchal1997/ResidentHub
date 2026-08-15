"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import {
  fetchEvents, createEvent, updateEvent, deleteEvent, submitRSVP, updateRSVPStatus, getCSVExportUrl, getToken,
  createEventExpense, deleteEventExpense,
  EventItem, RSVPItem, EventExpenseItem,
} from "@/lib/api";
import {
  Calendar, Plus, CheckCircle, XCircle, Download, Clock, MapPin, Users,
  X, AlertCircle, ChevronDown, ChevronUp, DollarSign, Send, Receipt,
  TrendingDown, TrendingUp, Wallet, Trash2, Tag, Minus, User, Baby,
  HeartHandshake, Edit3, Search, Filter, Sparkles, QrCode, Lock, Check,
} from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";

const EXPENSE_CATEGORIES = [
  "Catering & Food",
  "Decorations & Stage",
  "DJ & Sound",
  "Prizes & Gifts",
  "Cleaning & Housekeeping",
  "Security & Crowd Control",
  "Misc / Supplies",
];

export default function EventsPage() {
  const { user, isAdmin } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<Record<string, "rsvps" | "expenses">>({});
  
  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "upcoming" | "past" | "my_rsvps">("all");

  // Create Event Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newFeeAdult, setNewFeeAdult] = useState(0);
  const [newFeeChild, setNewFeeChild] = useState(0);
  const [newFeeSenior, setNewFeeSenior] = useState(0);
  const [creating, setCreating] = useState(false);

  // Edit Event Modal State (Admin)
  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editVenue, setEditVenue] = useState("");
  const [editFeeAdult, setEditFeeAdult] = useState(0);
  const [editFeeChild, setEditFeeChild] = useState(0);
  const [editFeeSenior, setEditFeeSenior] = useState(0);
  const [updating, setUpdating] = useState(false);

  // RSVP Modal State
  const [rsvpEvent, setRsvpEvent] = useState<EventItem | null>(null);
  const [rsvpAdults, setRsvpAdults] = useState(1);
  const [rsvpChildren, setRsvpChildren] = useState(0);
  const [rsvpSeniors, setRsvpSeniors] = useState(0);
  const [rsvpUtr, setRsvpUtr] = useState("");
  const [submittingRsvp, setSubmittingRsvp] = useState(false);

  // Add Expense Modal State
  const [expenseEvent, setExpenseEvent] = useState<EventItem | null>(null);
  const [expenseCategory, setExpenseCategory] = useState("Catering & Food");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [expenseInvoiceRef, setExpenseInvoiceRef] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadEvents = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createEvent({
        title: newTitle,
        description: newDesc,
        event_date: new Date(newDate).toISOString(),
        venue: newVenue,
        fee_per_person: newFeeAdult,
        fee_adult: newFeeAdult,
        fee_child: newFeeChild,
        fee_senior: newFeeSenior,
      });
      setShowCreate(false);
      setNewTitle(""); setNewDesc(""); setNewDate(""); setNewVenue("");
      setNewFeeAdult(0); setNewFeeChild(0); setNewFeeSenior(0);
      showFeedback("success", "Event created with age-tiered pricing!");
      await loadEvents();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (ev: EventItem) => {
    setEditEvent(ev);
    setEditTitle(ev.title);
    setEditDesc(ev.description || "");
    try {
      const d = new Date(ev.event_date);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
      setEditDate(localISOTime);
    } catch {
      setEditDate(ev.event_date.slice(0, 16));
    }
    setEditVenue(ev.venue || "");
    setEditFeeAdult(ev.fee_adult || ev.fee_per_person || 0);
    setEditFeeChild(ev.fee_child || 0);
    setEditFeeSenior(ev.fee_senior || 0);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEvent) return;
    setUpdating(true);
    try {
      await updateEvent(editEvent.id, {
        title: editTitle,
        description: editDesc,
        event_date: new Date(editDate).toISOString(),
        venue: editVenue,
        fee_per_person: editFeeAdult,
        fee_adult: editFeeAdult,
        fee_child: editFeeChild,
        fee_senior: editFeeSenior,
      });
      setEditEvent(null);
      showFeedback("success", "Event updated successfully!");
      await loadEvents();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This will remove all RSVPs and expenses for this event.")) return;
    try {
      await deleteEvent(eventId);
      if (editEvent?.id === eventId) setEditEvent(null);
      showFeedback("success", "Event deleted!");
      await loadEvents();
    } catch (err: any) {
      showFeedback("error", err.message);
    }
  };

  const calculateRsvpTotal = () => {
    if (!rsvpEvent) return 0;
    const adultFee = rsvpEvent.fee_adult || rsvpEvent.fee_per_person || 0;
    const childFee = rsvpEvent.fee_child || 0;
    const seniorFee = rsvpEvent.fee_senior || 0;

    return (rsvpAdults * adultFee) + (rsvpChildren * childFee) + (rsvpSeniors * seniorFee);
  };

  const handleSubmitRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpEvent || !user) return;

    const totalCount = rsvpAdults + rsvpChildren + rsvpSeniors;
    if (totalCount <= 0) {
      showFeedback("error", "Please add at least 1 attendee.");
      return;
    }

    const totalAmount = calculateRsvpTotal();
    if (totalAmount > 0 && !rsvpUtr.trim()) {
      showFeedback("error", "UPI UTR / Transaction Reference Number is mandatory to verify your payment.");
      return;
    }

    setSubmittingRsvp(true);
    try {
      await submitRSVP(rsvpEvent.id, {
        member_name: user.full_name,
        flat_number: user.flat_number,
        adults_count: rsvpAdults,
        children_count: rsvpChildren,
        seniors_count: rsvpSeniors,
        total_amount: totalAmount,
        utr_number: rsvpUtr.trim() || undefined,
      });
      setRsvpEvent(null);
      setRsvpAdults(1); setRsvpChildren(0); setRsvpSeniors(0); setRsvpUtr("");
      showFeedback("success", "RSVP submitted successfully! Admin will verify your payment.");
      await loadEvents();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setSubmittingRsvp(false);
    }
  };

  const handleRSVPAction = async (rsvpId: string, status: "approved" | "rejected") => {
    try {
      setEvents((prev) =>
        prev.map((ev) => {
          if (!ev.rsvps?.some((r) => r.id === rsvpId)) return ev;
          const updatedRsvps = ev.rsvps.map((r) =>
            r.id === rsvpId ? { ...r, status } : r
          );
          const approved = updatedRsvps.filter((r) => r.status === "approved");
          const totalCol = approved.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
          const totalExp = (ev.expenses || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          return {
            ...ev,
            rsvps: updatedRsvps,
            total_collected: totalCol,
            total_attendees: approved.reduce((sum, r) => sum + (r.attendees_count || 1), 0),
            total_adults: approved.reduce((sum, r) => sum + (r.adults_count || 0), 0),
            total_children: approved.reduce((sum, r) => sum + (r.children_count || 0), 0),
            total_seniors: approved.reduce((sum, r) => sum + (r.seniors_count || 0), 0),
            net_balance: totalCol - totalExp,
          };
        })
      );

      await updateRSVPStatus(rsvpId, status);
      showFeedback("success", `RSVP ${status}! Collections & P&L updated.`);
      await loadEvents();
    } catch (err: any) {
      showFeedback("error", err.message);
      await loadEvents();
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseEvent) return;
    setSubmittingExpense(true);
    try {
      const newExp = await createEventExpense(expenseEvent.id, {
        category: expenseCategory,
        title: expenseTitle,
        vendor_name: expenseVendor || undefined,
        amount: expenseAmount,
        invoice_ref: expenseInvoiceRef || undefined,
        expense_date: expenseDate,
      });

      setEvents((prev) =>
        prev.map((ev) => {
          if (ev.id !== expenseEvent.id) return ev;
          const updatedExpenses = [newExp, ...(ev.expenses || [])];
          const totalExp = updatedExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
          const totalCol = (ev.rsvps || [])
            .filter((r) => r.status === "approved")
            .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
          return {
            ...ev,
            expenses: updatedExpenses,
            total_expenses: totalExp,
            net_balance: totalCol - totalExp,
          };
        })
      );

      setExpenseEvent(null);
      setExpenseTitle(""); setExpenseVendor(""); setExpenseAmount(0); setExpenseInvoiceRef("");
      showFeedback("success", "Event expense recorded! Total expenses & P&L updated.");
      await loadEvents();
    } catch (err: any) {
      showFeedback("error", err.message);
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      setEvents((prev) =>
        prev.map((ev) => {
          if (!ev.expenses?.some((e) => e.id === expenseId)) return ev;
          const updatedExpenses = ev.expenses.filter((e) => e.id !== expenseId);
          const totalExp = updatedExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
          const totalCol = (ev.rsvps || [])
            .filter((r) => r.status === "approved")
            .reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
          return {
            ...ev,
            expenses: updatedExpenses,
            total_expenses: totalExp,
            net_balance: totalCol - totalExp,
          };
        })
      );

      await deleteEventExpense(expenseId);
      showFeedback("success", "Expense deleted! Total expenses & P&L recalculated.");
      await loadEvents();
    } catch (err: any) {
      showFeedback("error", err.message);
      await loadEvents();
    }
  };

  const handleExportCSV = (eventId: string) => {
    const url = getCSVExportUrl(eventId);
    const token = getToken();
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `attendees_${eventId}.csv`;
        a.click();
      })
      .catch(() => showFeedback("error", "Failed to download CSV"));
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const hasUserRSVPd = (ev: EventItem) => ev.rsvps?.some(r => r.user_id === user?.id);

  // Filtered Events List
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ev.venue && ev.venue.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ev.description && ev.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    const isPast = new Date(ev.event_date) < new Date();
    if (filterTab === "upcoming") return !isPast;
    if (filterTab === "past") return isPast;
    if (filterTab === "my_rsvps") return hasUserRSVPd(ev);
    return true;
  });

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Calendar className="w-12 h-12 text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-1">Sign in to view events</h2>
          <p className="text-sm text-slate-500">Access event details, age-tiered RSVPs, and expense budgets</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Events & RSVPs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover society celebrations, RSVP with demographic headcount, and track live budgets
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary shrink-0 self-start sm:self-auto">
            <Plus className="w-4 h-4" />
            Create Event
          </button>
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

      {/* Modern Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterTab("all")}
            className={`tab-pill ${filterTab === "all" ? "tab-pill-active" : "tab-pill-inactive"}`}
          >
            All Events ({events.length})
          </button>
          <button
            onClick={() => setFilterTab("upcoming")}
            className={`tab-pill ${filterTab === "upcoming" ? "tab-pill-active" : "tab-pill-inactive"}`}
          >
            Upcoming ({events.filter(e => new Date(e.event_date) > new Date()).length})
          </button>
          <button
            onClick={() => setFilterTab("past")}
            className={`tab-pill ${filterTab === "past" ? "tab-pill-active" : "tab-pill-inactive"}`}
          >
            Past ({events.filter(e => new Date(e.event_date) <= new Date()).length})
          </button>
          <button
            onClick={() => setFilterTab("my_rsvps")}
            className={`tab-pill ${filterTab === "my_rsvps" ? "tab-pill-active" : "tab-pill-inactive"}`}
          >
            My RSVPs ({events.filter(e => hasUserRSVPd(e)).length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, venue..."
            className="form-input pl-9 text-xs py-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-base font-bold text-slate-700 mb-1">No events match your criteria</h3>
          <p className="text-xs text-slate-500">
            {searchQuery ? "Try clearing your search query" : "Check back soon for new society celebrations!"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredEvents.map((ev) => {
            const isExpanded = expandedEvent === ev.id;
            const currentSubTab = activeSubTab[ev.id] || "rsvps";
            const isPast = new Date(ev.event_date) < new Date();
            const evDate = new Date(ev.event_date);
            const pendingRsvps = ev.rsvps?.filter(r => r.status === "pending") || [];
            const approvedRsvps = ev.rsvps?.filter(r => r.status === "approved") || [];
            const expenses = ev.expenses || [];

            // Dynamic Real-time Calculations
            const totalCol = approvedRsvps.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
            const pendingCol = pendingRsvps.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
            const totalExp = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
            const netBal = totalCol - totalExp;

            const isFree = (ev.fee_adult || ev.fee_per_person || 0) === 0 && (ev.fee_child || 0) === 0 && (ev.fee_senior || 0) === 0;

            return (
              <div key={ev.id} className="card overflow-hidden transition-all">
                {/* Event Header Card */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Visual Date Badge */}
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                      isPast
                        ? "bg-slate-100 border-slate-200 text-slate-400"
                        : "bg-gradient-to-b from-white to-slate-50 border-slate-200 shadow-sm"
                    }`}>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isPast ? "text-slate-400" : "text-rose-600"}`}>
                        {evDate.toLocaleDateString("en-IN", { month: "short" })}
                      </span>
                      <span className="text-xl font-extrabold text-slate-900 leading-none mt-0.5">
                        {evDate.getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900 tracking-tight">{ev.title}</h3>
                            {isAdmin && !isPast && (
                              <button
                                onClick={() => openEditModal(ev)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                                title="Edit Event Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {ev.description && (
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{ev.description}</p>
                          )}
                        </div>

                        {isPast && (
                          <span className="badge bg-slate-100 text-slate-500 shrink-0">
                            Past • Concluded
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDate(ev.event_date)} at {formatTime(ev.event_date)}
                        </span>
                        {ev.venue && (
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {ev.venue}
                          </span>
                        )}
                      </div>

                      {/* Tiered Pricing Chips */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {isFree ? (
                          <span className="badge bg-emerald-100 text-emerald-800">
                            🎉 Free Entry for All
                          </span>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <User className="w-3 h-3 text-emerald-600" />
                              Adult: {formatINR(ev.fee_adult || ev.fee_per_person || 0)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                              <Baby className="w-3 h-3 text-sky-600" />
                              Child: {formatINR(ev.fee_child || 0)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <HeartHandshake className="w-3 h-3 text-amber-600" />
                              Senior: {formatINR(ev.fee_senior || 0)}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Dynamic Financial & Demographic Headcount Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/70">
                        <div>
                          <span className="text-[11px] text-slate-400 font-semibold block font-mono">HEADCOUNT</span>
                          <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            <AnimatedCounter
                              value={approvedRsvps.reduce((sum, r) => sum + (r.attendees_count || 1), 0)}
                              suffix=" Confirmed"
                            />
                            <span className="text-[10px] font-normal text-slate-400">({ev.rsvps_count} RSVPs)</span>
                          </span>
                          {approvedRsvps.length > 0 && (
                            <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                              {approvedRsvps.reduce((sum, r) => sum + (r.adults_count || 0), 0)}A • {approvedRsvps.reduce((sum, r) => sum + (r.children_count || 0), 0)}C • {approvedRsvps.reduce((sum, r) => sum + (r.seniors_count || 0), 0)}S
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-semibold block font-mono">COLLECTIONS</span>
                          <span className="text-sm font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5 font-mono">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            <AnimatedCounter
                              value={totalCol}
                              formatter={formatINR}
                            />
                          </span>
                          {pendingCol > 0 && (
                            <span className="text-[10px] text-amber-600 block mt-0.5 font-medium">
                              +{formatINR(pendingCol)} pending
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-semibold block font-mono">EXPENSES</span>
                          <span className="text-sm font-extrabold text-rose-600 flex items-center gap-1 mt-0.5 font-mono">
                            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                            <AnimatedCounter
                              value={totalExp}
                              formatter={formatINR}
                            />
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {expenses.length} vendor bill{expenses.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-semibold block font-mono">NET P&L BALANCE</span>
                          <span className={`text-sm font-extrabold flex items-center gap-1 mt-0.5 font-mono ${
                            netBal >= 0 ? "text-blue-700" : "text-amber-700"
                          }`}>
                            <Wallet className="w-3.5 h-3.5" />
                            {netBal >= 0 ? "+" : ""}{formatINR(netBal)}
                            <span className="text-[10px] font-normal text-slate-400 font-sans">
                              ({netBal >= 0 ? "Surplus" : "Deficit"})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3.5 border-t border-slate-100">
                    {!isPast && !hasUserRSVPd(ev) && (
                      <button
                        onClick={() => {
                          setRsvpEvent(ev);
                          setRsvpAdults(1);
                          setRsvpChildren(0);
                          setRsvpSeniors(0);
                          setRsvpUtr("");
                        }}
                        className="btn-primary text-xs py-2 px-3.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        RSVP with Family
                      </button>
                    )}
                    {isPast && !hasUserRSVPd(ev) && (
                      <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
                        <Lock className="w-3 h-3" /> RSVPs Closed
                      </span>
                    )}
                    {hasUserRSVPd(ev) && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> RSVP Submitted
                      </span>
                    )}

                    {isAdmin && (
                      <>
                        {!isPast ? (
                          <button
                            onClick={() => openEditModal(ev)}
                            className="btn-secondary text-xs py-1.5 px-3"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl" title="Past events cannot be edited">
                            🔒 Edits Closed
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setExpenseEvent(ev);
                            setExpenseTitle("");
                            setExpenseVendor("");
                            setExpenseAmount(0);
                            setExpenseInvoiceRef("");
                          }}
                          className="btn-secondary text-xs py-1.5 px-3 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Expense
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                      className="btn-ghost text-xs ml-1 flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? "Hide Details" : "Attendees & Budget"}
                      <span className="text-slate-400 font-mono">({ev.rsvps_count} RSVPs • {expenses.length} bills)</span>
                    </button>

                    {isAdmin && (
                      <button onClick={() => handleExportCSV(ev.id)} className="btn-ghost text-xs ml-auto flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/90 px-6 py-5">
                    {/* Sub-tabs */}
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-3">
                      <button
                        onClick={() => setActiveSubTab({ ...activeSubTab, [ev.id]: "rsvps" })}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          currentSubTab === "rsvps"
                            ? "bg-slate-950 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        RSVP Attendees ({ev.rsvps_count})
                        {pendingRsvps.length > 0 && (
                          <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                            {pendingRsvps.length} pending
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveSubTab({ ...activeSubTab, [ev.id]: "expenses" })}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          currentSubTab === "expenses"
                            ? "bg-slate-950 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5 text-rose-500" />
                        Event Expenses ({expenses.length})
                        <span className="text-rose-600 font-mono font-medium">({formatINR(totalExp)})</span>
                      </button>
                    </div>

                    {/* Sub-tab 1: RSVPs */}
                    {currentSubTab === "rsvps" && (
                      <div>
                        {ev.rsvps && ev.rsvps.length > 0 ? (
                          <div className="space-y-2.5">
                            {ev.rsvps.map((rsvp) => (
                              <div key={rsvp.id} className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0">
                                  {rsvp.member_name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-slate-900">{rsvp.member_name}</p>
                                    <span className="text-[11px] font-semibold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
                                      Flat {rsvp.flat_number}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-slate-500 mt-1">
                                    <span className="font-semibold text-slate-700">
                                      Total: {rsvp.attendees_count} ({rsvp.adults_count}A • {rsvp.children_count}C • {rsvp.seniors_count}S)
                                    </span>
                                    {rsvp.total_amount > 0 && <span className="font-mono font-bold text-slate-900">• {formatINR(rsvp.total_amount)}</span>}
                                    {rsvp.utr_number && <span className="text-blue-600 font-mono bg-blue-50 px-1.5 py-0.2 rounded">• UTR: {rsvp.utr_number}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`badge badge-${rsvp.status}`}>{rsvp.status}</span>
                                  {isAdmin && rsvp.status === "pending" && (
                                    <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                                      <button
                                        onClick={() => handleRSVPAction(rsvp.id, "approved")}
                                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600"
                                        title="Approve RSVP Payment"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleRSVPAction(rsvp.id, "rejected")}
                                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                                        title="Reject RSVP"
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 py-4 text-center">No RSVPs recorded yet for this event.</p>
                        )}
                      </div>
                    )}

                    {/* Sub-tab 2: Expenses */}
                    {currentSubTab === "expenses" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                              Vendor Bills & Logistics Ledger
                            </h4>
                            <p className="text-xs text-slate-500">Track all operational expenditures logged for {ev.title}</p>
                          </div>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setExpenseEvent(ev);
                                setExpenseTitle("");
                                setExpenseVendor("");
                                setExpenseAmount(0);
                                setExpenseInvoiceRef("");
                              }}
                              className="btn-primary text-xs py-1.5 px-3 bg-rose-600 hover:bg-rose-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Expense
                            </button>
                          )}
                        </div>

                        {expenses.length > 0 ? (
                          <div className="space-y-2">
                            {expenses.map((exp) => (
                              <div key={exp.id} className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                                  <Receipt className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{exp.title}</span>
                                    <span className="badge bg-slate-100 text-slate-700 text-[10px]">
                                      <Tag className="w-2.5 h-2.5 mr-0.5" />
                                      {exp.category}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                                    {exp.vendor_name && <span className="font-semibold text-slate-800">{exp.vendor_name} • </span>}
                                    {exp.expense_date}
                                    {exp.invoice_ref && <span className="text-blue-600 ml-1.5">• Ref: {exp.invoice_ref}</span>}
                                  </p>
                                </div>
                                <span className="text-sm font-extrabold text-rose-600 font-mono">
                                  -{formatINR(exp.amount)}
                                </span>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 ml-1"
                                    title="Delete expense"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}

                            <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 font-bold text-xs text-slate-800">
                              <span>Total Event Expenses Logged</span>
                              <span className="text-sm font-extrabold text-rose-600 font-mono">{formatINR(totalExp)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
                            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-medium text-slate-700">No expenses recorded yet</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6 max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create New Event</h2>
                <p className="text-xs text-slate-500">Configure event details & demographic pricing tiers</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="form-label">Event Title *</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Diwali Grand Celebration" className="form-input" required />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Event details..." className="form-input min-h-[70px] resize-y" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Date & Time *</label>
                  <input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Venue</label>
                  <input type="text" value={newVenue} onChange={(e) => setNewVenue(e.target.value)} placeholder="Society Clubhouse" className="form-input" />
                </div>
              </div>

              {/* Age-Tiered Pricing */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1 font-mono">
                  Demographic Pricing Tiers (₹ per person)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">Set 0 for free admission</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">👨 Adult (18-59y)</label>
                    <input type="number" min={0} value={newFeeAdult} onChange={(e) => setNewFeeAdult(Number(e.target.value))} className="form-input" placeholder="450" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">🧒 Child (&lt;12y)</label>
                    <input type="number" min={0} value={newFeeChild} onChange={(e) => setNewFeeChild(Number(e.target.value))} className="form-input" placeholder="200" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">👵 Senior (60+y)</label>
                    <input type="number" min={0} value={newFeeSenior} onChange={(e) => setNewFeeSenior(Number(e.target.value))} className="form-input" placeholder="300" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editEvent && (
        <div className="modal-backdrop" onClick={() => setEditEvent(null)}>
          <div className="modal-content p-6 max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Event Details</h2>
                <p className="text-xs text-slate-500">Update event schedule & fee structure</p>
              </div>
              <button onClick={() => setEditEvent(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="form-label">Event Title *</label>
                <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="form-input" required />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="form-input min-h-[70px] resize-y" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Date & Time *</label>
                  <input type="datetime-local" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="form-input" required />
                </div>
                <div>
                  <label className="form-label">Venue</label>
                  <input type="text" value={editVenue} onChange={(e) => setEditVenue(e.target.value)} className="form-input" />
                </div>
              </div>

              {/* Age-Tiered Pricing */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 font-mono">
                  Demographic Pricing Tiers (₹ per person)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">👨 Adult (18-59y)</label>
                    <input type="number" min={0} value={editFeeAdult} onChange={(e) => setEditFeeAdult(Number(e.target.value))} className="form-input" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">🧒 Child (&lt;12y)</label>
                    <input type="number" min={0} value={editFeeChild} onChange={(e) => setEditFeeChild(Number(e.target.value))} className="form-input" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">👵 Senior (60+y)</label>
                    <input type="number" min={0} value={editFeeSenior} onChange={(e) => setEditFeeSenior(Number(e.target.value))} className="form-input" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(editEvent.id)}
                  className="btn-ghost text-rose-600 hover:bg-rose-50 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Event
                </button>

                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditEvent(null)} className="btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" disabled={updating} className="btn-primary text-xs">
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RSVP Modal with Demographic Stepper */}
      {rsvpEvent && (
        <div className="modal-backdrop" onClick={() => setRsvpEvent(null)}>
          <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">RSVP with Family</h2>
                <p className="text-xs text-slate-500">Select demographic headcounts for your household</p>
              </div>
              <button onClick={() => setRsvpEvent(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl mb-4 border border-slate-200">
              <p className="text-sm font-bold text-slate-900">{rsvpEvent.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(rsvpEvent.event_date)} • {rsvpEvent.venue}</p>
            </div>

            <form onSubmit={handleSubmitRSVP} className="space-y-4">
              {/* Stepper Counters */}
              <div className="space-y-2.5">
                {/* Adults */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Adults (18–59 yrs)</p>
                      <p className="text-xs text-emerald-700 font-bold font-mono">
                        {(rsvpEvent.fee_adult || rsvpEvent.fee_per_person || 0) > 0 ? `${formatINR(rsvpEvent.fee_adult || rsvpEvent.fee_per_person || 0)} / person` : "Free"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRsvpAdults(Math.max(0, rsvpAdults - 1))}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-extrabold text-slate-900 font-mono">{rsvpAdults}</span>
                    <button
                      type="button"
                      onClick={() => setRsvpAdults(rsvpAdults + 1)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                      <Baby className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Children (Under 12 yrs)</p>
                      <p className="text-xs text-sky-700 font-bold font-mono">
                        {(rsvpEvent.fee_child || 0) > 0 ? `${formatINR(rsvpEvent.fee_child || 0)} / person` : "Free"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRsvpChildren(Math.max(0, rsvpChildren - 1))}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-extrabold text-slate-900 font-mono">{rsvpChildren}</span>
                    <button
                      type="button"
                      onClick={() => setRsvpChildren(rsvpChildren + 1)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Seniors */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Senior Citizens (60+ yrs)</p>
                      <p className="text-xs text-amber-700 font-bold font-mono">
                        {(rsvpEvent.fee_senior || 0) > 0 ? `${formatINR(rsvpEvent.fee_senior || 0)} / person` : "Free"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRsvpSeniors(Math.max(0, rsvpSeniors - 1))}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-extrabold text-slate-900 font-mono">{rsvpSeniors}</span>
                    <button
                      type="button"
                      onClick={() => setRsvpSeniors(rsvpSeniors + 1)}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Total Price Breakdown */}
              {calculateRsvpTotal() > 0 ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800">Headcount:</span>
                    <span className="text-sm font-extrabold text-emerald-950 font-mono">
                      {rsvpAdults + rsvpChildren + rsvpSeniors} Attendees
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
                    <span className="text-xs font-bold text-emerald-950">Total Payable Amount:</span>
                    <span className="text-base font-extrabold text-emerald-700 font-mono">
                      {formatINR(calculateRsvpTotal())}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 pt-0.5 font-mono">
                    {rsvpAdults > 0 && `${rsvpAdults} Adult(s) × ${formatINR(rsvpEvent.fee_adult || rsvpEvent.fee_per_person || 0)}`}
                    {rsvpChildren > 0 && ` + ${rsvpChildren} Child(ren) × ${formatINR(rsvpEvent.fee_child || 0)}`}
                    {rsvpSeniors > 0 && ` + ${rsvpSeniors} Senior(s) × ${formatINR(rsvpEvent.fee_senior || 0)}`}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-700">
                    Total: {rsvpAdults + rsvpChildren + rsvpSeniors} attendee(s) • Free Admission
                  </span>
                </div>
              )}

              {/* Mandatory UTR Input */}
              {calculateRsvpTotal() > 0 && (
                <div>
                  <label className="form-label flex items-center justify-between">
                    <span>UPI UTR / Transaction Reference <span className="text-rose-500 font-bold">*</span></span>
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono">Required</span>
                  </label>
                  <input
                    type="text"
                    value={rsvpUtr}
                    onChange={(e) => setRsvpUtr(e.target.value)}
                    placeholder="e.g. UPI-9834710293 or 239481729012"
                    className="form-input font-mono"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Enter the 12-digit UTR reference after paying to the society UPI QR code
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setRsvpEvent(null)} className="btn-secondary flex-1">Cancel</button>
                <button
                  type="submit"
                  disabled={
                    submittingRsvp ||
                    (rsvpAdults + rsvpChildren + rsvpSeniors <= 0) ||
                    (calculateRsvpTotal() > 0 && !rsvpUtr.trim())
                  }
                  className="btn-primary flex-1"
                >
                  {submittingRsvp ? "Submitting..." : `Submit RSVP (${rsvpAdults + rsvpChildren + rsvpSeniors} Attendees)`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Expense Modal (Admin) */}
      {expenseEvent && (
        <div className="modal-backdrop" onClick={() => setExpenseEvent(null)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add Event Expense</h2>
                <p className="text-xs text-slate-500 mt-0.5">Log vendor/supply cost for {expenseEvent.title}</p>
              </div>
              <button onClick={() => setExpenseEvent(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="form-label">Expense Category *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="form-input"
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Description / Item Title *</label>
                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  placeholder="e.g. Catered buffet dinner advance"
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Vendor / Contractor</label>
                  <input
                    type="text"
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                    placeholder="e.g. Royal Caterers"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Invoice / Receipt Ref</label>
                  <input
                    type="text"
                    value={expenseInvoiceRef}
                    onChange={(e) => setExpenseInvoiceRef(e.target.value)}
                    placeholder="e.g. INV-9821"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Expense Date *</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setExpenseEvent(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submittingExpense} className="btn-primary flex-1 bg-rose-600 hover:bg-rose-700">
                  {submittingExpense ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
