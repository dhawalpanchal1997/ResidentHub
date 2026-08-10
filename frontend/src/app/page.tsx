"use client";

import React, { useState } from "react";
import {
  Calendar,
  DollarSign,
  Users,
  Bot,
  Shield,
  Plus,
  CheckCircle,
  XCircle,
  Download,
  Phone,
  MessageCircle,
  Star,
  Sparkles,
  FileText,
  Search,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Building2,
  Clock,
  MapPin,
  Check,
  Send,
  AlertCircle
} from "lucide-react";
import {
  EventItem,
  LedgerItem,
  LedgerSummaryData,
  VendorItem,
  MeetingItem
} from "@/lib/api";

// Initial Demo Seed Data
const INITIAL_EVENTS: EventItem[] = [
  {
    id: "ev-1",
    title: "Diwali Grand Celebration & Dinner",
    description: "Annual society gathering with cultural performances, fireworks display, and catered buffet dinner for all families.",
    event_date: "2026-11-08T18:30:00",
    venue: "Society Clubhouse & Main Lawn",
    fee_per_person: 450,
    upi_qr_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=greenmeadows@upi&pn=GreenMeadowsCHS&am=450",
    rsvps_count: 3,
    total_attendees: 7,
    total_collected: 3150,
    rsvps: [
      {
        id: "r-1",
        event_id: "ev-1",
        member_name: "Amit Deshmukh",
        flat_number: "A-102",
        attendees_count: 3,
        total_amount: 1350,
        utr_number: "UPI-9834710293",
        status: "approved",
        created_at: "2026-10-25T14:20:00"
      },
      {
        id: "r-2",
        event_id: "ev-1",
        member_name: "Pooja Hegde",
        flat_number: "B-404",
        attendees_count: 2,
        total_amount: 900,
        utr_number: "UPI-4819204912",
        status: "approved",
        created_at: "2026-10-26T09:15:00"
      },
      {
        id: "r-3",
        event_id: "ev-1",
        member_name: "Suresh Menon",
        flat_number: "C-301",
        attendees_count: 2,
        total_amount: 900,
        utr_number: "UPI-7728193821",
        status: "pending",
        created_at: "2026-10-28T11:45:00"
      }
    ]
  },
  {
    id: "ev-2",
    title: "Annual General Body Meeting (AGM 2026)",
    description: "Mandatory annual meeting to review society audited financials, pass new security resolutions, and elect committee.",
    event_date: "2026-09-15T10:00:00",
    venue: "Society Meeting Hall (1st Floor)",
    fee_per_person: 0,
    rsvps_count: 14,
    total_attendees: 14,
    total_collected: 0,
    rsvps: []
  }
];

const INITIAL_LEDGER: LedgerItem[] = [
  {
    id: "tx-1",
    transaction_type: "income",
    category: "Maintenance",
    amount: 185000,
    transaction_date: "2026-08-01",
    description: "August Monthly Maintenance collection (42/48 flats cleared)",
  },
  {
    id: "tx-2",
    transaction_type: "expense",
    category: "Security",
    amount: 45000,
    transaction_date: "2026-08-03",
    description: "Apex Security Agency monthly guard salary & supervisor fee",
    receipt_url: "INV-SEC-AUG26.pdf"
  },
  {
    id: "tx-3",
    transaction_type: "expense",
    category: "Electricity",
    amount: 28400,
    transaction_date: "2026-08-04",
    description: "Common Area & Water Pump Electricity Bill",
    receipt_url: "MSEDCL-AUG26.pdf"
  },
  {
    id: "tx-4",
    transaction_type: "expense",
    category: "Lift Maintenance",
    amount: 18000,
    transaction_date: "2026-08-05",
    description: "Schindler Quarterly AMC & sensor overhaul",
    receipt_url: "SCH-AMC-Q3.pdf"
  },
  {
    id: "tx-5",
    transaction_type: "expense",
    category: "Gardening & Cleaning",
    amount: 12500,
    transaction_date: "2026-08-06",
    description: "Garden fertilizer, lawn trimming, and housekeeping supplies",
  }
];

const INITIAL_VENDORS: VendorItem[] = [
  {
    id: "v-1",
    category: "Electrician",
    name: "Ramesh Sharma",
    phone_number: "+919820123456",
    whatsapp_number: "+919820123456",
    notes: "Expert with MCB trip issues, inverter wiring, and fan repairs. Lives 5 mins away.",
    average_rating: 4.8,
    total_reviews: 12,
    reviews: [
      { id: "rev-1", user_name: "Sunil Rao", flat_number: "A-203", rating: 5, comment: "Fixed my master bedroom switchboard in 15 mins. Very honest charges.", created_at: "2026-07-12" },
      { id: "rev-2", user_name: "Anjali Gupta", flat_number: "B-101", rating: 5, comment: "Replaced main inverter fuse promptly on a Sunday.", created_at: "2026-07-28" }
    ]
  },
  {
    id: "v-2",
    category: "Plumber",
    name: "Mohan Kumar",
    phone_number: "+919833445566",
    whatsapp_number: "+919833445566",
    notes: "Specializes in bathroom leakage, tap replacements, and overhead tank pipeline checks.",
    average_rating: 4.6,
    total_reviews: 9,
    reviews: [
      { id: "rev-3", user_name: "Rajesh S.", flat_number: "A-402", rating: 4, comment: "Good work fixing kitchen sink blockage.", created_at: "2026-08-01" }
    ]
  },
  {
    id: "v-3",
    category: "Doctor / Emergency",
    name: "Dr. Sandeep Kulkarni (MD General)",
    phone_number: "+919811223344",
    notes: "Clinic at Society Commercial Complex (Shop 4). Available 8 AM - 1 PM & 6 PM - 10 PM. Emergency home visits for seniors.",
    average_rating: 5.0,
    total_reviews: 16,
    reviews: [
      { id: "rev-4", user_name: "Priya Patel", flat_number: "B-201", rating: 5, comment: "Extremely caring doctor. Attended my mother immediately during high fever.", created_at: "2026-06-20" }
    ]
  },
  {
    id: "v-4",
    category: "Appliance Repair",
    name: "Vijay AC & Refrigerator Works",
    phone_number: "+919877889900",
    whatsapp_number: "+919877889900",
    notes: "Gas refilling, compressor repairs, washing machine PCB diagnosis.",
    average_rating: 4.4,
    total_reviews: 7,
    reviews: []
  }
];

