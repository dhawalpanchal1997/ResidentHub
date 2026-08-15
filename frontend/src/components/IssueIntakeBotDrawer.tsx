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
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import {
  createIssue,
  fetchIssues,
  verifyIssueDuplicate,
  IssueItem,
  IssueDuplicateVerificationResult,
} from "@/lib/api";
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
  duplicateMatch?: IssueDuplicateVerificationResult | null;
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
  const [isCheckingAi, setIsCheckingAi] = useState<boolean>(false);

  // AI Duplicate Verification state
  const [detectedDuplicate, setDetectedDuplicate] = useState<IssueDuplicateVerificationResult | null>(null);
  const [clarificationReason, setClarificationReason] = useState<string>("");

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
  }, [messages, isTyping, isOpen, detectedDuplicate, isCheckingAi]);

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
    setClarificationReason("");
    setIsCheckingAi(false);

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

  const addBotMessage = (
    text: string,
    quickReplies?: any[],
    duplicateMatch?: IssueDuplicateVerificationResult | null
  ) => {
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
    }, 450);
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
      `Priority noted as **${priVal.toUpperCase()}**. Please describe the issue in detail (e.g. *Passenger Lift A door stuck on 4th floor* or *Kitchen sink pipe leaking*). Type your message below:`
    );
  };

  // ── AI Duplicate Verification Check ────────────────────────────
  const runAiDuplicateVerification = async (text: string) => {
    setIsCheckingAi(true);
    try {
      const generatedTitle = text.length > 55 ? `${text.slice(0, 52)}...` : text;
      setTitle(generatedTitle);
      setDescription(text);

      const verificationResult = await verifyIssueDuplicate({
        title: generatedTitle,
        description: text,
        category,
        location,
        flat_number: user?.flat_number || "B-201",
      });

      setIsCheckingAi(false);

      if (verificationResult.is_duplicate && verificationResult.matched_ticket_number) {
        setDetectedDuplicate(verificationResult);
        addBotMessage(
          `🤖 **AI Duplicate Verification Alert**\n\n${verificationResult.reasoning}\n\n**${verificationResult.clarification_question || "Are you referring to this active ticket?"}**`,
          undefined,
          verificationResult
        );
        return;
      }

      // No duplicate detected, proceed to time slot
      setStep(4);
      addBotMessage(
        `Thank you for the description! When is your preferred time slot for technician inspection or maintenance access?`,
        TIME_SLOTS
      );
    } catch (err) {
      setIsCheckingAi(false);
      setStep(4);
      addBotMessage(
        `Thank you! When is your preferred time slot for technician inspection?`,
        TIME_SLOTS
      );
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");

    if (detectedDuplicate) {
      // User is providing clarification why it is NOT a duplicate
      setClarificationReason(text);
      addUserMessage(`Clarification: ${text}`);
      setDetectedDuplicate(null);
      setStep(4);
      addBotMessage(
        `Got your clarification: *"${text}"*.\n\nProceeding to register this as a separate ticket. When is your preferred time slot for technician inspection?`,
        TIME_SLOTS
      );
      return;
    }

    if (step === 3) {
      addUserMessage(text);
      await runAiDuplicateVerification(text);
    } else if (step === 4) {
      setPreferredSlot(text);
      addUserMessage(text);
      setStep(5);
      showSummary();
    } else if (step === 5) {
      addUserMessage(text);
      addBotMessage("Please click the 'Confirm & Log Ticket' button above to register your official ticket with the managing committee.");
    }
  };

  const handleSelectSlot = (slotVal: string) => {
    setPreferredSlot(slotVal);
    addUserMessage(`Preferred slot: ${slotVal}`);
    setStep(5);
    showSummary();
  };

  const showSummary = () => {
    addBotMessage(
      `Great! Here is a summary of your ticket request. Please review and click **Confirm & Log Ticket** to broadcast to the committee.`
    );
  };

  const handleRedirectToExistingTicket = (ticketNumber: string) => {
    onClose();
    router.push(`/issues?search=${encodeURIComponent(ticketNumber)}`);
  };

  const handleBypassDuplicate = () => {
    setDetectedDuplicate(null);
    addUserMessage("No, this is a separate / different issue.");
    setStep(4);
    addBotMessage(
      `Understood! Proceeding with your new request. When is your preferred time slot for technician inspection?`,
      TIME_SLOTS
    );
  };

  const handleConfirmAndSubmit = async () => {
    setSubmitting(true);
    try {
      const finalDesc = clarificationReason
        ? `${description}\n\n[Resident Clarification / Separate Issue Note]: ${clarificationReason}`
        : description;

      const payload = {
        title: title || `${category} issue at ${location}`,
        description: finalDesc || "No detailed remarks provided",
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
                AI Issue Intake & Smart Deduplication • Tower 24
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

                    {/* 🤖 LangChain / LangGraph AI Duplicate Verification & Clarification Card */}
                    {m.duplicateMatch && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-[#251e18] border-2 border-amber-400/90 dark:border-amber-700/80 text-stone-900 dark:text-stone-100 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-amber-200 dark:border-amber-900/60 pb-2">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="font-mono font-extrabold text-[11px] text-amber-900 dark:text-amber-300 uppercase">
                              #{m.duplicateMatch.matched_ticket_number}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold font-mono uppercase bg-amber-200/80 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {m.duplicateMatch.matched_status?.replace("_", " ") || "ACTIVE"}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-extrabold text-xs text-stone-900 dark:text-white">
                            {m.duplicateMatch.matched_title}
                          </h4>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-600" />
                            <span>Location: {m.duplicateMatch.matched_location}</span>
                            {m.duplicateMatch.is_common_facility && (
                              <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-mono text-[9px]">
                                Common Facility
                              </span>
                            )}
                          </p>
                        </div>

                        {/* Interactive Clarification Actions */}
                        <div className="space-y-2 pt-1 border-t border-amber-200 dark:border-amber-900/60">
                          <button
                            type="button"
                            onClick={() => handleRedirectToExistingTicket(m.duplicateMatch!.matched_ticket_number!)}
                            className="btn-primary w-full py-2 px-3 text-xs font-extrabold flex items-center justify-center gap-2 shadow-xs bg-amber-600 hover:bg-amber-700 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Yes, this is the same issue (View Ticket)</span>
                          </button>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={handleBypassDuplicate}
                              className="btn-secondary flex-1 py-2 px-3 text-[11px] font-bold border-amber-300 dark:border-amber-800 text-stone-800 dark:text-stone-200"
                            >
                              No, this is separate / different
                            </button>
                          </div>

                          <p className="text-[10px] text-stone-500 dark:text-stone-400 text-center italic">
                            💡 You can also type below to explain how your problem is different.
                          </p>
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

          {/* AI Checking & Typing Indicator */}
          {(isTyping || isCheckingAi) && (
            <div className="flex gap-2.5 max-w-[85%] self-start">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-white dark:bg-[#1d1814] rounded-2xl border border-stone-200 dark:border-[#383028] shadow-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                {isCheckingAi && (
                  <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold ml-1">
                    AI screening duplicate tickets...
                  </span>
                )}
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
                  {clarificationReason && (
                    <span className="text-[10px] text-amber-800 dark:text-amber-300 block mt-1 font-mono font-bold">
                      💡 Clarification: {clarificationReason}
                    </span>
                  )}
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
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-3 mt-4 animate-scale-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                  Official Ticket Generated
                </span>
                <h4 className="text-base font-black text-stone-900 dark:text-white font-mono mt-0.5">
                  #{createdIssue.ticket_number}
                </h4>
                <p className="text-xs text-stone-600 dark:text-stone-300 mt-1">
                  &ldquo;{createdIssue.title}&rdquo;
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push(`/issues?search=${encodeURIComponent(createdIssue.ticket_number)}`);
                  }}
                  className="btn-primary flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View in Helpdesk</span>
                </button>
                <button
                  type="button"
                  onClick={resetConversation}
                  className="btn-secondary flex-1 py-2 text-xs font-bold"
                >
                  Report Another Issue
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Drawer Bottom Chat Input */}
        {!createdIssue && (
          <form
            onSubmit={handleSendText}
            className="p-3 bg-white dark:bg-[#181411] border-t border-stone-200 dark:border-[#383028] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                detectedDuplicate
                  ? "Explain why this is a separate issue or click button..."
                  : step === 3
                  ? "Describe your maintenance issue..."
                  : step === 4
                  ? "Type your preferred inspection slot..."
                  : "Type your message or click an option above..."
              }
              className="form-input text-xs py-2.5 flex-1 bg-stone-50 dark:bg-[#120f0d] border-stone-200 dark:border-[#383028]"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isCheckingAi}
              className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40 transition-all shadow-sm shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </>
  );
}
