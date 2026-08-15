"use client";

import React from "react";
import Image from "next/image";

export default function FestiveBackgroundPattern() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Realistic Indian Society & Community Life Backdrop Artwork */}
      <div className="absolute inset-0 opacity-[0.22] mix-blend-multiply transition-opacity duration-1000">
        <Image
          src="/society-backdrop.jpg"
          alt="ResidentHub Society Scenery"
          fill
          priority
          className="object-cover object-bottom"
        />
      </div>

      {/* Subtle soft bottom fade so the cards blend cleanly */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#faf7f2]/30 via-transparent to-[#faf7f2]/50 pointer-events-none" />
    </div>
  );
}
