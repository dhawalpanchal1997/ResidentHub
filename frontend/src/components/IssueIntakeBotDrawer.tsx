"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Bot,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  MapPin,
  Tag,
  ShieldAlert,
  Wrench,
  Zap,
  Building2,
  Calendar,
  ChevronRight,
  Check,
  RotateCcw,
  Eye,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { createIssue, fetchIssues, IssueItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface IssueIntakeBotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated?: (newIssue: IssueItem) => void;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  quickReplies?: Array<{ label: string; value: string; icon?: string }>;
  duplicateMatch?: IssueItem;
}

const CATEGORIES = [
  { label: "Plumbing & Water", value: "Plumbing", icon: "🚿" },
  { label: "Electrical & Power", value: "Electrical", icon: "⚡" },
  { label: "Elevator / Lift", value: "Elevator", icon: "🛗" },
  { label: "Security & Gate", value: "Security", icon: "🛡️" },
  { label: "Common Area & Gym", value: "Common Area", icon: "🏢" },
  { label: "Cleanliness & Waste", value: "Cleanliness", icon: "🧹" },
  { label: "Noise & Nuisance", value: "Noise", icon: "🔊" },
];

const LOCATIONS = [
  { label: "Inside My Flat", value: "Flat Interior", icon: "🏠" },
  { label: "Floor Lobby / Corridor", value: "Floor Lobby", icon: "🚪" },
  { label: "Passenger Lift", value: "Passenger Lift", icon: "🛗" },
  { label: "Clubhouse / Gymnasium", value: "Clubhouse", icon: "🏊" },
  { label: "Basement Parking B1/B2", value: "Basement Parking", icon: "🚗" },
  { label: "Society Garden / Park", value: "Society Garden", icon: "🌳" },
];

const PRIORITIES = [
  { label: "Routine (Low)", value: "low", desc: "Within 48 hours", icon: "🟢" },
  { label: "Important (Medium)", value: "medium", desc: "Within 24 hours", icon: "🟡" },
  { label: "Urgent (High)", value: "high", desc: "Within 6 hours", icon: "🟠" },
  { label: "Emergency (Safety)", value: "emergency", desc: "Immediate Action", icon: "🚨" },
];

const TIME_SLOTS = [
  { label: "Immediate / ASAP", value: "Immediate / Emergency" },
  { label: "Today 4:00 PM – 7:00 PM", value: "Today Evening (4 PM - 7 PM)" },
  { label: "Tomorrow Morning 9 AM – 12 PM", value: "Tomorrow Morning (9 AM - 12 PM)" },
  { label: "Tomorrow Afternoon 1 PM – 4 PM", value: "Tomorrow Afternoon (1 PM - 4 PM)" },
  { label: "Weekend Slot", value: "Weekend (Saturday/Sunday)" },
];

