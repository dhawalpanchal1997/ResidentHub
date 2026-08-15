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
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/events", label: "Events & RSVPs", icon: Calendar },
  { href: "/ledger", label: "Financial Ledger", icon: DollarSign },
  { href: "/vendors", label: "Vendor Directory", icon: Users },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, login, register, logout, loading } = useAuth();
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading ResidentHub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-auto h-screen w-[260px] bg-slate-900 text-white flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">ResidentHub</h1>
              <p className="text-[11px] text-slate-400">Tower 24 • Runwal Gardens</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-slate-800">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-sm font-bold">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name}</p>
                  <p className="text-xs text-slate-400">{user.flat_number} • <span className={user.role === "admin" ? "text-violet-400" : "text-sky-400"}>{user.role}</span></p>
                </div>
              </div>
              <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button onClick={() => { setAuthMode("login"); setShowAuth(true); resetForm(); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 transition-all">
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
              <button onClick={() => { setAuthMode("signup"); setShowAuth(true); resetForm(); }} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <UserPlus className="w-4 h-4" />
                Register
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-slate-100">
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-sm text-slate-800">ResidentHub</span>
          </div>
          {!user && (
            <button onClick={() => { setAuthMode("login"); setShowAuth(true); resetForm(); }} className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white">
              Sign In
            </button>
          )}
        </header>

        {/* Page content */}
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Auth Modal */}
      {showAuth && (
        <div className="modal-backdrop" onClick={() => setShowAuth(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {authMode === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  {authMode === "login" ? "Sign in to access your society portal" : "Join your society community"}
                </p>
              </div>
              <button onClick={() => setShowAuth(false)} className="p-2 rounded-xl hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {authError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="form-input pl-10" required />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="form-input pl-10" required />
                </div>
              </div>

              {authMode === "signup" && (
                <>
                  <div>
                    <label className="form-label">Full Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Priya Patel" className="form-input pl-10" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Flat Number</label>
                      <input type="text" value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} placeholder="B-201" className="form-input" required />
                    </div>
                    <div>
                      <label className="form-label">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+91 98765..." className="form-input pl-10" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={authLoading} className="btn-primary w-full">
                {authLoading ? "Please wait..." : authMode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500">
              {authMode === "login" ? (
                <>
                  New here?{" "}
                  <button onClick={() => { setAuthMode("signup"); setAuthError(""); }} className="font-medium text-emerald-600 hover:text-emerald-700">
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => { setAuthMode("login"); setAuthError(""); }} className="font-medium text-emerald-600 hover:text-emerald-700">
                    Sign in
                  </button>
                </>
              )}
            </div>

            {authMode === "login" && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-2">Demo Accounts:</p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { setEmail("admin@residenthub.local"); setPassword("admin123"); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white text-xs transition-all"
                  >
                    <span className="font-medium text-violet-600">Admin:</span>
                    <span className="text-slate-600 ml-1">admin@residenthub.local / admin123</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmail("member@residenthub.local"); setPassword("member123"); }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white text-xs transition-all"
                  >
                    <span className="font-medium text-sky-600">Member:</span>
                    <span className="text-slate-600 ml-1">member@residenthub.local / member123</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