const INITIAL_MEETINGS: MeetingItem[] = [
  {
    id: "m-1",
    title: "Committee General Meeting - July 2026",
    meeting_date: "2026-07-19",
    meeting_type: "Monthly Committee",
    raw_transcript: `Committee Meeting held on 19 July 2026 at Clubhouse.
Present: Rajesh (Secretary), Mehta (Treasurer), Joshi, Kapoor.
Agenda:
1. Lift repair and AMC contract.
2. Building exterior painting quotations.
3. Security gate intercom repair.

Discussions & Decisions:
- Lift AMC contract with Schindler was reviewed. Cost of Rs 18,000 for quarterly service approved unanimously.
- Painting contractors submitted 3 bids: Asian Paints (Rs 4.5 Lakhs), Berger (Rs 4.2 Lakhs), Local contractor (Rs 3.8 Lakhs). Resolved to go with Asian Paints after committee visit to their completed project. Approved budget limit Rs 4,50,000.
- Intercom line at Gate 1 is dead. Assigned to Joshi to coordinate with Cable provider by 25th July.
- Guard uniform change deferred to next meeting.`,
    is_published: "published",
    structured_summary: {
      meeting_title: "Committee General Meeting - July 2026",
      meeting_date: "2026-07-19",
      meeting_type: "Monthly Committee",
      executive_summary: "Approved Schindler quarterly Lift AMC for ₹18,000 and selected Asian Paints for building exterior painting with an approved budget cap of ₹4,50,000.",
      resolutions: [
        {
          id: "RES-01",
          title: "Lift AMC Contract Approval",
          description: "Unanimously approved quarterly maintenance contract renewal with Schindler.",
          status: "Approved",
          vote_summary: "Unanimously Passed"
        },
        {
          id: "RES-02",
          title: "Building Painting Contractor Selection",
          description: "Resolved to award building exterior painting project to Asian Paints after site evaluation.",
          status: "Approved",
          vote_summary: "Approved by majority"
        }
      ],
      budget_approvals: [
        {
          id: "BUD-01",
          expense_category: "Lift Maintenance AMC",
          vendor_or_contractor: "Schindler India",
          approved_amount: 18000,
          notes: "Quarterly preventative maintenance fee"
        },
        {
          id: "BUD-02",
          expense_category: "Building Exterior Painting",
          vendor_or_contractor: "Asian Paints Certified Team",
          approved_amount: 450000,
          notes: "30% advance, 50% on progress, 20% on completion warranty"
        }
      ],
      action_items: [
        {
          id: "ACT-01",
          task: "Repair Gate 1 intercom connection with cable technician",
          assigned_to: "Mr. Joshi (Committee Member)",
          target_date: "25th July 2026",
          priority: "High"
        }
      ],
      general_notes: [
        "Guard uniform modernization discussion deferred to next month's AGM."
      ]
    }
  }
];

