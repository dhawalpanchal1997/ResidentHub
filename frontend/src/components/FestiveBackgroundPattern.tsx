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
      <div className="absolute inset-0 opacity-[0.14] mix-blend-multiply transition-opacity duration-1000 scale-[1.02]">
        <Image
          src="/society-backdrop.jpg"
          alt="ResidentHub Society Scenery"
          fill
          priority
          className="object-cover object-bottom"
        />
      </div>

      {/* Ambient gradient fade to keep content area crisp and readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#faf7f2]/60 via-transparent to-[#faf7f2]/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#faf7f2]/50 via-transparent to-[#faf7f2]/50" />
    </div>
  );
}
