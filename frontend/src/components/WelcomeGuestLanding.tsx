"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Shield,
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  ArrowRight,
  LogIn,
  UserPlus,
  Quote,
  Building2,
  CheckCircle2,
  Bot,
  HeartHandshake,
  QrCode,
  Star,
  ChevronLeft,
  ChevronRight,
  Radio,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface WelcomeGuestLandingProps {
  onOpenAuth: (mode: "login" | "signup") => void;
  onQuickLogin: (email: string, pass: string) => void;
}

const COMMUNITY_QUOTES = [
  {
    quote: "Vasudhaiva Kutumbakam — The entire community is one unified, flourishing family.",
    author: "Ancient Indian Ethos • Runwal Gardens Philosophy",
    tag: "Harmony & Unity",
    icon: "🪔",
  },
  {
    quote: "Alone we can do so little; together we can do so much for our society.",
    author: "Helen Keller • Dedicated Resident Service",
    tag: "Voluntary Leadership",
    icon: "🤝",
  },
  {
    quote: "A great community is like a banyan tree — flourishing through deep shared roots and transparent care.",
    author: "Tower 24 Co-Operative Living Principle",
    tag: "Transparent Governance",
    icon: "🌳",
  },
  {
    quote: "True community living begins with every shared festival, prompt maintenance, and open dialogue.",
    author: "ResidentHub Core Vision",
    tag: "Community Pulse",
    icon: "🎉",
  },
  {
    quote: "Cooperation is the thorough conviction that nobody can get there unless everybody gets there.",
    author: "Virginia Burden • Society Welfare",
    tag: "Collective Progress",
    icon: "✨",
  },
];

const PLATFORM_PILLARS = [
  {
    icon: DollarSign,
    color: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    title: "Transparent Digital Ledger",
    desc: "Real-time fund tracking, verified maintenance inflows, zero audit objections, and categorized vendor expense reports.",
  },
  {
    icon: Calendar,
    color: "from-orange-500 to-amber-600",
    bgLight: "bg-orange-50 text-orange-700 border-orange-200",
    title: "Festivals & Digital QR Passes",
    desc: "Community festival schedule with tiered family RSVPs (Adults/Children/Seniors) and instant gate-entry QR code passes.",
  },
  {
    icon: Bot,
    color: "from-amber-500 to-yellow-600",
    bgLight: "bg-amber-50 text-amber-700 border-amber-200",
    title: "AI Helpdesk & Issue Bot",
    desc: "Interactive conversational bot for rapid maintenance triage, assigning verified plumbers, electricians, and Schindler lift AMC teams.",
  },
  {
    icon: Users,
    color: "from-blue-500 to-indigo-600",
    bgLight: "bg-blue-50 text-blue-700 border-blue-200",
    title: "Verified Vendor Ecosystem",
    desc: "Curated local Dombivli service partners, bi-annual chlorination specialists, and resident-reviewed contractors.",
  },
];

