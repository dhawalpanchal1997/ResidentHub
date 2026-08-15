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
  HeartHandshake, Edit3,
} from "lucide-react";

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
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
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

  // Compute calculated RSVP total amount based on demographic tier pricing
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
      // Optimistic dynamic update for instant UI feedback
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

      // Optimistic dynamic update
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Events & RSVPs</h1>
          <p className="text-sm text-slate-500 mt-0.5">{events.length} event{events.length !== 1 ? "s" : ""} total • Age-tiered RSVPs & Expense Budgeting</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {feedback.text}
        </div>
      )}

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
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700 mb-1">No events yet</h3>
          <p className="text-sm text-slate-500">
            {isAdmin ? "Create the first society event!" : "Events will appear here once created by the committee."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {events.map((ev) => {
            const isExpanded = expandedEvent === ev.id;
            const currentSubTab = activeSubTab[ev.id] || "rsvps";
            const isPast = new Date(ev.event_date) < new Date();
            const pendingRsvps = ev.rsvps?.filter(r => r.status === "pending") || [];
            const approvedRsvps = ev.rsvps?.filter(r => r.status === "approved") || [];
            const expenses = ev.expenses || [];

            // Dynamic Calculations
            const totalCol = approvedRsvps.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
            const pendingCol = pendingRsvps.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);
            const totalExp = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
            const netBal = totalCol - totalExp;

            const isFree = (ev.fee_adult || ev.fee_per_person || 0) === 0 && (ev.fee_child || 0) === 0 && (ev.fee_senior || 0) === 0;

            return (
              <div key={ev.id} className="card overflow-hidden">
                {/* Event Header Card */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isPast ? "bg-slate-100" : "bg-emerald-100"
                    }`}>
                      <Calendar className={`w-6 h-6 ${isPast ? "text-slate-400" : "text-emerald-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900">{ev.title}</h3>
                            {isAdmin && !isPast && (
                              <button
                                onClick={() => openEditModal(ev)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
                                title="Edit Event"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {ev.description && (
                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{ev.description}</p>
                          )}
                        </div>
                        {isPast && <span className="badge bg-slate-100 text-slate-500">Past • Concluded</span>}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(ev.event_date)} at {formatTime(ev.event_date)}
                        </span>
                        {ev.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {ev.venue}
                          </span>
                        )}
                      </div>

                      {/* Tiered Pricing Chips */}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[11px] text-slate-400 font-medium block">Headcount & RSVPs</span>
                          <span className="text-sm font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            {approvedRsvps.reduce((sum, r) => sum + (r.attendees_count || 1), 0)} Confirmed
                            <span className="text-[11px] font-normal text-slate-400">({ev.rsvps_count} total)</span>
                          </span>
                          {approvedRsvps.length > 0 && (
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {approvedRsvps.reduce((sum, r) => sum + (r.adults_count || 0), 0)} adults • {approvedRsvps.reduce((sum, r) => sum + (r.children_count || 0), 0)} kids • {approvedRsvps.reduce((sum, r) => sum + (r.seniors_count || 0), 0)} seniors
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-medium block">Total Collections</span>
                          <span className="text-sm font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            {formatINR(totalCol)}
                          </span>
                          {pendingCol > 0 && (
                            <span className="text-[10px] text-amber-600 block mt-0.5 font-medium">
                              +{formatINR(pendingCol)} pending approval
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-medium block">Total Expenses</span>
                          <span className="text-sm font-bold text-red-600 flex items-center gap-1 mt-0.5">
                            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                            {formatINR(totalExp)}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {expenses.length} logged expense{expenses.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 font-medium block">Net P&L Balance</span>
                          <span className={`text-sm font-bold flex items-center gap-1 mt-0.5 ${
                            netBal >= 0 ? "text-blue-700" : "text-amber-700"
                          }`}>
                            <Wallet className="w-3.5 h-3.5" />
                            {netBal >= 0 ? "+" : ""}{formatINR(netBal)}
                            <span className="text-[10px] font-normal text-slate-400">
                              ({netBal >= 0 ? "Surplus" : "Deficit"})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                    {!isPast && !hasUserRSVPd(ev) && (
                      <button
                        onClick={() => {
                          setRsvpEvent(ev);
                          setRsvpAdults(1);
                          setRsvpChildren(0);
                          setRsvpSeniors(0);
                          setRsvpUtr("");
                        }}
                        className="btn-primary text-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        RSVP with Family
                      </button>
                    )}
                    {isPast && !hasUserRSVPd(ev) && (
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                        🔒 RSVPs Closed
                      </span>
                    )}
                    {hasUserRSVPd(ev) && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 inline mr-1" />You've RSVP'd
                      </span>
                    )}

                    {isAdmin && (
                      <>
                        {!isPast ? (
                          <button
                            onClick={() => openEditModal(ev)}
                            className="btn-secondary text-xs flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Edit Event
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-lg" title="Past events cannot be edited">
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
                          className="btn-secondary text-xs flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Expense
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}
                      className="btn-ghost text-xs flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? "Hide Details" : "Manage & View Details"}
                      <span className="text-slate-400">({ev.rsvps_count} RSVPs • {expenses.length} Expenses)</span>
                    </button>

                    {isAdmin && (
                      <button onClick={() => handleExportCSV(ev.id)} className="btn-ghost text-xs flex items-center gap-1 ml-auto">
                        <Download className="w-3.5 h-3.5" />
                        Export Attendee CSV
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Section with Tabs */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-4">
                    {/* Sub-tabs header */}
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                      <button
                        onClick={() => setActiveSubTab({ ...activeSubTab, [ev.id]: "rsvps" })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          currentSubTab === "rsvps"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        RSVP Attendees ({ev.rsvps_count})
                        {pendingRsvps.length > 0 && (
                          <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                            {pendingRsvps.length}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveSubTab({ ...activeSubTab, [ev.id]: "expenses" })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          currentSubTab === "expenses"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                        }`}
                      >
                        <Receipt className="w-3.5 h-3.5 text-red-400" />
                        Expense Management ({expenses.length})
                        <span className="text-red-500 font-medium">({formatINR(totalExp)})</span>
                      </button>
                    </div>

                    {/* Tab 1: RSVPs */}
                    {currentSubTab === "rsvps" && (
                      <div>
                        {ev.rsvps && ev.rsvps.length > 0 ? (
                          <div className="space-y-2">
                            {ev.rsvps.map((rsvp) => (
                              <div key={rsvp.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                  {rsvp.member_name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-800">{rsvp.member_name}</p>
                                    <span className="text-xs text-slate-500 font-medium">{rsvp.flat_number}</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                                    <span className="font-semibold text-slate-700">
                                      Total: {rsvp.attendees_count} ({rsvp.adults_count} Adult{rsvp.adults_count !== 1 ? "s" : ""}, {rsvp.children_count} Kid{rsvp.children_count !== 1 ? "s" : ""}, {rsvp.seniors_count} Senior{rsvp.seniors_count !== 1 ? "s" : ""})
                                    </span>
                                    {rsvp.total_amount > 0 && <span>• {formatINR(rsvp.total_amount)}</span>}
                                    {rsvp.utr_number && <span className="text-blue-600 font-mono">• UTR: {rsvp.utr_number}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`badge badge-${rsvp.status}`}>{rsvp.status}</span>
                                  {isAdmin && rsvp.status === "pending" && (
                                    <>
                                      <button onClick={() => handleRSVPAction(rsvp.id, "approved")} className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600" title="Approve">
                                        <CheckCircle className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleRSVPAction(rsvp.id, "rejected")} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600" title="Reject">
                                        <XCircle className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 py-4 text-center">No RSVPs yet for this event.</p>
                        )}
                      </div>
                    )}

                    {/* Tab 2: Expense Management */}
                    {currentSubTab === "expenses" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                              Event Expenses & Budget Ledger
                            </h4>
                            <p className="text-xs text-slate-500">All vendor bills, catering, and logistical costs logged for {ev.title}</p>
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
                              className="btn-primary text-xs flex items-center gap-1 py-1.5 px-3 bg-red-600 hover:bg-red-700"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add Expense
                            </button>
                          )}
                        </div>

                        {expenses.length > 0 ? (
                          <div className="space-y-2">
                            {expenses.map((exp) => (
                              <div key={exp.id} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                                  <Receipt className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800">{exp.title}</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                                      <Tag className="w-2.5 h-2.5 mr-1" />
                                      {exp.category}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {exp.vendor_name && <span className="font-medium text-slate-700">{exp.vendor_name} • </span>}
                                    {exp.expense_date}
                                    {exp.invoice_ref && <span className="text-blue-600 ml-1.5">• Ref: {exp.invoice_ref}</span>}
                                  </p>
                                </div>
                                <span className="text-sm font-bold text-red-600 whitespace-nowrap">
                                  -{formatINR(exp.amount)}
                                </span>
                                {isAdmin && (
                                  <button
                                    onClick={() => handleDeleteExpense(exp.id)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                                    title="Delete expense"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {/* Summary Footer */}
                            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 font-semibold text-xs text-slate-700">
                              <span>Total Event Expenses Logged</span>
                              <span className="text-sm font-bold text-red-600">{formatINR(totalExp)}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-6 rounded-xl border border-slate-200 text-center">
                            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-slate-700">No expenses recorded yet</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {isAdmin
                                ? "Click '+ Add Expense' above to log catering, sound, or decoration costs."
                                : "The committee has not logged any expense items for this event."}
                            </p>
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

      {/* Create Event Modal with Tiered Pricing */}
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-content p-6 max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create New Event</h2>
                <p className="text-xs text-slate-500">Set event details & demographic pricing tiers</p>
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

              {/* Age-Tiered Pricing Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                  Demographic Pricing Tiers (₹ per person)
                </label>
                <p className="text-[11px] text-slate-500 mb-3">Leave as 0 for free events.</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      👨 Adult (18-59y)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newFeeAdult}
                      onChange={(e) => setNewFeeAdult(Number(e.target.value))}
                      className="form-input"
                      placeholder="450"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      🧒 Child (&lt;12y)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newFeeChild}
                      onChange={(e) => setNewFeeChild(Number(e.target.value))}
                      className="form-input"
                      placeholder="200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      👵 Senior (60+y)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newFeeSenior}
                      onChange={(e) => setNewFeeSenior(Number(e.target.value))}
                      className="form-input"
                      placeholder="300"
                    />
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

      {/* Edit Event Modal (Admin) */}
      {editEvent && (
        <div className="modal-backdrop" onClick={() => setEditEvent(null)}>
          <div className="modal-content p-6 max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Event</h2>
                <p className="text-xs text-slate-500">Update event information and pricing</p>
              </div>
              <button onClick={() => setEditEvent(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div>
                <label className="form-label">Event Title *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="form-input min-h-[70px] resize-y"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Date & Time *</label>
                  <input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Venue</label>
                  <input
                    type="text"
                    value={editVenue}
                    onChange={(e) => setEditVenue(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Age-Tiered Pricing Section */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-2">
                  Demographic Pricing Tiers (₹ per person)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      👨 Adult (18-59y)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editFeeAdult}
                      onChange={(e) => setEditFeeAdult(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      🧒 Child (&lt;12y)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editFeeChild}
                      onChange={(e) => setEditFeeChild(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-1">
                      👵 Senior (60+y)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editFeeSenior}
                      onChange={(e) => setEditFeeSenior(Number(e.target.value))}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(editEvent.id)}
                  className="btn-ghost text-red-600 hover:bg-red-50 text-xs flex items-center gap-1"
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

      {/* RSVP Modal with Demographic Stepper Counter */}
      {rsvpEvent && (
        <div className="modal-backdrop" onClick={() => setRsvpEvent(null)}>
          <div className="modal-content p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">RSVP for Event</h2>
                <p className="text-xs text-slate-500">Select attendee counts for your family members</p>
              </div>
              <button onClick={() => setRsvpEvent(null)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl mb-4 border border-slate-200">
              <p className="text-sm font-bold text-slate-800">{rsvpEvent.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatDate(rsvpEvent.event_date)} • {rsvpEvent.venue}</p>
            </div>

            <form onSubmit={handleSubmitRSVP} className="space-y-4">
              {/* Demographic Stepper Counters */}
              <div className="space-y-3">
                {/* 1. Adults */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Adults (18–59 yrs)</p>
                      <p className="text-xs text-emerald-700 font-medium">
                        {(rsvpEvent.fee_adult || rsvpEvent.fee_per_person || 0) > 0 ? `${formatINR(rsvpEvent.fee_adult || rsvpEvent.fee_per_person || 0)} / person` : "Free"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRsvpAdults(Math.max(0, rsvpAdults - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-900">{rsvpAdults}</span>
                    <button
                      type="button"
                      onClick={() => setRsvpAdults(rsvpAdults + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. Children */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
                      <Baby className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Children (Under 12 yrs)</p>
                      <p className="text-xs text-sky-700 font-medium">
                        {(rsvpEvent.fee_child || 0) > 0 ? `${formatINR(rsvpEvent.fee_child || 0)} / person` : "Free"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRsvpChildren(Math.max(0, rsvpChildren - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-900">{rsvpChildren}</span>
                    <button
                      type="button"
                      onClick={() => setRsvpChildren(rsvpChildren + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3. Senior Citizens */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Senior Citizens (60+ yrs)</p>
                      <p className="text-xs text-amber-700 font-medium">
                        {(rsvpEvent.fee_senior || 0) > 0 ? `${formatINR(rsvpEvent.fee_senior || 0)} / person` : "Free"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRsvpSeniors(Math.max(0, rsvpSeniors - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-900">{rsvpSeniors}</span>
                    <button
                      type="button"
                      onClick={() => setRsvpSeniors(rsvpSeniors + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Calculation Display */}
              {calculateRsvpTotal() > 0 ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-800">Total Attendees:</span>
                    <span className="text-sm font-bold text-emerald-900">{rsvpAdults + rsvpChildren + rsvpSeniors}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
                    <span className="text-xs font-bold text-emerald-900">Total Payable Amount:</span>
                    <span className="text-base font-extrabold text-emerald-700">{formatINR(calculateRsvpTotal())}</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 pt-0.5">
                    {rsvpAdults > 0 && `${rsvpAdults} Adult(s) × ${formatINR(rsvpEvent.fee_adult || rsvpEvent.fee_per_person || 0)}`}
                    {rsvpChildren > 0 && ` + ${rsvpChildren} Child(ren) × ${formatINR(rsvpEvent.fee_child || 0)}`}
                    {rsvpSeniors > 0 && ` + ${rsvpSeniors} Senior(s) × ${formatINR(rsvpEvent.fee_senior || 0)}`}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs font-semibold text-slate-700">
                    Total: {rsvpAdults + rsvpChildren + rsvpSeniors} attendee(s) • Free Entry
                  </span>
                </div>
              )}

              {calculateRsvpTotal() > 0 && (
                <div>
                  <label className="form-label flex items-center justify-between">
                    <span>UPI UTR / Transaction Reference <span className="text-red-500 font-bold">*</span></span>
                    <span className="text-[10px] text-emerald-600 font-medium">Required for verification</span>
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
                    Enter the 12-digit UTR or transaction ID from your UPI payment app after paying to society QR.
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
                <button type="submit" disabled={submittingExpense} className="btn-primary flex-1 bg-red-600 hover:bg-red-700">
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
