"use client";

import React, { useEffect, useState } from "react";
import { Building2, ShieldCheck, Sparkles, Heart, Users, Home } from "lucide-react";

export default function HousingHeroVisual() {
  // Random glowing window states for apartment tower with Indian festive lighting (warm amber, golden diya, emerald, peacock)
  const [activeWindows, setActiveWindows] = useState<number[]>([1, 4, 7, 10, 12, 15, 18]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Pick 6-10 random active windows
      const count = 6 + Math.floor(Math.random() * 5);
      const newActive: number[] = [];
      while (newActive.length < count) {
        const r = Math.floor(Math.random() * 24) + 1;
        if (!newActive.includes(r)) newActive.push(r);
      }
      setActiveWindows(newActive);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-6 sm:p-8 text-white border border-amber-900/40 shadow-2xl shadow-amber-950/30">
      {/* Warm Diya & Marigold ambient glowing orbs */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/20 blur-3xl pointer-events-none animate-diya" />
      <div className="absolute bottom-0 left-1/4 -mb-20 w-72 h-72 rounded-full bg-orange-600/15 blur-3xl pointer-events-none" />

      {/* Rangoli / Geometric grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fbbf24 1px, transparent 1px), linear-gradient(to bottom, #fbbf24 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left: Text & Multicultural Society Vision */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 shadow-sm">
              <span className="text-sm">🪔</span>
              Runwal Gardens T24 • Unity in Diversity
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-200/80 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              96 Diverse Families • One Harmonious Community
            </span>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
              Celebrating Every Indian Culture & Festival Together
            </h2>
            <p className="text-sm text-stone-300 mt-1.5 max-w-xl leading-relaxed">
              From <span className="text-amber-300 font-semibold">Ganesh Utsav</span> & <span className="text-orange-300 font-semibold">Navratri Garba</span> to <span className="text-yellow-300 font-semibold">Diwali Annakut</span>, <span className="text-emerald-300 font-semibold">Onam Sadhya</span> & <span className="text-rose-300 font-semibold">Durga Puja</span> — enjoy transparent accounts, demographic headcounts, and community welfare.
            </p>
          </div>

          {/* Cultural & Society Badges */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-amber-200 backdrop-blur-sm shadow-sm">
              <span>🌺</span>
              <span>Maharashtrian & Konkani</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-amber-200 backdrop-blur-sm shadow-sm">
              <span>🥁</span>
              <span>Gujarati & Rajasthani</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-amber-200 backdrop-blur-sm shadow-sm">
              <span>🌴</span>
              <span>South Indian Traditions</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-amber-200 backdrop-blur-sm shadow-sm">
              <span>✨</span>
              <span>North & Eastern Celebrations</span>
            </div>
          </div>
        </div>

        {/* Right: Festive Housing Tower Graphic with Lighting */}
        <div className="relative shrink-0 flex items-end gap-3 p-4 bg-stone-900/70 rounded-2xl border border-amber-500/30 backdrop-blur-md shadow-xl">
          {/* Wing A (Festive Decorated) */}
          <div className="w-16 bg-stone-950/90 rounded-t-xl border-t-2 border-x border-amber-600/70 p-1.5 flex flex-col gap-1 shadow-lg">
            <div className="text-[8px] font-mono text-center text-amber-400 font-bold">WING A</div>
            <div className="grid grid-cols-2 gap-1 my-1">
              {[1, 2, 3, 4, 5, 6].map((w) => (
                <div
                  key={w}
                  className={`h-2.5 rounded-sm transition-all duration-700 ${
                    activeWindows.includes(w)
                      ? "bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.9)]"
                      : "bg-stone-800"
                  }`}
                />
              ))}
            </div>
            <div className="w-4 h-5 bg-amber-500/30 rounded-t-sm mx-auto border-t border-amber-400/40" />
          </div>

          {/* Main Tower 24 High-Rise (Illuminated Diya Beacon) */}
          <div className="w-24 bg-stone-950 rounded-t-2xl border-t-2 border-x border-orange-500/80 p-2 flex flex-col gap-1.5 shadow-2xl relative">
            {/* Top Diya Glow Beacon */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center">
              <span className="text-xs animate-bounce">🪔</span>
            </div>

            <div className="text-[9px] font-mono text-center text-amber-300 font-extrabold flex items-center justify-center gap-1 mt-1">
              <Building2 className="w-2.5 h-2.5" />
              TOWER 24
            </div>

            {/* Window Grid */}
            <div className="grid grid-cols-3 gap-1 my-1">
              {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((w) => {
                const isDiya = activeWindows.includes(w);
                const colorClass =
                  w % 3 === 0
                    ? "bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]"
                    : w % 2 === 0
                    ? "bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.9)]"
                    : "bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]";

                return (
                  <div
                    key={w}
                    className={`h-3 rounded-sm transition-all duration-700 ${
                      isDiya ? colorClass : "bg-stone-800"
                    }`}
                  />
                );
              })}
            </div>

            {/* Grand Society Entrance */}
            <div className="w-10 h-6 bg-gradient-to-t from-amber-500/40 to-orange-400/20 rounded-t-md mx-auto border-t-2 border-amber-400 flex items-center justify-center">
              <span className="text-[7px] text-amber-200 font-bold tracking-wider">SWAGATAM</span>
            </div>
          </div>

          {/* Wing B (Festive Decorated) */}
          <div className="w-16 bg-stone-950/90 rounded-t-xl border-t-2 border-x border-amber-600/70 p-1.5 flex flex-col gap-1 shadow-lg">
            <div className="text-[8px] font-mono text-center text-amber-400 font-bold">WING B</div>
            <div className="grid grid-cols-2 gap-1 my-1">
              {[19, 20, 21, 22, 23, 24].map((w) => (
                <div
                  key={w}
                  className={`h-2.5 rounded-sm transition-all duration-700 ${
                    activeWindows.includes(w)
                      ? "bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.9)]"
                      : "bg-stone-800"
                  }`}
                />
              ))}
            </div>
            <div className="w-4 h-5 bg-orange-500/30 rounded-t-sm mx-auto border-t border-orange-400/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
