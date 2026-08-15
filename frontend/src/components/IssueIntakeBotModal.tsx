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
} from "lucide-react";
import { createIssue, IssueItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface IssueIntakeBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: (newIssue: IssueItem) => void;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
  quickReplies?: Array<{ label: string; value: string; icon?: string }>;
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

export default function IssueIntakeBotModal({
  isOpen,
  onClose,
  onIssueCreated,
}: IssueIntakeBotModalProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);

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
    scrollToBottom();
  }, [messages, isTyping]);

  // Initialize bot conversation on modal open
  useEffect(() => {
    if (!isOpen) return;

    setStep(0);
    setCategory("");
    setLocation("");
    setPriority("medium");
    setTitle("");
    setDescription("");
    setPreferredSlot("");
    setInputText("");
    setCreatedIssue(null);

    const userName = user?.full_name?.split(" ")[0] || "Resident";
    const userFlat = user?.flat_number || "B-201";

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
  }, [isOpen, user]);

  const addBotMessage = (text: string, quickReplies?: any[]) => {
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
        },
      ]);
    }, 600);
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
      `Priority noted as **${priVal.toUpperCase()}**. Please describe the issue in detail (e.g. *Water leaking from kitchen sink pipe since morning*). Type your message below:`
    );
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText("");

    if (step === 3) {
      // User entered the issue description
      setDescription(text);
      // Auto-generate concise title from description
      const generatedTitle = text.length > 55 ? `${text.slice(0, 52)}...` : text;
      setTitle(generatedTitle);
      addUserMessage(text);
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
      // General chat fallback
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
      onIssueCreated(newIssue);

      addBotMessage(
        `🎉 **Ticket #${newIssue.ticket_number} Registered Successfully!**\n\nThe managing committee and verified service team have been notified. You can track live updates in the Issues Helpdesk.`
      );
    } catch (err: any) {
      addBotMessage(`⚠️ Failed to log ticket: ${err.message || "Please check connection and try again."}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content max-w-xl p-0 bg-white dark:bg-[#151210] border border-stone-200 dark:border-[#383028] shadow-2xl rounded-3xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
                Interactive Maintenance & Helpdesk Intake • Tower 24
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
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
                    <span
                      className={`text-[9px] font-mono block mt-1.5 ${
                        isBot ? "text-stone-400" : "text-orange-200 text-right"
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {/* Interactive Quick-Reply Chips for Bot messages */}
                  {isBot && m.quickReplies && m.quickReplies.length > 0 && !createdIssue && (
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

          {/* Summary Confirmation Card (When all steps complete) */}
          {step === 5 && !createdIssue && (
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

          {/* Success Card when Issue Created */}
          {createdIssue && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 space-y-2 mt-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-xs">Ticket #{createdIssue.ticket_number} Logged!</h4>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Status: <span className="font-bold uppercase font-mono">{createdIssue.status}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="btn-primary w-full py-2 text-xs mt-2"
              >
                View in Issues Helpdesk
              </button>
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
            disabled={createdIssue !== null}
            className="form-input flex-1 text-xs py-2"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || createdIssue !== null}
            className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white transition-all shadow-xs shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