export default function WelcomeGuestLanding({
  onOpenAuth,
  onQuickLogin,
}: WelcomeGuestLandingProps) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fadeAnim, setFadeAnim] = useState(true);

  // Auto-rotate quotes every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFadeAnim(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % COMMUNITY_QUOTES.length);
        setFadeAnim(true);
      }, 300);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevQuote = () => {
    setFadeAnim(false);
    setTimeout(() => {
      setQuoteIndex((prev) => (prev - 1 + COMMUNITY_QUOTES.length) % COMMUNITY_QUOTES.length);
      setFadeAnim(true);
    }, 200);
  };

  const handleNextQuote = () => {
    setFadeAnim(false);
    setTimeout(() => {
      setQuoteIndex((prev) => (prev + 1) % COMMUNITY_QUOTES.length);
      setFadeAnim(true);
    }, 200);
  };

  const currentQuote = COMMUNITY_QUOTES[quoteIndex];

  return (
    <div className="space-y-10 py-4 max-w-5xl mx-auto">
      {/* 🌟 1. HERO BANNER WITH DYNAMIC ROTATING QUOTE CAROUSEL */}
      <div className="card p-8 sm:p-10 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-white border-stone-800 shadow-2xl rounded-3xl relative overflow-hidden">
        {/* Subtle Decorative Golden Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Brand Tagline & Pulse Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-extrabold uppercase tracking-wider">
              <span className="text-sm">🪔</span>
              <span>RUNWAL GARDENS TOWER 24 • RESIDENT HUB</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>COMMUNITY PORTAL LIVE</span>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Welcome to Your Unified <br />
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">
                Co-Operative Housing Platform
              </span>
            </h1>
            <p className="text-sm sm:text-base text-stone-300 max-w-2xl leading-relaxed">
              ResidentHub seamlessly coordinates accounting, festival RSVPs, maintenance triage, and verified local vendors for 96 resident families of Tower 24.
            </p>
          </div>

          {/* 📜 DYNAMIC ROTATING COMMUNITY QUOTE CARD */}
          <div className="p-6 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md transition-all relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{currentQuote.icon}</span>
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  {currentQuote.tag}
                </span>
              </div>

              {/* Quote Nav Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevQuote}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all"
                  title="Previous Quote"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono text-stone-400 px-1">
                  {quoteIndex + 1}/{COMMUNITY_QUOTES.length}
                </span>
                <button
                  onClick={handleNextQuote}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-all"
                  title="Next Quote"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className={`transition-opacity duration-300 space-y-2 ${
                fadeAnim ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="text-base sm:text-lg font-semibold text-white italic leading-relaxed">
                &ldquo;{currentQuote.quote}&rdquo;
              </p>
              <p className="text-xs text-amber-200/80 font-mono font-medium">
                — {currentQuote.author}
              </p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth("login")}
              className="btn-primary py-3 px-6 text-sm font-extrabold flex items-center gap-2 shadow-xl shadow-orange-600/30"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to Your Flat</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenAuth("signup")}
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Register New Resident</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🚀 2. 1-CLICK INSTANT DEMO PROFILES */}
      <div className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#383028] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-stone-100 dark:border-[#2e2620]">
          <div>
            <h3 className="text-sm font-mono font-extrabold text-amber-800 dark:text-amber-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Instant 1-Click Platform Access (Demo Preview)</span>
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Explore society modules immediately with pre-configured verified roles:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Admin Profile */}
          <button
            type="button"
            onClick={() => onQuickLogin("admin@residenthub.local", "admin123")}
            className="p-4 rounded-2xl bg-stone-50 hover:bg-amber-50 dark:bg-[#221c18] dark:hover:bg-[#2a221d] border border-stone-200 dark:border-[#3d332a] hover:border-amber-400 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold text-lg shadow-sm">
                👑
              </div>
              <div>
                <span className="font-extrabold text-xs text-stone-900 dark:text-white block group-hover:text-orange-600 transition-colors">
                  Society Chairman & Governance (Admin)
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                  Shri Dhawal Panchal • Flat B-201 (Owner)
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                <span>Enter</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </button>

          {/* Resident Profile */}
          <button
            type="button"
            onClick={() => onQuickLogin("member@residenthub.local", "member123")}
            className="p-4 rounded-2xl bg-stone-50 hover:bg-amber-50 dark:bg-[#221c18] dark:hover:bg-[#2a221d] border border-stone-200 dark:border-[#3d332a] hover:border-amber-400 transition-all text-left flex items-center justify-between group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-lg shadow-sm">
                🏡
              </div>
              <div>
                <span className="font-extrabold text-xs text-stone-900 dark:text-white block group-hover:text-emerald-600 transition-colors">
                  Resident Member Profile
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                  Anil Sharma • Flat B-201 (Renter)
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <span>Enter</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 🏛️ 3. WHAT IS RESIDENTHUB ABOUT? CORE PILLARS */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight">
            Everything Tower 24 Needs in One Place
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-xl mx-auto">
            Discover the intelligent infrastructure powering smooth day-to-day operations and community harmony.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {PLATFORM_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="card p-6 bg-white dark:bg-[#1b1613] border-stone-200 dark:border-[#352c24] hover:border-amber-400 dark:hover:border-amber-600 transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${pillar.bgLight} flex items-center justify-center font-bold shadow-xs border`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-stone-900 dark:text-stone-100 text-sm">
                    {pillar.title}
                  </h3>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed font-medium">
                  {pillar.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🔒 4. PRIVACY & STATUTORY NOTICE */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300/60 dark:border-amber-900/40 text-center space-y-1 text-xs text-amber-900 dark:text-amber-300">
        <p className="font-bold flex items-center justify-center gap-1.5">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>Restricted Society Member Network</span>
        </p>
        <p className="text-[11px] text-stone-600 dark:text-stone-400">
          Financial statements, resident passes, and notice archives are protected. Please sign in with your verified flat credentials to access internal society records.
        </p>
      </div>
    </div>
  );
}
