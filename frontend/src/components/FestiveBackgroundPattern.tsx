"use client";

import React from "react";

export default function FestiveBackgroundPattern() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-[0.06] transition-opacity duration-1000"
      aria-hidden="true"
    >
      {/* Slow floating festive background SVG pattern */}
      <svg
        className="w-full h-full object-cover animate-gentle-drift"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Decorative Rangoli Mandalas in background corners */}
        <g stroke="#ea580c" strokeWidth="1.5" strokeDasharray="3 3">
          <circle cx="120" cy="150" r="80" />
          <circle cx="120" cy="150" r="50" />
          <circle cx="120" cy="150" r="25" />
          <path d="M120 70 L120 230 M40 150 L200 150 M65 95 L175 205 M65 205 L175 95" />

          <circle cx="1320" cy="750" r="100" />
          <circle cx="1320" cy="750" r="60" />
          <circle cx="1320" cy="750" r="30" />
          <path d="M1320 650 L1320 850 M1220 750 L1420 750" />
        </g>

        {/* Flying Kites (Makar Sankranti / Festival) */}
        <g stroke="#ea580c" strokeWidth="1.8" fill="#f59e0b" fillOpacity="0.3" className="animate-float">
          {/* Kite 1 */}
          <path d="M400 180 L425 150 L450 180 L425 210 Z" />
          <path d="M425 150 L425 210 M400 180 Q425 195 450 180" fill="none" />
          <path d="M425 210 Q435 230 420 250 Q440 270 425 290" fill="none" strokeDasharray="2 2" />

          {/* Kite 2 */}
          <path d="M1150 120 L1180 85 L1210 120 L1180 155 Z" />
          <path d="M1180 85 L1180 155 M1150 120 Q1180 135 1210 120" fill="none" />
          <path d="M1180 155 Q1195 180 1175 205 Q1200 230 1180 255" fill="none" strokeDasharray="2 2" />
        </g>

        {/* Society Garden Pathway & Community Life Silhouettes */}
        <g fill="#78350f">
          {/* Tree 1 (Gulmohar / Neem in Garden) */}
          <path d="M220 820 L220 680 Q220 640 180 600 Q240 560 280 620 Q320 580 300 660 L240 680 L240 820 Z" />
          
          {/* Tree 2 */}
          <path d="M1260 840 L1260 700 Q1220 660 1260 620 Q1310 590 1340 640 Q1380 620 1360 700 L1280 720 L1280 840 Z" />

          {/* Garden Pathway Bench */}
          <path d="M600 780 L680 780 L680 790 L600 790 Z M610 790 L610 820 M670 790 L670 820 M600 765 L680 765 L680 775 L600 775 Z" />

          {/* Person 1 & 2: Elders Taking Morning / Evening Walk in Society */}
          <g transform="translate(480, 710)">
            {/* Person 1 (With Walking Stick) */}
            <circle cx="20" cy="15" r="7" />
            <path d="M20 23 L20 60 L12 95 M20 60 L26 95 M20 35 L8 60 M20 35 L32 55 L32 95" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
            {/* Person 2 (Partner Walking Along) */}
            <circle cx="48" cy="18" r="6.5" />
            <path d="M48 25 L48 62 L42 95 M48 62 L54 95 M48 37 L38 58 M48 37 L58 58" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          </g>

          {/* Kids Playing Cricket / Football in Society Compound */}
          <g transform="translate(850, 720)">
            {/* Kid 1 - Batsman */}
            <circle cx="25" cy="15" r="6" />
            <path d="M25 22 L25 55 L16 85 M25 55 L32 85 M25 32 L40 45 L48 30" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
            {/* Cricket Bat */}
            <path d="M45 25 L55 10 L60 15 L50 30 Z" />

            {/* Kid 2 - Bowler Running */}
            <circle cx="120" cy="14" r="6" />
            <path d="M120 21 L115 50 L95 75 M115 50 L135 75 M120 30 L140 18 M120 30 L100 40" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
            {/* Ball in Air */}
            <circle cx="80" cy="35" r="3" fill="#ea580c" />
          </g>

          {/* Family Celebrating Festival / Lighting Diya / Rangoli */}
          <g transform="translate(1020, 725)">
            {/* Mother kneeling at Rangoli */}
            <circle cx="20" cy="30" r="5.5" />
            <path d="M20 36 Q25 55 15 75 L30 75 Q35 60 25 50 M20 45 L8 60" stroke="#78350f" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Little Kid Watching Excitedly */}
            <circle cx="45" cy="40" r="4.5" />
            <path d="M45 45 L45 65 L40 80 M45 65 L50 80 M45 52 L35 58 M45 52 L55 58" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
            {/* Small Diya / Lamp Flame */}
            <path d="M5 75 Q8 70 8 67 Q8 70 11 75 Z" fill="#ea580c" />
          </g>

          {/* Dhol / Garba Dancers Silhouette in Center Background */}
          <g transform="translate(690, 715)">
            {/* Dandiya Dancer 1 */}
            <circle cx="20" cy="15" r="6" />
            <path d="M20 22 L20 54 L12 85 M20 54 L28 85 M20 32 L35 22 M20 32 L8 25" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
            {/* Dandiya Stick 1 */}
            <line x1="30" y1="15" x2="45" y2="30" stroke="#ea580c" strokeWidth="2.5" />

            {/* Dandiya Dancer 2 */}
            <circle cx="55" cy="15" r="6" />
            <path d="M55 22 L55 54 L48 85 M55 54 L64 85 M55 32 L40 22 M55 32 L68 25" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
            {/* Dandiya Stick 2 */}
            <line x1="45" y1="15" x2="32" y2="30" stroke="#ea580c" strokeWidth="2.5" />
          </g>
        </g>

        {/* Floating Marigold Petals & Festive Elements */}
        <g fill="#f59e0b" className="animate-pulse">
          <circle cx="320" cy="350" r="4" />
          <circle cx="340" cy="370" r="3" />
          <circle cx="750" cy="220" r="3.5" />
          <circle cx="920" cy="310" r="4" />
          <circle cx="940" cy="330" r="3" />
          <circle cx="1100" cy="420" r="4" />
          <circle cx="180" cy="520" r="3" />
          <circle cx="580" cy="480" r="3.5" />
        </g>
      </svg>
    </div>
  );
}