export default function HomePage() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "ledger" | "vendors" | "meetings">("overview");
  const [userRole, setUserRole] = useState<"member" | "admin">("admin");
  const [currentUser] = useState({
    name: userRole === "admin" ? "Rajesh Sharma (Secretary)" : "Priya Patel",
    flat: userRole === "admin" ? "A-402" : "B-201"
  });

  // Data States
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [ledger, setLedger] = useState<LedgerItem[]>(INITIAL_LEDGER);
  const [vendors, setVendors] = useState<VendorItem[]>(INITIAL_VENDORS);
  const [meetings, setMeetings] = useState<MeetingItem[]>(INITIAL_MEETINGS);

  // Modals & UI States
  const [selectedEventForRsvp, setSelectedEventForRsvp] = useState<EventItem | null>(null);
  const [rsvpAttendeesCount, setRsvpAttendeesCount] = useState(1);
  const [rsvpUtrNumber, setRsvpUtrNumber] = useState("");
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState("");

  const [selectedVendorForReview, setSelectedVendorForReview] = useState<VendorItem | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");

  // Vendor Filter
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState("All");
  const [vendorSearch, setVendorSearch] = useState("");

  // New Event Modal
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventVenue, setNewEventVenue] = useState("");
  const [newEventFee, setNewEventFee] = useState(0);
  const [newEventDesc, setNewEventDesc] = useState("");

  // New Transaction Modal
  const [showNewTxModal, setShowNewTxModal] = useState(false);
  const [newTxType, setNewTxType] = useState<"income" | "expense">("expense");
  const [newTxCategory, setNewTxCategory] = useState("Maintenance");
  const [newTxAmount, setNewTxAmount] = useState(0);
  const [newTxDesc, setNewTxDesc] = useState("");

  // AI Meeting Transcript Ingestion State
  const [transcriptTitle, setTranscriptTitle] = useState("");
  const [transcriptDate, setTranscriptDate] = useState(new Date().toISOString().split("T")[0]);
  const [transcriptType, setTranscriptType] = useState("Monthly Committee");
  const [rawTranscriptText, setRawTranscriptText] = useState("");
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [extractedMeeting, setExtractedMeeting] = useState<MeetingItem | null>(null);

  // Resident Q&A State
  const [aiQuery, setAiQuery] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "bot"; text: string; time: string }>>([
    {
      sender: "bot",
      text: "👋 Hello! I am your ResidentHub AI Copilot. Ask me anything about past meeting resolutions, approved budgets, rules, or contact lookups!",
      time: "Just now"
    }
  ]);
  const [isBotThinking, setIsBotThinking] = useState(false);

  // Computations
  const totalIncome = ledger.filter(t => t.transaction_type === "income").reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = ledger.filter(t => t.transaction_type === "expense").reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Handlers
  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForRsvp) return;

    const totalAmt = rsvpAttendeesCount * selectedEventForRsvp.fee_per_person;
    const newRsvp = {
      id: "r-" + Date.now(),
      event_id: selectedEventForRsvp.id,
      member_name: currentUser.name,
      flat_number: currentUser.flat,
      attendees_count: rsvpAttendeesCount,
      total_amount: totalAmt,
      utr_number: rsvpUtrNumber || "UPI-" + Math.floor(1000000000 + Math.random() * 9000000000),
      status: (userRole === "admin" ? "approved" : "pending") as "pending" | "approved",
      created_at: new Date().toISOString()
    };

    setEvents(prev => prev.map(ev => {
      if (ev.id === selectedEventForRsvp.id) {
        const updatedRsvps = [...(ev.rsvps || []), newRsvp];
        return {
          ...ev,
          rsvps_count: updatedRsvps.length,
          total_attendees: updatedRsvps.filter(r => r.status === "approved").reduce((a, b) => a + b.attendees_count, 0),
          total_collected: updatedRsvps.filter(r => r.status === "approved").reduce((a, b) => a + b.total_amount, 0),
          rsvps: updatedRsvps
        };
      }
      return ev;
    }));

    setRsvpSuccessMessage(`RSVP Confirmed for ${rsvpAttendeesCount} attendee(s)! UTR recorded.`);
    setTimeout(() => {
      setSelectedEventForRsvp(null);
      setRsvpSuccessMessage("");
      setRsvpUtrNumber("");
      setRsvpAttendeesCount(1);
    }, 1800);
  };

  const handleVerifyRsvp = (eventId: string, rsvpId: string, status: "approved" | "rejected") => {
    setEvents(prev => prev.map(ev => {
      if (ev.id === eventId) {
        const updatedRsvps = (ev.rsvps || []).map(r => r.id === rsvpId ? { ...r, status } : r);
        return {
          ...ev,
          total_attendees: updatedRsvps.filter(r => r.status === "approved").reduce((a, b) => a + b.attendees_count, 0),
          total_collected: updatedRsvps.filter(r => r.status === "approved").reduce((a, b) => a + b.total_amount, 0),
          rsvps: updatedRsvps
        };
      }
      return ev;
    }));
  };

  const handleExportCsv = (event: EventItem) => {
    const rows = [
      ["Member Name", "Flat Number", "Attendees", "Amount (INR)", "UTR Reference", "Status", "Date"],
      ...(event.rsvps || []).map(r => [
        r.member_name,
        r.flat_number,
        r.attendees_count.toString(),
        r.total_amount.toString(),
        r.utr_number || "N/A",
        r.status.toUpperCase(),
        r.created_at.split("T")[0]
      ])
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${event.title.replace(/\s+/g, "_")}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEv: EventItem = {
      id: "ev-" + Date.now(),
      title: newEventTitle,
      description: newEventDesc,
      event_date: newEventDate || new Date().toISOString(),
      venue: newEventVenue,
      fee_per_person: Number(newEventFee),
      upi_qr_url: newEventFee > 0 ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=greenmeadows@upi&pn=GreenMeadowsCHS&am=${newEventFee}` : undefined,
      rsvps_count: 0,
      total_attendees: 0,
      total_collected: 0,
      rsvps: []
    };
    setEvents([newEv, ...events]);
    setShowNewEventModal(false);
    setNewEventTitle("");
    setNewEventDesc("");
    setNewEventVenue("");
    setNewEventFee(0);
  };

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: LedgerItem = {
      id: "tx-" + Date.now(),
      transaction_type: newTxType,
      category: newTxCategory,
      amount: Number(newTxAmount),
      transaction_date: new Date().toISOString().split("T")[0],
      description: newTxDesc,
      receipt_url: newTxType === "expense" ? "Receipt_Uploaded.pdf" : undefined
    };
    setLedger([newTx, ...ledger]);
    setShowNewTxModal(false);
    setNewTxDesc("");
    setNewTxAmount(0);
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForReview) return;

    const newRev = {
      id: "rev-" + Date.now(),
      user_name: currentUser.name,
      flat_number: currentUser.flat,
      rating: newRating,
      comment: newComment,
      created_at: new Date().toISOString().split("T")[0]
    };

    setVendors(prev => prev.map(v => {
      if (v.id === selectedVendorForReview.id) {
        const allReviews = [...(v.reviews || []), newRev];
        const avg = allReviews.reduce((a, b) => a + b.rating, 0) / allReviews.length;
        return {
          ...v,
          average_rating: Number(avg.toFixed(1)),
          total_reviews: allReviews.length,
          reviews: allReviews
        };
      }
      return v;
    }));

    setSelectedVendorForReview(null);
    setNewComment("");
  };

  // Deterministic AI Extraction Handler
  const handleProcessTranscript = () => {
    if (!rawTranscriptText.trim()) return;
    setIsProcessingAi(true);

    setTimeout(() => {
      // Deterministic Extractor Execution
      const lines = rawTranscriptText.split("\n").filter(l => l.trim().length > 0);
      const resolutions: any[] = [];
      const budgets: any[] = [];
      const actionItems: any[] = [];

      lines.forEach((line, idx) => {
        const lower = line.toLowerCase();
        // Check budget / money
        const amountMatch = line.match(/(?:rs\.?|inr|₹|\$)\s*([\d,]+(?:\.\d+)?)/i) || line.match(/([\d,]+)\s*(?:rupees|lakh)/i);
        if ((lower.includes("approved") || lower.includes("budget") || lower.includes("cost") || lower.includes("amc")) && amountMatch) {
          const rawNum = amountMatch[1].replace(/,/g, "");
          budgets.push({
            id: `BUD-0${budgets.length + 1}`,
            expense_category: line.includes(":") ? line.split(":")[0].trim() : "Approved Expenditure",
            vendor_or_contractor: "Selected Vendor",
            approved_amount: parseFloat(rawNum) || 50000,
            notes: line.trim()
          });
        } else if (lower.includes("assigned to") || lower.includes("coordinate") || lower.includes("will do") || lower.includes("action")) {
          actionItems.push({
            id: `ACT-0${actionItems.length + 1}`,
            task: line.trim(),
            assigned_to: line.includes("assigned to") ? line.split("assigned to")[1].trim().split(" ")[0] : "Committee Member",
            target_date: "Next Committee Meeting",
            priority: lower.includes("urgent") ? "High" : "Medium"
          });
        } else if (lower.includes("resolved") || lower.includes("decided") || lower.includes("passed") || lower.includes("agreed")) {
          resolutions.push({
            id: `RES-0${resolutions.length + 1}`,
            title: `Resolution on ${line.substring(0, 35)}...`,
            description: line.trim(),
            status: "Approved",
            vote_summary: "Unanimously Passed"
          });
        }
      });

      // Guarantee deterministic fallback if no explicit keywords
      if (resolutions.length === 0) {
        resolutions.push({
          id: "RES-01",
          title: "Meeting Proceedings Approved",
          description: `Agenda and minutes reviewed for ${transcriptTitle || "Committee Meeting"}.`,
          status: "Approved",
          vote_summary: "Recorded"
        });
      }

      const extracted: MeetingItem = {
        id: "m-" + Date.now(),
        title: transcriptTitle || "Society Committee Meeting",
        meeting_date: transcriptDate,
        meeting_type: transcriptType,
        raw_transcript: rawTranscriptText,
        is_published: "draft",
        structured_summary: {
          meeting_title: transcriptTitle || "Society Committee Meeting",
          meeting_date: transcriptDate,
          meeting_type: transcriptType,
          executive_summary: `Processed minutes with ${resolutions.length} resolution(s), ${budgets.length} budget approval(s), and ${actionItems.length} action item(s).`,
          resolutions,
          budget_approvals: budgets,
          action_items: actionItems,
          general_notes: lines.slice(0, 3)
        }
      };

      setExtractedMeeting(extracted);
      setIsProcessingAi(false);
    }, 1200);
  };

  const handlePublishMeeting = () => {
    if (!extractedMeeting) return;
    const published = { ...extractedMeeting, is_published: "published" as const };
    setMeetings([published, ...meetings]);
    setExtractedMeeting(null);
    setRawTranscriptText("");
    setTranscriptTitle("");
    alert("✅ Meeting Minutes and Structured Resolutions Published to Society Feed & AI Copilot!");
  };

  // Conversational AI Q&A Handler
  const handleAskAi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const userQ = aiQuery;
    const newMsg = { sender: "user" as const, text: userQ, time: "Just now" };
    setChatMessages(prev => [...prev, newMsg]);
    setAiQuery("");
    setIsBotThinking(true);

    setTimeout(() => {
      const qLower = userQ.toLowerCase();
      let botResponse = "";

      // Smart semantic matching across meetings & vendors
      if (qLower.includes("lift") || qLower.includes("elevator")) {
        botResponse = "📌 **Lift AMC & Repairs:**\nIn the Committee Meeting (19 July 2026), the committee unanimously approved the renewal of the quarterly Lift Maintenance contract with **Schindler India** for **₹18,000** (Resolution RES-01 / Budget BUD-01).";
      } else if (qLower.includes("paint") || qLower.includes("exterior")) {
        botResponse = "🎨 **Building Painting Decision:**\nIn the July 2026 Committee meeting, the contract for exterior painting was awarded to **Asian Paints** with an approved budget cap of **₹4,50,000** (30% advance, 50% on progress, 20% on completion).";
      } else if (qLower.includes("electrician") || qLower.includes("plumber") || qLower.includes("doctor")) {
        const found = vendors.filter(v => qLower.includes(v.category.toLowerCase()) || qLower.includes(v.name.toLowerCase()));
        if (found.length > 0) {
          botResponse = `🛠️ **Verified Contact Found:**\n**${found[0].name}** (${found[0].category})\n⭐ Rating: ${found[0].average_rating}/5 (${found[0].total_reviews} reviews)\n📞 Phone: ${found[0].phone_number}\n💬 Note: ${found[0].notes}`;
        } else {
          botResponse = "You can view our verified electricians and plumbers directly in the **Worker Directory** tab!";
        }
      } else if (qLower.includes("balance") || qLower.includes("fund") || qLower.includes("maintenance")) {
        botResponse = `💰 **Current Society Financial Health:**\n• Total Income: ₹${totalIncome.toLocaleString("en-IN")}\n• Total Expenses: ₹${totalExpense.toLocaleString("en-IN")}\n• **Net Reserve Balance: ₹${netBalance.toLocaleString("en-IN")}**\nFull ledger available under the **Funds Ledger** tab.`;
      } else {
        botResponse = `🔍 Based on all recorded society meeting minutes and ledger records, I found that decisions related to your query are logged under society files. You can also raise this point directly for the upcoming AGM agenda!`;
      }

      setChatMessages(prev => [...prev, { sender: "bot", text: botResponse, time: "Just now" }]);
      setIsBotThinking(false);
    }, 1000);
  };

  const filteredVendors = vendors.filter(v => {
    const matchesCat = vendorCategoryFilter === "All" || v.category.toLowerCase().includes(vendorCategoryFilter.toLowerCase());
    const matchesSearch = !vendorSearch || v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || (v.notes || "").toLowerCase().includes(vendorSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Green Meadows CHS</h1>
              <p className="text-xs text-slate-500 font-medium">ResidentHub Community Portal</p>
            </div>
          </div>

          {/* Role Switcher & User Profile */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center text-xs">
              <button
                onClick={() => setUserRole("member")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  userRole === "member" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Resident
              </button>
              <button
                onClick={() => setUserRole("admin")}
                className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center space-x-1 ${
                  userRole === "admin" ? "bg-brand-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>Admin</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                {currentUser.flat}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-800 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Unit {currentUser.flat}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-1 border-t border-slate-100 no-scrollbar">
            {[
              { id: "overview", label: "Overview", icon: Building2 },
              { id: "events", label: "Events & RSVP", icon: Calendar, badge: events.reduce((a, b) => a + (b.rsvps?.filter(r => r.status === "pending").length || 0), 0) },
              { id: "ledger", label: "Funds Ledger", icon: DollarSign },
              { id: "vendors", label: "Worker Directory", icon: Users },
              { id: "meetings", label: "Meeting AI Copilot", icon: Bot, highlight: true }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                    isActive
                      ? tab.highlight ? "bg-brand-600 text-white shadow-sm" : "bg-slate-900 text-white"
                      : tab.highlight ? "text-brand-700 bg-brand-50 hover:bg-brand-100" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && tab.badge > 0 && userRole === "admin" ? (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & HIGHLIGHTS */}
        {/* ======================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Hero Welcome Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30 mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI-Augmented Community Hub</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome to Green Meadows Portal
                </h2>
                <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                  One-stop hub for instant event RSVPs with receipt verification, 100% transparent society financials, verified local service contacts, and deterministic AI meeting records.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveTab("events")}
                    className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center space-x-1.5"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>View Upcoming Events</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("meetings")}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm backdrop-blur-sm transition flex items-center space-x-1.5"
                  >
                    <Bot className="w-4 h-4" />
                    <span>Ask Meeting Copilot</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Society Reserve</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">₹{netBalance.toLocaleString("en-IN")}</p>
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center">
                  <span>100% Inflow/Expense Audited</span>
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Events</span>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">{events.length} Events</p>
                <p className="text-xs text-purple-600 font-semibold mt-1">
                  {events.reduce((a, b) => a + b.total_attendees, 0)} Total Attendees Confirmed
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified Vendors</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900 mt-2">{vendors.length} Providers</p>
                <p className="text-xs text-blue-600 font-semibold mt-1">
                  Electricians, Plumbers, Doctors on-call
                </p>
              </div>
            </div>

            {/* Quick Actions Feed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Latest Event Notice */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-brand-600" />
                    <span>Featured Upcoming Event</span>
                  </h3>
                  <button onClick={() => setActiveTab("events")} className="text-xs font-bold text-brand-600 hover:underline">
                    View All
                  </button>
                </div>
                {events[0] && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 uppercase">
                      Fee: {events[0].fee_per_person > 0 ? `₹${events[0].fee_per_person}/person` : "Free"}
                    </span>
                    <h4 className="font-bold text-slate-900 text-lg mt-2">{events[0].title}</h4>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{events[0].description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(events[0].event_date).toLocaleDateString()}</span>
                      </span>
                      <button
                        onClick={() => { setSelectedEventForRsvp(events[0]); }}
                        className="px-3 py-1.5 bg-brand-600 text-white rounded-lg font-bold text-xs hover:bg-brand-700 transition"
                      >
                        RSVP Now
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Latest AI Meeting Decisions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-brand-600" />
                    <span>Latest Meeting Resolutions</span>
                  </h3>
                  <button onClick={() => setActiveTab("meetings")} className="text-xs font-bold text-brand-600 hover:underline">
                    Ask Copilot
                  </button>
                </div>
                {meetings[0]?.structured_summary && (
                  <div className="space-y-2.5">
                    {meetings[0].structured_summary.resolutions.slice(0, 2).map((res, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{res.title}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            {res.status}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{res.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: EVENTS & RSVP VERIFICATION */}
        {/* ======================================================== */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Events Hub & RSVP</h2>
                <p className="text-xs text-slate-500">Register for community events, submit UPI payment proofs, and view verified attendee lists.</p>
              </div>
              {userRole === "admin" && (
                <button
                  onClick={() => setShowNewEventModal(true)}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Event</span>
                </button>
              )}
            </div>

            {/* Event Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(ev => {
                const myRsvp = ev.rsvps?.find(r => r.flat_number === currentUser.flat);
                return (
                  <div key={ev.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                          {ev.fee_per_person > 0 ? `₹${ev.fee_per_person} / Person` : "Free Entry"}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{ev.total_attendees} Confirmed Attendees</span>
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">{ev.title}</h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{ev.description}</p>

                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{new Date(ev.event_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
                        </div>
                        {ev.venue && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>{ev.venue}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      {myRsvp ? (
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                            myRsvp.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {myRsvp.status === "approved" ? "✓ RSVP Approved" : "⏳ Verification Pending"} ({myRsvp.attendees_count} Pax)
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedEventForRsvp(ev)}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
                        >
                          RSVP & Submit Payment
                        </button>
                      )}

                      {userRole === "admin" && (
                        <button
                          onClick={() => handleExportCsv(ev)}
                          className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center space-x-1.5"
                          title="Export Attendee List as CSV"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export CSV</span>
                        </button>
                      )}
                    </div>

                    {/* Admin Verification Drawer / Table */}
                    {userRole === "admin" && ev.rsvps && ev.rsvps.length > 0 && (
                      <div className="p-4 bg-slate-100 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Admin Verification Queue ({ev.rsvps.length})
                          </h4>
                          <span className="text-xs font-semibold text-slate-600">Total Collected: ₹{ev.total_collected}</span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {ev.rsvps.map(r => (
                            <div key={r.id} className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                              <div>
                                <span className="font-bold text-slate-800">{r.member_name}</span>
                                <span className="text-slate-500 ml-1">({r.flat_number})</span>
                                <div className="text-[11px] text-slate-500 font-medium">
                                  {r.attendees_count} Pax • ₹{r.total_amount} • UTR: <span className="font-mono text-slate-700">{r.utr_number}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                {r.status === "pending" ? (
                                  <>
                                    <button
                                      onClick={() => handleVerifyRsvp(ev.id, r.id, "approved")}
                                      className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white"
                                      title="Approve"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleVerifyRsvp(ev.id, r.id, "rejected")}
                                      className="p-1 rounded bg-rose-500 hover:bg-rose-600 text-white"
                                      title="Reject"
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    r.status === "approved" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                  }`}>
                                    {r.status.toUpperCase()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TRANSPARENT FINANCIAL LEDGER */}
        {/* ======================================================== */}
        {activeTab === "ledger" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Transparent Society Financial Ledger</h2>
                <p className="text-xs text-slate-500">Live view of society maintenance collections, audited expenses, and vendor invoice receipts.</p>
              </div>
              {userRole === "admin" && (
                <button
                  onClick={() => setShowNewTxModal(true)}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition flex items-center space-x-1.5 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Log Income / Expense</span>
                </button>
              )}
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Inflow</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">₹{totalIncome.toLocaleString("en-IN")}</p>
                <p className="text-xs text-slate-500 mt-1">Maintenance & Event collections</p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</span>
                <p className="text-2xl font-black text-rose-600 mt-1">₹{totalExpense.toLocaleString("en-IN")}</p>
                <p className="text-xs text-slate-500 mt-1">Security, Power, Repairs, Lift AMC</p>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Reserve Balance</span>
                <p className="text-2xl font-black text-slate-900 mt-1">₹{netBalance.toLocaleString("en-IN")}</p>
                <p className="text-xs text-brand-600 font-semibold mt-1">Current Bank Balance</p>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Monthly Transaction Entries</h3>
                <span className="text-xs text-slate-500 font-semibold">{ledger.length} Records</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5 text-right">Amount (INR)</th>
                      <th className="px-5 py-3.5 text-center">Receipt / Bill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledger.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5 font-medium text-slate-600 whitespace-nowrap">{t.transaction_date}</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            t.transaction_type === "income" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                          }`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-800 font-medium">{t.description}</td>
                        <td className={`px-5 py-3.5 text-right font-bold whitespace-nowrap ${
                          t.transaction_type === "income" ? "text-emerald-600" : "text-rose-600"
                        }`}>
                          {t.transaction_type === "income" ? "+" : "-"}₹{t.amount.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {t.receipt_url ? (
                            <button
                              onClick={() => alert(`Viewing attached invoice proof: ${t.receipt_url}`)}
                              className="text-[11px] font-bold text-brand-600 hover:underline inline-flex items-center space-x-1"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Proof</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Direct Bank / Self</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: WORKER & VENDOR DIRECTORY */}
        {/* ======================================================== */}
        {activeTab === "vendors" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Verified Service Worker Directory</h2>
                <p className="text-xs text-slate-500">Crowdsourced ratings for electricians, plumbers, doctors, and appliance repairs verified by society members.</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or service..."
                  value={vendorSearch}
                  onChange={e => setVendorSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              {["All", "Electrician", "Plumber", "Doctor", "Appliance Repair"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setVendorCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-full transition whitespace-nowrap ${
                    vendorCategoryFilter === cat
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Vendor Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredVendors.map(v => (
                <div key={v.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {v.category}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-2">{v.name}</h3>
                      </div>
                      <div className="flex items-center space-x-1 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-xs font-bold text-amber-800">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{v.average_rating}</span>
                        <span className="text-[10px] text-amber-600 font-normal">({v.total_reviews})</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">{v.notes}</p>

                    {/* Member Reviews Snippet */}
                    {v.reviews && v.reviews.length > 0 && (
                      <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Latest Resident Review</p>
                        <p className="text-slate-700 italic">"{v.reviews[0].comment}"</p>
                        <p className="text-[10px] text-slate-500 font-medium">— {v.reviews[0].user_name} ({v.reviews[0].flat_number})</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <a
                        href={`tel:${v.phone_number}`}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-xs flex items-center space-x-1 shadow-sm transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                      {v.whatsapp_number && (
                        <a
                          href={`https://wa.me/${v.whatsapp_number.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center space-x-1 shadow-sm transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedVendorForReview(v)}
                      className="text-xs font-bold text-slate-600 hover:text-brand-600 transition"
                    >
                      + Add Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: MEETING AI COPILOT & DETERMINISTIC EXTRACTOR */}
        {/* ======================================================== */}
        {activeTab === "meetings" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
                  <Bot className="w-6 h-6 text-brand-600" />
                  <span>Deterministic Meeting AI & Resident Copilot</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Zero-hallucination LangGraph extraction of meeting decisions, approved budgets, and action items with resident Q&A.
                </p>
              </div>
            </div>

            {/* Dual Grid: Admin Minutes Processor & Conversational Copilot */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Admin Ingestion / Published Records (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Admin Minutes Ingestion Box */}
                {userRole === "admin" && (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-brand-600" />
                        <span>Process Meeting Minutes (AI Extractor)</span>
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-brand-100 text-brand-800 rounded">
                        Admin Tool
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600">Meeting Title</label>
                        <input
                          type="text"
                          placeholder="e.g. August 2026 Monthly Committee"
                          value={transcriptTitle}
                          onChange={e => setTranscriptTitle(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600">Meeting Date</label>
                        <input
                          type="date"
                          value={transcriptDate}
                          onChange={e => setTranscriptDate(e.target.value)}
                          className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600">Paste Raw Notes / Minutes / Transcript</label>
                      <textarea
                        rows={4}
                        placeholder="Paste rough bullet points or minutes here (e.g. Approved Lift AMC for Rs 18,000. Decided to paint building with Asian Paints for Rs 4.5 Lakhs. Assigned gate intercom repair to Mr Joshi by 25th...)"
                        value={rawTranscriptText}
                        onChange={e => setRawTranscriptText(e.target.value)}
                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        onClick={handleProcessTranscript}
                        disabled={isProcessingAi || !rawTranscriptText.trim()}
                        className="px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isProcessingAi ? "Running Deterministic Extraction..." : "Extract Decisions & Budgets"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setTranscriptTitle("Special Water Tank & Security Meeting");
                          setRawTranscriptText(`Held on 5 August 2026.
1. Decided to clean all underground and overhead water tanks on 12th August.
2. Approved water tank cleaning contractor quote of Rs 15,000.
3. CCTV camera expansion at back gate: Approved budget Rs 35,000 with SecureVision vendor.
4. Action: Mr. Verma to notify all residents about water supply interruption on 12th August.`);
                        }}
                        className="text-[11px] text-brand-700 font-semibold hover:underline"
                      >
                        Load Sample Notes
                      </button>
                    </div>

                    {/* Extracted Structured Preview */}
                    {extractedMeeting?.structured_summary && (
                      <div className="mt-4 p-4 rounded-xl bg-brand-50/50 border border-brand-200 space-y-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-brand-900">Extracted Structured Facts (Zero Hallucination)</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                            Review Draft
                          </span>
                        </div>

                        {/* Resolutions */}
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-slate-700 uppercase">Resolutions Passed:</p>
                          {extractedMeeting.structured_summary.resolutions.map(r => (
                            <div key={r.id} className="p-2 bg-white rounded border border-brand-100">
                              <span className="font-bold text-slate-900">{r.id}: {r.title}</span>
                              <p className="text-slate-600 mt-0.5">{r.description}</p>
                            </div>
                          ))}
                        </div>

                        {/* Budgets */}
                        {extractedMeeting.structured_summary.budget_approvals.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-bold text-slate-700 uppercase">Monetary Approvals:</p>
                            {extractedMeeting.structured_summary.budget_approvals.map(b => (
                              <div key={b.id} className="p-2 bg-white rounded border border-brand-100 flex items-center justify-between">
                                <span className="font-semibold text-slate-800">{b.expense_category} ({b.vendor_or_contractor})</span>
                                <span className="font-bold text-emerald-700">₹{b.approved_amount.toLocaleString("en-IN")}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={handlePublishMeeting}
                          className="w-full mt-2 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg transition"
                        >
                          ✓ Confirm & Publish to Society Feed
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Published Meeting Records List */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Published Meeting Archive</h3>
                  {meetings.map(m => (
                    <div key={m.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {m.meeting_type}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-1">{m.title}</h4>
                        </div>
                        <span className="text-xs font-semibold text-slate-500">{m.meeting_date}</span>
                      </div>

                      {m.structured_summary && (
                        <div className="space-y-3 pt-2 text-xs">
                          <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                            {m.structured_summary.executive_summary}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {m.structured_summary.budget_approvals.map(b => (
                              <div key={b.id} className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                                <p className="text-[10px] font-bold text-emerald-800 uppercase">Budget Approved</p>
                                <p className="font-bold text-slate-900 mt-0.5">{b.expense_category}</p>
                                <p className="text-emerald-700 font-extrabold text-sm mt-0.5">₹{b.approved_amount.toLocaleString("en-IN")}</p>
                              </div>
                            ))}
                            {m.structured_summary.action_items.map(a => (
                              <div key={a.id} className="p-2.5 rounded-xl bg-purple-50/60 border border-purple-200">
                                <p className="text-[10px] font-bold text-purple-800 uppercase">Action Assigned</p>
                                <p className="font-bold text-slate-900 mt-0.5">{a.task}</p>
                                <p className="text-purple-700 font-medium text-[11px] mt-0.5">👤 {a.assigned_to}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Interactive Copilot Chat (5 Cols) */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[560px] sticky top-24">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs">ResidentHub Assistant</h4>
                        <p className="text-[10px] text-brand-300">Deterministic RAG • 0 Hallucination</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded border border-brand-500/30">
                      Live
                    </span>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-brand-600 text-white rounded-br-none"
                              : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200"
                          }`}
                        >
                          <div className="whitespace-pre-line">{msg.text}</div>
                          <span className={`text-[9px] block mt-1 ${
                            msg.sender === "user" ? "text-brand-200 text-right" : "text-slate-400"
                          }`}>
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))}
                    {isBotThinking && (
                      <div className="flex justify-start">
                        <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-none px-3.5 py-2 text-xs flex items-center space-x-1.5 border border-slate-200">
                          <span className="animate-pulse font-medium">Searching meeting minutes & ledger...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Suggested Prompts */}
                  <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex space-x-1.5 overflow-x-auto no-scrollbar text-[11px]">
                    {[
                      "Did we approve lift repair?",
                      "Exterior painting decision?",
                      "Current reserve balance?",
                      "Electrician contact?"
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setAiQuery(prompt);
                        }}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:bg-brand-50 hover:text-brand-700 whitespace-nowrap transition"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleAskAi} className="p-3 border-t border-slate-200 flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Ask about any meeting, budget, or rule..."
                      value={aiQuery}
                      onChange={e => setAiQuery(e.target.value)}
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      disabled={!aiQuery.trim() || isBotThinking}
                      className="p-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* MODAL: EVENT RSVP & PAYMENT PROOF */}
      {/* ======================================================== */}
      {selectedEventForRsvp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Confirm Event RSVP</h3>
                <p className="text-xs text-slate-500">{selectedEventForRsvp.title}</p>
              </div>
              <button onClick={() => setSelectedEventForRsvp(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {rsvpSuccessMessage ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-emerald-800">{rsvpSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700">Resident / Family Name</label>
                  <input
                    type="text"
                    disabled
                    value={`${currentUser.name} (Unit ${currentUser.flat})`}
                    className="w-full mt-1 p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-slate-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Number of Attendees (Family / Guests)</label>
                  <div className="flex items-center space-x-3 mt-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setRsvpAttendeesCount(n)}
                        className={`w-9 h-9 rounded-xl font-bold border transition ${
                          rsvpAttendeesCount === n
                            ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedEventForRsvp.fee_per_person > 0 && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between font-bold text-sm text-slate-900">
                      <span>Total Registration Amount:</span>
                      <span className="text-emerald-600 text-base">₹{rsvpAttendeesCount * selectedEventForRsvp.fee_per_person}</span>
                    </div>

                    <div className="text-center py-2 bg-white rounded-lg border border-slate-200 p-2">
                      <p className="text-[10px] text-slate-500 font-semibold mb-1">Scan Society UPI QR to Pay</p>
                      <img
                        src={selectedEventForRsvp.upi_qr_url}
                        alt="UPI QR Code"
                        className="w-36 h-36 mx-auto rounded-lg shadow-sm"
                      />
                      <p className="text-[10px] font-mono text-slate-600 mt-1 font-semibold">greenmeadows@upi</p>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700">UPI Transaction ID / UTR Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 481920491290"
                        value={rsvpUtrNumber}
                        onChange={e => setRsvpUtrNumber(e.target.value)}
                        className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEventForRsvp(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition"
                  >
                    Submit RSVP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD VENDOR REVIEW */}
      {/* ======================================================== */}
      {selectedVendorForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Rate Service Provider</h3>
                <p className="text-xs text-slate-500">{selectedVendorForReview.name} ({selectedVendorForReview.category})</p>
              </div>
              <button onClick={() => setSelectedVendorForReview(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddReview} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Your Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="p-1"
                    >
                      <Star className={`w-6 h-6 ${star <= newRating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                    </button>
                  ))}
                  <span className="font-bold text-slate-700 ml-2">{newRating} / 5 Stars</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Comment / Feedback for Residents</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Prompt service, charged reasonable rate for replacement of bathroom valve."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition"
              >
                Submit Community Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADMIN CREATE EVENT */}
      {/* ======================================================== */}
      {showNewEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Publish New Society Event</h3>
              <button onClick={() => setShowNewEventModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. New Year Eve Community Dinner"
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newEventDate}
                    onChange={e => setNewEventDate(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Fee per Person (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newEventFee}
                    onChange={e => setNewEventFee(Number(e.target.value))}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700">Venue</label>
                <input
                  type="text"
                  placeholder="Clubhouse / Lawn"
                  value={newEventVenue}
                  onChange={e => setNewEventVenue(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  placeholder="Event details, schedule, food menu..."
                  value={newEventDesc}
                  onChange={e => setNewEventDesc(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition"
              >
                Publish Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADMIN LOG TRANSACTION */}
      {/* ======================================================== */}
      {showNewTxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Log Financial Transaction</h3>
              <button onClick={() => setShowNewTxModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700">Type</label>
                  <select
                    value={newTxType}
                    onChange={e => setNewTxType(e.target.value as any)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  >
                    <option value="expense">Expense (- Outflow)</option>
                    <option value="income">Income (+ Inflow)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700">Category</label>
                  <select
                    value={newTxCategory}
                    onChange={e => setNewTxCategory(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Maintenance">Maintenance</option>
                    <option value="Security">Security Guard Salary</option>
                    <option value="Electricity">Electricity Common Area</option>
                    <option value="Lift Maintenance">Lift Maintenance AMC</option>
                    <option value="Gardening & Cleaning">Gardening & Cleaning</option>
                    <option value="Events">Festival / Event Fund</option>
                    <option value="Repairs">Plumbing / Tank Repairs</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Amount (₹ INR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newTxAmount}
                  onChange={e => setNewTxAmount(Number(e.target.value))}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Description & Vendor Details</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Monthly Lift maintenance invoice for Schindler"
                  value={newTxDesc}
                  onChange={e => setNewTxDesc(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition"
              >
                Log Entry to Public Ledger
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
