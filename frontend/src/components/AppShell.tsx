"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  Building2,
  Calendar,
  DollarSign,
  Users,
  LogIn,
  LogOut,
  UserPlus,
  Shield,
  Home,
  X,
  Menu,
  Sparkles,
  ChevronDown,
  User as UserIcon,
  Key,
  HomeIcon,
  Phone,
  Mail,
  Check,
  Sun,
  Moon,
  QrCode,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Bot,
} from "lucide-react";
import FestiveBackgroundPattern from "@/components/FestiveBackgroundPattern";
import IssueIntakeBotDrawer from "@/components/IssueIntakeBotDrawer";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home, badge: null },
  { href: "/issues", label: "Issues & Helpdesk", icon: AlertCircle, badge: "AI Bot" },
  { href: "/events", label: "Events & Utsavs", icon: Calendar, badge: "Tiered" },
  { href: "/ledger", label: "Financial Ledger", icon: DollarSign, badge: "AI Sync" },
  { href: "/vendors", label: "Verified Vendors", icon: Users, badge: null },
  { href: "/analytics", label: "Society Analytics", icon: BarChart3, badge: "AI Insights" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, login, register, logout, loading, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  // Left Panel is DEFAULT CLOSED (opens on toggle)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Right Slide-in Issue Intake Bot Drawer state (Available Globally)
  const [botDrawerOpen, setBotDrawerOpen] = useState(false);

  // Top-Right Profile Dropdown state
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Theme state (Strict Default: Light Mode)
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Auth form state (Residency Type recorded strictly at signup)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [signupResidency, setSignupResidency] = useState<"Owner" | "Renter">("Owner");

  // Initialize theme (Strict Default: Light Mode unless explicitly set to dark by user)
  useEffect(() => {
    const savedTheme = localStorage.getItem("residenthub_theme") as "light" | "dark" | null;
    if (savedTheme === "dark") {
      setTheme("dark");
      document.documentElement.classList.add("dark");
    } else {
      setTheme("light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("residenthub_theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute fixed recorded residency type for current user
  const userResidencyType: "Owner" | "Renter" = user?.residency_type || (user?.flat_number?.toUpperCase().startsWith("B") ? "Renter" : "Owner");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          full_name: fullName,
          flat_number: flatNumber,
          phone_number: phoneNumber,
          residency_type: signupResidency,
        });
      }
      setShowAuth(false);
      resetForm();
      router.push("/"); // Default landing page after signin / signup is Dashboard
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setAuthError("");
    setAuthLoading(true);
    try {
      await login(demoEmail, demoPass);
      setShowAuth(false);
      resetForm();
      router.push("/"); // Default landing page after signin is Dashboard
    } catch (err: any) {
      setAuthError(err.message || "Quick login failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setFlatNumber("");
    setPhoneNumber("");
    setSignupResidency("Owner");
    setAuthError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-950">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-amber-200/80 text-sm font-medium">Namaste! Loading ResidentHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7f2] relative text-stone-900 transition-colors duration-200">
      {/* Light & Dark Faded Festive & Society Life Background Pattern */}
      <FestiveBackgroundPattern />

      {/* Slide-out Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Slide-in Navigation Drawer (Liquid Glassmorphism UI) */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-[295px] bg-white/80 dark:bg-[#120e0b]/85 backdrop-blur-2xl backdrop-saturate-150 text-stone-800 dark:text-stone-200 flex flex-col transition-transform duration-300 ease-in-out border-r border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Glass Brand Header */}
        <div className="p-5 border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl flex items-center justify-between">
          <Link
            href="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-orange-600/30 text-white shrink-0 group-hover:scale-105 transition-transform">
              <span className="text-lg">🪔</span>
            </div>
            <div>
              <h1 className="text-base font-extrabold text-stone-900 dark:text-white tracking-tight flex items-center gap-1.5">
                ResidentHub
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30">
                  CHS
                </span>
              </h1>
              <p className="text-[11px] text-orange-700/80 dark:text-amber-200/70 font-semibold truncate max-w-[140px]">
                Runwal Gardens T24
              </p>
            </div>
          </Link>

          {/* Close Drawer Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Glassmorphic Navigation Menu */}
        <nav className="flex-1 px-3.5 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-extrabold text-stone-500 dark:text-stone-400 uppercase tracking-wider font-mono flex items-center justify-between">
            <span>Society Modules</span>
            <span className="text-[10px] text-orange-600 dark:text-amber-400 font-bold bg-orange-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-amber-900/50">✨ 96 Flats</span>
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-orange-500/5 backdrop-blur-xl text-orange-700 dark:text-amber-300 border border-orange-500/30 shadow-xs"
                    : "text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/10 hover:backdrop-blur-md"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? "text-orange-600 dark:text-amber-400" : "text-stone-500 dark:text-stone-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full ${
                      active
                        ? "bg-orange-500/20 text-orange-700 dark:text-amber-300 border border-orange-400/30"
                        : "bg-stone-200/80 dark:bg-white/10 text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Glassmorphic Drawer Footer */}
        <div className="p-4 border-t border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-white/70 dark:border-white/10 shadow-xs">
            <span className="text-xs text-stone-700 dark:text-stone-300 font-semibold flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-3.5 h-3.5 text-amber-400" /> : <Sun className="w-3.5 h-3.5 text-orange-500" />}
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <button
              onClick={toggleTheme}
              className="p-1 px-2.5 rounded-lg bg-stone-200/80 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold transition-all shadow-xs"
            >
              Toggle
            </button>
          </div>

          {user ? (
            <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/70 dark:border-white/10 flex items-center gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-700 dark:text-amber-300 font-extrabold text-xs shrink-0">
                {user.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-stone-900 dark:text-white truncate">{user.full_name}</p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium truncate">Flat {user.flat_number} • {userResidencyType}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode("login");
                setShowAuth(true);
                setSidebarOpen(false);
              }}
              className="btn-primary w-full py-2 text-xs font-bold shadow-md shadow-orange-600/10"
            >
              <LogIn className="w-3.5 h-3.5 mr-1" />
              Sign In / Demo Access
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative z-10">
        {/* Top Context Bar with Menu Toggle & Top-Right Expandable Profile */}
        <header className="sticky top-0 z-30 h-16 bg-[#faf7f2]/95 backdrop-blur-md border-b border-[#eee7dd] px-4 sm:px-8 flex items-center justify-between shadow-sm transition-colors duration-200">
          {/* Left: Menu Drawer Toggle & Society Title */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-stone-800 hover:bg-stone-200/70 border border-stone-300/80 shadow-sm transition-all text-xs font-semibold"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4 text-orange-600" />
              <span>Menu</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-stone-800 hidden sm:inline">
                Runwal Gardens Tower 24
              </span>
              <span className="text-xs text-stone-400 hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                Vasudhaiva Kutumbakam 🪔
              </span>
            </div>
          </div>

          {/* Right: Theme Toggle & Expandable User Profile Dropdown */}
          <div className="flex items-center gap-2.5">
            {/* Quick Sun / Moon Theme Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-stone-700 bg-white border border-stone-300/80 shadow-sm hover:bg-stone-100 transition-all flex items-center justify-center"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700" />
              )}
            </button>

            {user ? (
              <div className="relative" ref={profileRef}>
                {/* Profile Pill Trigger Button */}
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white border transition-all shadow-sm hover:shadow ${
                    profileOpen
                      ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/40"
                      : "border-[#eee7dd] hover:border-stone-300"
                  }`}
                  aria-expanded={profileOpen}
                >
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user.full_name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-stone-900 leading-tight flex items-center gap-1.5">
                      {user.full_name.split(" ")[0]}
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded font-mono border border-amber-200">
                        {user.flat_number}
                      </span>
                    </p>
                    <p className="text-[10px] font-semibold text-stone-500 leading-tight">
                      {userResidencyType} • {isAdmin ? "Admin" : "Resident"}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                      profileOpen ? "rotate-180 text-amber-600" : ""
                    }`}
                  />
                </button>

                {/* Expandable Profile Dropdown Card */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#181411] rounded-2xl border border-[#eee7dd] dark:border-[#383028] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header Banner */}
                    <div className="p-4 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-white border-b border-amber-900/30">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-500 to-yellow-400 flex items-center justify-center text-white font-extrabold text-base shadow-lg shrink-0">
                          {user.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-extrabold text-white truncate">
                            {user.full_name}
                          </h3>
                          <p className="text-xs text-amber-200/80 truncate flex items-center gap-1 mt-0.5 font-mono">
                            <Mail className="w-3 h-3 shrink-0" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Member Details Grid */}
                    <div className="p-4 space-y-3 bg-[#faf7f2] dark:bg-[#120f0d] border-b border-stone-200/80 dark:border-[#2b241e]">
                      {/* Flat Number & Role */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-white dark:bg-[#1f1915] rounded-xl border border-[#eee7dd] dark:border-[#383028] shadow-xs">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-mono">
                            Flat Number
                          </span>
                          <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1 mt-0.5">
                            <HomeIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Flat {user.flat_number}
                          </span>
                        </div>

                        <div className="p-2.5 bg-white dark:bg-[#1f1915] rounded-xl border border-[#eee7dd] dark:border-[#383028] shadow-xs">
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block font-mono">
                            Society Role
                          </span>
                          <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1 mt-0.5">
                            <Shield className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                            {isAdmin ? "Admin Committee" : "Resident"}
                          </span>
                        </div>
                      </div>

                      {/* Official Recorded Residency Type (Fixed 1 per user) */}
                      <div className="p-2.5 bg-white dark:bg-[#1f1915] rounded-xl border border-[#eee7dd] dark:border-[#383028] shadow-xs flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider font-mono flex items-center gap-1">
                            <Key className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Residency Status
                          </span>
                          <span className="text-xs font-extrabold text-stone-900 dark:text-stone-100 mt-0.5 block">
                            {userResidencyType === "Owner" ? "🏠 Flat Owner" : "🔑 Registered Tenant"}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          userResidencyType === "Owner"
                            ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                            : "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                        }`}>
                          ✓ {userResidencyType}
                        </span>
                      </div>

                      {/* Society Badge Info */}
                      <div className="flex items-center justify-between px-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                        <span>Society: Runwal Gardens T24</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      </div>

                      {/* Quick Shortcut to Tickets */}
                      <Link
                        href="/events"
                        onClick={() => setProfileOpen(false)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 dark:bg-[#251b13] hover:bg-amber-100 dark:hover:bg-[#302217] border border-amber-200/90 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all shadow-xs"
                      >
                        <div className="flex items-center gap-2">
                          <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>My Event Tickets & QR Passes</span>
                        </div>
                        <span className="text-[10px] font-mono bg-amber-200/80 dark:bg-amber-900/80 px-1.5 py-0.5 rounded text-amber-900 dark:text-amber-300">
                          View 🎟️
                        </span>
                      </Link>
                    </div>

                    {/* Footer / Theme & Log Out Actions */}
                    <div className="p-3 bg-white dark:bg-[#181411] flex items-center justify-between gap-2">
                      <button
                        onClick={toggleTheme}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-[#261f1a] border border-stone-200 dark:border-[#383028] transition-all"
                      >
                        {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-stone-700" />}
                        <span>{theme === "dark" ? "Light" : "Dark"}</span>
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900/60 hover:border-rose-300 transition-all shadow-xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuth(true);
                }}
                className="btn-primary text-xs py-1.5 px-3.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Modern Auth Modal with 1-Click Demo Profiles & Residency Type on Signup */}
      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div
            className="modal-content p-6 max-w-md bg-white dark:bg-[#191613] border border-[#eee7dd] dark:border-[#332c26] text-stone-900 dark:text-stone-100 shadow-2xl rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">
                  {authMode === "login" ? "Namaste! Welcome Back" : "Register Society Flat"}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  {authMode === "login"
                    ? "Access society events, payments, and notices"
                    : "Create your resident account with verified flat & residency status"}
                </p>
              </div>
              <button
                onClick={() => setShowAuth(false)}
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1-Click Demo Access Shortcuts */}
            {authMode === "login" && (
              <div className="mb-5 p-3.5 bg-stone-50 dark:bg-[#221d19] rounded-2xl border border-stone-200/90 dark:border-[#383028]">
                <p className="text-[11px] font-bold text-stone-700 dark:text-amber-300 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  1-Click Demo Profiles
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin@residenthub.local", "admin123")}
                    disabled={authLoading}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#181411] hover:bg-amber-50 dark:hover:bg-[#28211b] border border-stone-200 dark:border-[#383028] hover:border-amber-300 dark:hover:border-amber-500/50 text-left text-xs font-semibold text-stone-800 dark:text-stone-200 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 flex items-center justify-center font-bold text-[10px]">
                        👑
                      </span>
                      <div>
                        <span className="font-bold block text-stone-900 dark:text-stone-100">Admin Committee (Owner)</span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">Rajesh Sharma • Flat A-402</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">admin@residenthub.local</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("member@residenthub.local", "member123")}
                    disabled={authLoading}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#181411] hover:bg-amber-50 dark:hover:bg-[#28211b] border border-stone-200 dark:border-[#383028] hover:border-amber-300 dark:hover:border-amber-500/50 text-left text-xs font-semibold text-stone-800 dark:text-stone-200 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-[10px]">
                        👩
                      </span>
                      <div>
                        <span className="font-bold block text-stone-900 dark:text-stone-100">Priya Patel (Renter)</span>
                        <span className="text-[10px] text-stone-500 dark:text-stone-400">Flat B-201 • Renter</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">member@residenthub.local</span>
                  </button>
                </div>
              </div>
            )}

            {authError && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === "signup" && (
                <>
                  <div>
                    <label className="form-label text-stone-800 dark:text-stone-200">Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rajesh Sharma"
                      className="form-input bg-white dark:bg-[#14110f] border-stone-300 dark:border-[#383028] text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-600"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label text-stone-800 dark:text-stone-200">Flat Number *</label>
                      <input
                        type="text"
                        value={flatNumber}
                        onChange={(e) => setFlatNumber(e.target.value)}
                        placeholder="e.g. A-102"
                        className="form-input bg-white dark:bg-[#14110f] border-stone-300 dark:border-[#383028] text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label text-stone-800 dark:text-stone-200">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="9876543210"
                        className="form-input bg-white dark:bg-[#14110f] border-stone-300 dark:border-[#383028] text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-600"
                      />
                    </div>
                  </div>

                  {/* Mandatory 1-Per-User Residency Type Selection */}
                  <div>
                    <label className="form-label text-stone-800 dark:text-stone-200">Residency Type * (Recorded on account)</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setSignupResidency("Owner")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          signupResidency === "Owner"
                            ? "bg-amber-50 dark:bg-amber-950/60 border-amber-500 dark:border-amber-500 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20 dark:ring-amber-500/40 shadow-sm"
                            : "bg-white dark:bg-[#14110f] border-stone-200 dark:border-[#383028] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#1f1915]"
                        }`}
                      >
                        🏠 Flat Owner
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupResidency("Renter")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          signupResidency === "Renter"
                            ? "bg-blue-50 dark:bg-sky-950/60 border-blue-500 dark:border-sky-500 text-blue-900 dark:text-sky-300 ring-2 ring-blue-500/20 dark:ring-sky-500/40 shadow-sm"
                            : "bg-white dark:bg-[#14110f] border-stone-200 dark:border-[#383028] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#1f1915]"
                        }`}
                      >
                        🔑 Renter / Tenant
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="form-label text-stone-800 dark:text-stone-200">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@residenthub.local"
                  className="form-input bg-white dark:bg-[#14110f] border-stone-300 dark:border-[#383028] text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-600"
                  required
                />
              </div>

              <div>
                <label className="form-label text-stone-800 dark:text-stone-200">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input bg-white dark:bg-[#14110f] border-stone-300 dark:border-[#383028] text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-stone-600"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary w-full py-2.5 text-sm mt-2 font-bold shadow-lg"
              >
                {authLoading ? "Processing..." : authMode === "login" ? "Sign In" : "Register Flat"}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-[#2e2620] text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
                className="text-xs text-orange-600 dark:text-amber-400 hover:text-orange-700 dark:hover:text-amber-300 font-semibold transition-colors"
              >
                {authMode === "login"
                  ? "Don't have an account? Register flat"
                  : "Already registered? Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 Floating Action Widget on Every Page */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setBotDrawerOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-xs shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ring-4 ring-orange-500/20 active:scale-95"
          title="Report Maintenance Issue via AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-orange-600 animate-pulse" />
          </div>
          <span className="tracking-wide hidden sm:inline">Report Issue / Helpdesk</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-mono font-bold tracking-wider">
            AI BOT
          </span>
        </button>
      </div>

      {/* 🤖 Global Slide-in Right Drawer */}
      <IssueIntakeBotDrawer
        isOpen={botDrawerOpen}
        onClose={() => setBotDrawerOpen(false)}
      />
    </div>
  );
}
