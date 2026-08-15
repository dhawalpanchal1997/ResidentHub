"use client";

import React, { useEffect, useState } from "react";
import { Building2, ShieldCheck, Zap, Sparkles, Wifi, Users, Home } from "lucide-react";

export default function HousingHeroVisual() {
  // Random glowing window states for apartment tower simulation
  const [activeWindows, setActiveWindows] = useState<number[]>([1, 4, 7, 10, 12, 15]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Pick 5-8 random active windows
      const count = 5 + Math.floor(Math.random() * 4);
      const newActive: number[] = [];
      while (newActive.length < count) {
        const r = Math.floor(Math.random() * 20) + 1;
        if (!newActive.includes(r)) newActive.push(r);
      }
      setActiveWindows(newActive);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 sm:p-8 text-white border border-slate-800/80 shadow-2xl shadow-emerald-950/20">
      {/* Dynamic background ambient glowing orbs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: Text & Live Community Ticker */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Tower 24 • Live Society Hub
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Verified Community
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              Smart Residential Society Operations
            </h2>
            <p className="text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
              Transparent maintenance ledgers, age-tiered event ticketing, AI bank statement reconciliation, and verified neighborhood contractor directory.
            </p>
          </div>

          {/* Quick Housing Metric Tags */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 backdrop-blur-sm">
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span>96 Premium Flats</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>24/7 Power Backup</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Active Residents Welfare</span>
            </div>
          </div>
        </div>

        {/* Right: Animated Housing Tower Silhouette Graphic */}
        <div className="relative shrink-0 flex items-end gap-3 p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 backdrop-blur-md">
          {/* Tower 1 (Mid Rise) */}
          <div className="w-16 bg-slate-950/80 rounded-t-xl border-t-2 border-x border-slate-700/60 p-1.5 flex flex-col gap-1 shadow-lg">
            <div className="text-[8px] font-mono text-center text-slate-400 font-bold">WING A</div>
            <div className="grid grid-cols-2 gap-1 my-1">
              {[1, 2, 3, 4, 5, 6].map((w) => (
                <div
                  key={w}
                  className={`h-2.5 rounded-sm transition-all duration-700 ${
                    activeWindows.includes(w)
                      ? "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
            <div className="w-4 h-5 bg-emerald-500/30 rounded-t-sm mx-auto border-t border-emerald-400/40" />
          </div>

          {/* Tower 2 (High Rise - Main Tower 24) */}
          <div className="w-24 bg-slate-950 rounded-t-2xl border-t-2 border-x border-emerald-500/60 p-2 flex flex-col gap-1.5 shadow-2xl relative">
            {/* Top Antenna Beacon */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3 bg-emerald-400">
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="text-[9px] font-mono text-center text-emerald-300 font-extrabold flex items-center justify-center gap-1">
              <Building2 className="w-2.5 h-2.5" />
              TOWER 24
            </div>

            {/* Window Grid */}
            <div className="grid grid-cols-3 gap-1 my-1">
              {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((w) => (
                <div
                  key={w}
                  className={`h-3 rounded-sm transition-all duration-700 ${
                    activeWindows.includes(w)
                      ? "bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.9)]"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>

            {/* Grand Lobby Entrance */}
            <div className="w-8 h-6 bg-gradient-to-t from-emerald-500/40 to-teal-400/20 rounded-t-md mx-auto border-t-2 border-emerald-400 flex items-center justify-center">
              <span className="text-[7px] text-emerald-200 font-bold">LOBBY</span>
            </div>
          </div>

          {/* Tower 3 (Clubhouse Wing) */}
          <div className="w-16 bg-slate-950/80 rounded-t-xl border-t-2 border-x border-slate-700/60 p-1.5 flex flex-col gap-1 shadow-lg">
            <div className="text-[8px] font-mono text-center text-slate-400 font-bold">WING B</div>
            <div className="grid grid-cols-2 gap-1 my-1">
              {[19, 20, 21, 22, 23, 24].map((w) => (
                <div
                  key={w}
                  className={`h-2.5 rounded-sm transition-all duration-700 ${
                    activeWindows.includes(w % 20)
                      ? "bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.8)]"
                      : "bg-slate-800"
                  }`}
                />
              ))}
            </div>
            <div className="w-4 h-5 bg-sky-500/30 rounded-t-sm mx-auto border-t border-sky-400/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
