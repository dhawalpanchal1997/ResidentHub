"use client";

import React from "react";
import Image from "next/image";

export default function FestiveBackgroundPattern() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Realistic Indian Society & Community Life Backdrop Artwork (Light Mode) */}
      <div className="absolute inset-0 opacity-[0.22] mix-blend-multiply transition-opacity duration-1000 dark:hidden">
        <Image
          src="/society-backdrop.jpg"
          alt="ResidentHub Society Scenery"
          fill
          priority
          className="object-cover object-bottom"
        />
      </div>

      {/* Realistic Indian Society & Community Life Backdrop Artwork (Dark Mode) */}
      <div className="absolute inset-0 opacity-[0.14] mix-blend-screen transition-opacity duration-1000 hidden dark:block">
        <Image
          src="/society-backdrop.jpg"
          alt="ResidentHub Society Scenery"
          fill
          priority
          className="object-cover object-bottom filter brightness-90 contrast-110"
        />
      </div>

      {/* Subtle soft bottom fade for seamless card blending */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#faf7f2]/30 via-transparent to-[#faf7f2]/50 dark:from-[#12100e]/50 dark:via-transparent dark:to-[#12100e]/80 pointer-events-none" />
    </div>
  );
}
