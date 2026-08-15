"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Sparkles,
  ChevronRight,
  Receipt,
  Bell,
  Search,
  CheckCircle,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home, badge: null },
  { href: "/events", label: "Events & RSVPs", icon: Calendar, badge: "Tiered" },
  { href: "/ledger", label: "Financial Ledger", icon: DollarSign, badge: "AI Sync" },
  { href: "/vendors", label: "Vendor Directory", icon: Users, badge: null },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, login, register, logout, loading, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        await login(email, password);
      } else {
        await register({ email, password, full_name: fullName, flat_number: flatNumber, phone_number: phoneNumber });
      }
      setShowAuth(false);
      resetForm();
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
    setAuthError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm font-medium">Initializing ResidentHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50/80">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Modern Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-[270px] bg-slate-950 text-slate-200 flex flex-col transition-transform duration-300 lg:translate-x-0 border-r border-slate-800/80 shrink-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/70">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  ResidentHub
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                    V1.0
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                  Runwal Gardens T24
                </p>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3.5 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Main Modules
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    active ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer — User Status / Login */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                  {user.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <span>{user.flat_number}</span>
                    <span>•</span>
                    <span className={`capitalize font-semibold ${user.role === "admin" ? "text-violet-400" : "text-emerald-400"}`}>
                      {user.role}
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => { setAuthMode("login"); setShowAuth(true); }}
                className="btn-primary w-full py-2 text-xs"
              >
                <LogIn className="w-3.5 h-3.5 mr-1" />
                Sign In / Demo Access
              </button>
              <button
                onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Create Account
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Context Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-slate-700 hidden sm:inline">Runwal Gardens Tower 24</span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs font-medium text-slate-500">Live Society Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className={`badge ${isAdmin ? "badge-admin" : "badge-member"}`}>
                  <Shield className="w-3 h-3 mr-0.5" />
                  {isAdmin ? "Admin Committee" : "Verified Resident"}
                </span>
                <span className="text-xs font-bold text-slate-800 hidden md:inline px-2.5 py-1 bg-slate-100 rounded-lg">
                  Flat {user.flat_number}
                </span>
              </div>
            ) : (
              <button
                onClick={() => { setAuthMode("login"); setShowAuth(true); }}
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

      {/* Modern Auth Modal with 1-Click Demo Profiles */}
      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div className="modal-content p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {authMode === "login" ? "Welcome Back" : "Register Flat"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {authMode === "login"
                    ? "Access society events, payments, and notices"
                    : "Create your resident account to participate in events"}
                </p>
              </div>
              <button onClick={() => setShowAuth(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* 1-Click Demo Access Shortcuts */}
            {authMode === "login" && (
              <div className="mb-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  1-Click Demo Accounts
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin("admin@residenthub.local", "admin123")}
                    disabled={authLoading}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left text-xs font-semibold text-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-[10px]">
                        AD
                      </span>
                      <span>Admin Committee</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">admin@residenthub.local</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin("member@residenthub.local", "member123")}
                    disabled={authLoading}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-left text-xs font-semibold text-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                        PP
                      </span>
                      <span>Priya Patel (B-201)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">member@residenthub.local</span>
                  </button>
                </div>
              </div>
            )}

            {authError && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {authMode === "signup" && (
                <>
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Amit Deshmukh"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Flat Number *</label>
                      <input
                        type="text"
                        value={flatNumber}
                        onChange={(e) => setFlatNumber(e.target.value)}
                        placeholder="e.g. A-102"
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="9876543210"
                        className="form-input"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="resident@residenthub.local"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-primary w-full py-2.5 text-sm mt-2"
              >
                {authLoading ? "Processing..." : authMode === "login" ? "Sign In" : "Register Account"}
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "signup" : "login");
                  setAuthError("");
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                {authMode === "login"
                  ? "Don't have an account? Register flat"
                  : "Already registered? Sign in"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