export default function IssueIntakeBotDrawer({
  isOpen,
  onClose,
  onIssueCreated,
}: IssueIntakeBotDrawerProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Existing active society issues for duplicate detection
  const [existingIssues, setExistingIssues] = useState<IssueItem[]>([]);
  const [detectedDuplicate, setDetectedDuplicate] = useState<IssueItem | null>(null);

  // Collected Form State
  const [category, setCategory] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [preferredSlot, setPreferredSlot] = useState<string>("");
  const [inputText, setInputText] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createdIssue, setCreatedIssue] = useState<IssueItem | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, isOpen, detectedDuplicate]);

  // Load existing society issues on mount/open for real-time duplicate screening
  useEffect(() => {
    if (isOpen) {
      fetchIssues()
        .then((items) => setExistingIssues(items))
        .catch(() => {});
    }
  }, [isOpen]);

  // Reset & start conversation
  const resetConversation = () => {
    setStep(0);
    setCategory("");
    setLocation("");
    setPriority("medium");
    setTitle("");
    setDescription("");
    setPreferredSlot("");
    setInputText("");
    setCreatedIssue(null);
    setDetectedDuplicate(null);

    const userName = user?.full_name?.split(" ")[0] || "Resident";

    setMessages([
      {
        id: "msg-1",
        sender: "bot",
        text: `Namaste ${userName}! 🙏 I am the Tower 24 Resident Concierge Bot. I will help you log your maintenance request or society concern directly to the managing committee and verified technicians.`,
        timestamp: "Just now",
      },
      {
        id: "msg-2",
        sender: "bot",
        text: `To get started, which category best describes the issue you are experiencing?`,
        timestamp: "Just now",
        quickReplies: CATEGORIES,
      },
    ]);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      resetConversation();
    }
  }, [isOpen, user]);

  const addBotMessage = (text: string, quickReplies?: any[], duplicateMatch?: IssueItem) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          quickReplies,
          duplicateMatch,
        },
      ]);
    }, 500);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: "user",
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // ── Smart AI Duplicate Issue Scanner ──────────────────────────
  const checkDuplicateIssue = (cat: string, loc: string, descText: string): IssueItem | null => {
    if (!existingIssues || existingIssues.length === 0) return null;

    const queryKeywords = `${cat} ${loc} ${descText}`
      .toLowerCase()
      .split(/[\s,.-]+/)
      .filter((w) => w.length > 3);

    for (const item of existingIssues) {
      // Only match against active, un-closed tickets (open, assigned, in_progress)
      if (item.status === "resolved" || item.status === "closed") continue;

      const itemText = `${item.category} ${item.location} ${item.title} ${item.description}`.toLowerCase();

      // Check common area match (Lift, Clubhouse, Gym, Corridor)
      const isCommonArea =
        loc.toLowerCase().includes("lift") ||
        loc.toLowerCase().includes("clubhouse") ||
        loc.toLowerCase().includes("lobby") ||
        loc.toLowerCase().includes("parking") ||
        loc.toLowerCase().includes("garden");

      if (isCommonArea && item.location.toLowerCase().includes(loc.toLowerCase().slice(0, 5))) {
        return item;
      }

      // Check keyword overlap (e.g. lift sensor, master bathroom water, corridor light)
      const matchingCount = queryKeywords.filter((kw) => itemText.includes(kw)).length;
      if (matchingCount >= 2) {
        return item;
      }
    }

    return null;
  };

  const handleSelectCategory = (catVal: string, catLabel: string) => {
    setCategory(catVal);
    addUserMessage(`${catLabel}`);
    setStep(1);

    addBotMessage(
      `Understood, **${catVal}**. Where is this issue located in Tower 24?`,
      LOCATIONS
    );
  };

  const handleSelectLocation = (locVal: string, locLabel: string) => {
    const finalLocation = locVal === "Flat Interior" && user?.flat_number ? `Flat ${user.flat_number}` : locVal;
    setLocation(finalLocation);
    addUserMessage(`${locLabel}`);

    // Check for common area duplicate (e.g. Lift, Gym, Parking)
    const duplicate = checkDuplicateIssue(category, finalLocation, "");
    if (duplicate) {
      setDetectedDuplicate(duplicate);
      addBotMessage(
        `💡 **Active Ticket Found for this Area!**\n\nA similar issue is already registered under **#${duplicate.ticket_number}** (*${duplicate.title}*) with status **${duplicate.status.toUpperCase()}** (Assigned to: **${duplicate.assigned_vendor_name || "Managing Committee"}**).`,
        undefined,
        duplicate
      );
      return;
    }

    setStep(2);
    addBotMessage(
      `Got it, at **${finalLocation}**. What is the urgency / priority level of this issue?`,
      PRIORITIES
    );
  };

  const handleSelectPriority = (priVal: string, priLabel: string) => {
    setPriority(priVal);
    addUserMessage(`${priLabel}`);
    setStep(3);

    addBotMessage(
      `Priority noted as **${priVal.toUpperCase()}**. Please describe the issue in detail (e.g. *Water leaking from kitchen sink pipe since morning*). Type your message below:`
    );
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");

    if (step === 3) {
      setDescription(text);
      const generatedTitle = text.length > 55 ? `${text.slice(0, 52)}...` : text;
      setTitle(generatedTitle);
      addUserMessage(text);

      // Deep duplicate check on description text
      const duplicate = checkDuplicateIssue(category, location, text);
      if (duplicate) {
        setDetectedDuplicate(duplicate);
        addBotMessage(
          `💡 **Wait, a matching issue is already in progress!**\n\nTicket **#${duplicate.ticket_number}** (*${duplicate.title}*) is currently **${duplicate.status.toUpperCase()}** and assigned to **${duplicate.assigned_vendor_name || "Committee Team"}**.`,
          undefined,
          duplicate
        );
        return;
      }

      setStep(4);
      addBotMessage(
        `Thank you for providing the details! When is your preferred time slot for technician inspection or maintenance access?`,
        TIME_SLOTS
      );
    } else if (step === 4) {
      setPreferredSlot(text);
      addUserMessage(text);
      setStep(5);
      showSummary(text);
    } else if (step === 5) {
      addUserMessage(text);
      addBotMessage("Please click the 'Confirm & Log Ticket' button above to register your official ticket with the managing committee.");
    }
  };

  const handleSelectSlot = (slotVal: string) => {
    setPreferredSlot(slotVal);
    addUserMessage(`Preferred slot: ${slotVal}`);
    setStep(5);
    showSummary(slotVal);
  };

  const showSummary = (slotVal: string) => {
    addBotMessage(
      `Great! Here is a summary of your ticket request. Please review and click **Confirm & Log Ticket** to broadcast to the committee.`
    );
  };

  const handleRedirectToExistingTicket = (ticket: IssueItem) => {
    onClose();
    router.push(`/issues?search=${encodeURIComponent(ticket.ticket_number)}`);
  };

  const handleBypassDuplicate = () => {
    setDetectedDuplicate(null);
    addUserMessage("This is a separate / distinct issue. Proceed with logging.");
    setStep(4);
    addBotMessage(
      `Understood! Proceeding with your new request. When is your preferred time slot for technician inspection?`,
      TIME_SLOTS
    );
  };

  const handleConfirmAndSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        title: title || `${category} issue at ${location}`,
        description: description || "No detailed remarks provided",
        category: category || "General",
        priority: priority || "medium",
        location: location || (user?.flat_number ? `Flat ${user.flat_number}` : "Flat Interior"),
        preferred_slot: preferredSlot || "Anytime",
        flat_number: user?.flat_number || "B-201",
        reported_by: user?.full_name || "Resident Member",
      };

      const newIssue = await createIssue(payload);
      setCreatedIssue(newIssue);
      if (onIssueCreated) {
        onIssueCreated(newIssue);
      }

      addBotMessage(
        `🎉 **Ticket #${newIssue.ticket_number} Registered Successfully!**\n\nThe managing committee and verified service team have been notified. You can track live updates in the Issues Helpdesk.`
      );
    } catch (err: any) {
      addBotMessage(`⚠️ Failed to log ticket: ${err.message || "Please check connection and try again."}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Frosted Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-in Right Drawer Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] md:w-[520px] bg-white/95 dark:bg-[#151210]/95 backdrop-blur-2xl border-l border-stone-200/90 dark:border-[#383028] shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>ResidentBot Concierge</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
              </div>
              <p className="text-[11px] text-stone-300">
                Interactive Issue Intake & Smart Triage • Tower 24
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={resetConversation}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all"
              title="Close Right Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/50 dark:bg-[#120f0d]/50">
          {messages.map((m) => {
            const isBot = m.sender === "bot";

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[88%] ${
                  isBot ? "self-start mr-auto" : "self-end ml-auto flex-row-reverse"
                }`}
              >
                {isBot ? (
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 dark:bg-amber-500/30 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}

                <div className="space-y-2.5">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isBot
                        ? "bg-white dark:bg-[#1d1814] text-stone-800 dark:text-stone-200 border border-stone-200/80 dark:border-[#383028] shadow-xs"
                        : "bg-orange-600 text-white font-medium shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {/* 💡 Rich Existing Duplicate Ticket Card */}
                    {m.duplicateMatch && (
                      <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-[#251e18] border border-amber-300 dark:border-amber-900/80 text-stone-900 dark:text-stone-100 space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-extrabold text-[11px] text-amber-800 dark:text-amber-400">
                            #{m.duplicateMatch.ticket_number}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase bg-amber-200/80 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                            {m.duplicateMatch.status.replace("_", " ")}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-xs text-stone-900 dark:text-white">
                            {m.duplicateMatch.title}
                          </h4>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5">
                            📍 {m.duplicateMatch.location} • Assigned to:{" "}
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {m.duplicateMatch.assigned_vendor_name || "Managing Committee"}
                            </span>
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <button
                            onClick={() => handleRedirectToExistingTicket(m.duplicateMatch!)}
                            className="btn-primary flex-1 py-1.5 px-3 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View & Track Ticket</span>
                          </button>
                          <button
                            onClick={handleBypassDuplicate}
                            className="btn-secondary flex-1 py-1.5 px-3 text-[11px] font-bold"
                          >
                            Still Log New Issue
                          </button>
                        </div>
                      </div>
                    )}

                    <span
                      className={`text-[9px] font-mono block mt-1.5 ${
                        isBot ? "text-stone-400" : "text-orange-200 text-right"
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {/* Interactive Quick-Reply Chips */}
                  {isBot && m.quickReplies && m.quickReplies.length > 0 && !createdIssue && !detectedDuplicate && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.quickReplies.map((reply, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (step === 0) handleSelectCategory(reply.value, reply.label);
                            else if (step === 1) handleSelectLocation(reply.value, reply.label);
                            else if (step === 2) handleSelectPriority(reply.value, reply.label);
                            else if (step === 4) handleSelectSlot(reply.value);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#201a16] hover:bg-amber-50 dark:hover:bg-[#2a221c] border border-stone-200 dark:border-[#3d332b] hover:border-amber-400 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                        >
                          {reply.icon && <span>{reply.icon}</span>}
                          <span>{reply.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2.5 max-w-[85%] self-start">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white dark:bg-[#1d1814] rounded-2xl border border-stone-200 dark:border-[#383028] shadow-xs flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          {/* Summary Confirmation Card */}
          {step === 5 && !createdIssue && !detectedDuplicate && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1c1714] border border-amber-300 dark:border-amber-800 shadow-md space-y-3 mt-3">
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-[#332a22] pb-2">
                <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" />
                  Ticket Summary Preview
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold uppercase">
                  {priority} Priority
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 font-mono block">CATEGORY</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 font-mono block">LOCATION</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{location}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-stone-400 font-mono block">ISSUE DESCRIPTION</span>
                  <span className="font-medium text-stone-700 dark:text-stone-300">{description}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-stone-400 font-mono block">PREFERRED INSPECTION SLOT</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{preferredSlot || "Anytime"}</span>
                </div>
              </div>

              <button
                onClick={handleConfirmAndSubmit}
                disabled={submitting}
                className="btn-primary w-full py-2.5 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{submitting ? "Registering Ticket..." : "Confirm & Log Issue Ticket"}</span>
              </button>
            </div>
          )}

          {/* Success Card */}
          {createdIssue && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 space-y-2.5 mt-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-xs">Ticket #{createdIssue.ticket_number} Logged!</h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Status: <span className="font-bold uppercase font-mono">{createdIssue.status}</span>
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Link
                  href="/issues"
                  onClick={onClose}
                  className="btn-primary flex-1 py-2 text-xs text-center flex items-center justify-center gap-1"
                >
                  <span>Track in Helpdesk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={resetConversation}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  Log Another Issue
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendText}
          className="p-3 bg-white dark:bg-[#151210] border-t border-stone-200 dark:border-[#383028] flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              step === 3
                ? "Type detailed issue description..."
                : step === 4
                ? "Type specific timing or select slot above..."
                : "Type message or select an option..."
            }
            disabled={createdIssue !== null || detectedDuplicate !== null}
            className="form-input flex-1 text-xs py-2"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || createdIssue !== null || detectedDuplicate !== null}
            className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white transition-all shadow-xs shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
}
