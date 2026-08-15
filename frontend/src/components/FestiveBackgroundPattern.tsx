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
      <div className="absolute inset-0 opacity-[0.22] mix-blend-multiply transition-opacity duration-1000 dark:hidden">
        <Image
          src="/society-backdrop.jpg"
          alt="ResidentHub Society Scenery"
          fill
          priority
          className="object-cover object-bottom"
        />
      </div>

      {/* Dark Mode Ambient Backdrop (Only rendered when .dark class is active) */}
      <div className="absolute inset-0 opacity-[0.14] mix-blend-screen transition-opacity duration-1000 hidden dark:block">
        <Image
          src="/society-backdrop.jpg"
          alt="ResidentHub Society Scenery"
          fill
          priority
          className="object-cover object-bottom filter brightness-90"
        />
      </div>

      {/* Subtle soft bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#faf7f2]/30 via-transparent to-[#faf7f2]/50 dark:from-[#0f0d0b]/40 dark:via-transparent dark:to-[#0f0d0b]/80 pointer-events-none" />
    </div>
  );
}
