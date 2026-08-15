"use client";

import React from "react";

export default function FestiveBackgroundPattern() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-[0.09] transition-opacity duration-1000"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1600 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <style>{`
            @keyframes swing-motion {
              0%, 100% { transform: rotate(-8deg); transform-origin: 50% 0%; }
              50% { transform: rotate(8deg); transform-origin: 50% 0%; }
            }
            @keyframes kite-drift {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              50% { transform: translate(15px, -12px) rotate(4deg); }
            }
            @keyframes cloud-drift {
              0% { transform: translateX(0); }
              100% { transform: translateX(60px); }
            }
            .animate-swing {
              animation: swing-motion 3.5s ease-in-out infinite;
            }
            .animate-kite {
              animation: kite-drift 5s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* ── 1. SKYLINE: APARTMENT TOWERS & BUILDINGS ───────────────── */}
        <g fill="#78350f" opacity="0.85">
          {/* Background Tower 1 (Far Left) */}
          <rect x="60" y="380" width="130" height="420" rx="6" fill="#92400e" opacity="0.35" />
          {/* Windows on Tower 1 */}
          <g fill="#faf7f2">
            {[410, 450, 490, 530, 570, 610, 650, 690, 730].map((y) => (
              <React.Fragment key={y}>
                <rect x="80" y={y} width="20" height="18" rx="2" />
                <rect x="115" y={y} width="20" height="18" rx="2" />
                <rect x="150" y={y} width="20" height="18" rx="2" />
              </React.Fragment>
            ))}
          </g>

          {/* Background High-Rise Tower 2 (Tower 24 Center-Left) */}
          <rect x="220" y="260" width="170" height="540" rx="8" fill="#78350f" opacity="0.5" />
          {/* Rooftop Water Tank & Solar Panels */}
          <rect x="280" y="235" width="50" height="25" rx="3" fill="#78350f" opacity="0.6" />
          <line x1="250" y1="260" x2="360" y2="260" stroke="#78350f" strokeWidth="4" />
          {/* Balconies & Windows */}
          <g fill="#faf7f2">
            {[300, 345, 390, 435, 480, 525, 570, 615, 660, 705, 750].map((y) => (
              <React.Fragment key={y}>
                <rect x="240" y={y} width="28" height="22" rx="3" />
                <rect x="290" y={y} width="30" height="22" rx="3" />
                <rect x="340" y={y} width="28" height="22" rx="3" />
              </React.Fragment>
            ))}
          </g>

          {/* Mid-Rise Wing (Center Right) */}
          <rect x="1200" y="320" width="160" height="480" rx="8" fill="#78350f" opacity="0.45" />
          {/* Rooftop Pergola */}
          <path d="M1220 320 L1220 300 L1340 300 L1340 320" stroke="#78350f" strokeWidth="4" />
          <line x1="1240" y1="300" x2="1240" y2="320" stroke="#78350f" strokeWidth="3" />
          <line x1="1280" y1="300" x2="1280" y2="320" stroke="#78350f" strokeWidth="3" />
          <line x1="1320" y1="300" x2="1320" y2="320" stroke="#78350f" strokeWidth="3" />
          <g fill="#faf7f2">
            {[360, 405, 450, 495, 540, 585, 630, 675, 720, 765].map((y) => (
              <React.Fragment key={y}>
                <rect x="1225" y={y} width="26" height="20" rx="2" />
                <rect x="1265" y={y} width="28" height="20" rx="2" />
                <rect x="1310" y={y} width="26" height="20" rx="2" />
              </React.Fragment>
            ))}
          </g>

          {/* Far Right Tower */}
          <rect x="1390" y="420" width="140" height="380" rx="6" fill="#92400e" opacity="0.35" />
          <g fill="#faf7f2">
            {[450, 490, 530, 570, 610, 650, 690, 730].map((y) => (
              <React.Fragment key={y}>
                <rect x="1410" y={y} width="22" height="18" rx="2" />
                <rect x="1450" y={y} width="22" height="18" rx="2" />
                <rect x="1490" y={y} width="22" height="18" rx="2" />
              </React.Fragment>
            ))}
          </g>
        </g>

        {/* ── 2. SKY ELEMENTS: KITES & BIRDS ───────────────────────── */}
        <g className="animate-kite">
          {/* Flying Kite 1 */}
          <g transform="translate(520, 180) rotate(15)">
            <polygon points="0,-25 20,0 0,25 -20,0" fill="#ea580c" opacity="0.8" />
            <line x1="0" y1="-25" x2="0" y2="25" stroke="#fff" strokeWidth="1.5" />
            <line x1="-20" y1="0" x2="20" y2="0" stroke="#fff" strokeWidth="1.5" />
            <path d="M0 25 Q10 45 -5 65 Q15 85 0 105" stroke="#ea580c" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          </g>

          {/* Flying Kite 2 */}
          <g transform="translate(1080, 140) rotate(-20)">
            <polygon points="0,-30 25,0 0,30 -25,0" fill="#f59e0b" opacity="0.85" />
            <line x1="0" y1="-30" x2="0" y2="30" stroke="#fff" strokeWidth="1.5" />
            <line x1="-25" y1="0" x2="25" y2="0" stroke="#fff" strokeWidth="1.5" />
            <path d="M0 30 Q-12 55 8 78 Q-10 100 0 120" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          </g>
        </g>

        {/* Birds flying across sky */}
        <g stroke="#78350f" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M720 180 Q728 170 736 180 Q744 170 752 180" />
          <path d="M760 160 Q766 152 772 160 Q778 152 784 160" />
          <path d="M790 175 Q796 168 802 175 Q808 168 814 175" />
        </g>

        {/* ── 3. SOCIETY GROUND, GARDEN & TREES ─────────────────────── */}
        {/* Paved Ground & Walking Track */}
        <path d="M0 800 Q400 790 800 800 T1600 800 L1600 1000 L0 1000 Z" fill="#e7ded2" opacity="0.6" />
        <path d="M0 830 Q400 820 800 830 T1600 830" stroke="#d6cfc4" strokeWidth="6" strokeDasharray="14 10" fill="none" />

        {/* Society Trees & Palm Greens */}
        <g fill="#059669" opacity="0.8">
          {/* Tree Left */}
          <circle cx="170" cy="740" r="45" />
          <circle cx="140" cy="760" r="35" />
          <circle cx="200" cy="760" r="35" />
          <rect x="165" y="770" width="12" height="60" fill="#78350f" rx="3" />

          {/* Tree Center */}
          <circle cx="780" cy="730" r="50" fill="#047857" />
          <circle cx="745" cy="755" r="40" fill="#059669" />
          <circle cx="815" cy="755" r="40" fill="#10b981" />
          <rect x="774" y="765" width="14" height="65" fill="#78350f" rx="3" />

          {/* Tree Right */}
          <circle cx="1130" cy="740" r="48" fill="#059669" />
          <circle cx="1095" cy="765" r="38" fill="#047857" />
          <circle cx="1165" cy="765" r="38" fill="#10b981" />
          <rect x="1124" y="775" width="14" height="60" fill="#78350f" rx="3" />
        </g>

        {/* ── 4. PLAYGROUND EQUIPMENT & ACTIVE CHILDREN ─────────────── */}
        {/* Playground Swings with Animated Child on Swing */}
        <g transform="translate(440, 710)">
          {/* Swing Frame (A-Frame) */}
          <line x1="10" y1="120" x2="50" y2="10" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="90" y1="120" x2="50" y2="10" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="170" y1="120" x2="130" y2="10" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="50" y1="10" x2="130" y2="10" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />

          {/* Swing 1 (Static Empty) */}
          <line x1="75" y1="10" x2="75" y2="85" stroke="#ea580c" strokeWidth="2" />
          <line x1="95" y1="10" x2="95" y2="85" stroke="#ea580c" strokeWidth="2" />
          <rect x="70" y="85" width="30" height="5" rx="2" fill="#ea580c" />

          {/* Swing 2 (Animated Child Swinging) */}
          <g className="animate-swing" style={{ transformOrigin: "115px 10px" }}>
            <line x1="110" y1="10" x2="110" y2="80" stroke="#ea580c" strokeWidth="2" />
            <line x1="125" y1="10" x2="125" y2="80" stroke="#ea580c" strokeWidth="2" />
            <rect x="105" y="80" width="25" height="5" rx="2" fill="#ea580c" />
            {/* Child Body */}
            <circle cx="117" cy="65" r="7" fill="#78350f" />
            <path d="M117 72 L117 92 L128 102 M117 92 L108 102 M117 78 L110 80 M117 78 L125 80" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>

        {/* Children's Slide with Kid sliding down */}
        <g transform="translate(600, 715)">
          {/* Slide Ladder */}
          <line x1="20" y1="115" x2="20" y2="25" stroke="#78350f" strokeWidth="4" />
          <line x1="10" y1="50" x2="20" y2="50" stroke="#78350f" strokeWidth="2.5" />
          <line x1="10" y1="75" x2="20" y2="75" stroke="#78350f" strokeWidth="2.5" />
          <line x1="10" y1="100" x2="20" y2="100" stroke="#78350f" strokeWidth="2.5" />
          {/* Slide Slope */}
          <path d="M20 25 C40 25, 45 60, 95 115" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" fill="none" />
          <line x1="95" y1="115" x2="110" y2="115" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" />
          {/* Kid Sliding Down */}
          <circle cx="62" cy="60" r="6" fill="#78350f" />
          <path d="M62 66 L68 78 L78 85 M62 72 L52 70 M62 72 L70 70" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* ── 5. RESIDENTS, FAMILIES & COMMUNITY LIFE ─────────────────── */}
        {/* Kids Playing Cricket (Left-Center) */}
        <g transform="translate(280, 755)">
          {/* Batsman Kid */}
          <circle cx="20" cy="18" r="7" fill="#78350f" />
          <path d="M20 25 L20 58 L12 88 M20 58 L28 88 M20 35 L34 45 M20 35 L8 38" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          {/* Cricket Bat */}
          <path d="M34 45 L46 25 L50 28 L38 48 Z" fill="#ea580c" />
          {/* Stumps */}
          <line x1="5" y1="45" x2="5" y2="88" stroke="#78350f" strokeWidth="2.5" />
          <line x1="9" y1="45" x2="9" y2="88" stroke="#78350f" strokeWidth="2.5" />
          <line x1="13" y1="45" x2="13" y2="88" stroke="#78350f" strokeWidth="2.5" />
          <line x1="4" y1="45" x2="14" y2="45" stroke="#78350f" strokeWidth="2.5" />

          {/* Bowler Running Kid */}
          <g transform="translate(100, 5)">
            <circle cx="20" cy="15" r="6.5" fill="#78350f" />
            <path d="M20 22 L16 52 L5 78 M16 52 L32 78 M20 32 L36 18 M20 32 L6 38" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="38" cy="16" r="3.5" fill="#ea580c" />
          </g>
        </g>

        {/* Elders Taking Walk & Chatting on Bench (Center-Right) */}
        <g transform="translate(860, 745)">
          {/* Garden Bench */}
          <rect x="0" y="45" width="80" height="8" rx="2" fill="#78350f" />
          <rect x="0" y="25" width="80" height="8" rx="2" fill="#78350f" />
          <line x1="10" y1="53" x2="10" y2="85" stroke="#78350f" strokeWidth="4" />
          <line x1="70" y1="53" x2="70" y2="85" stroke="#78350f" strokeWidth="4" />

          {/* Elder 1 Sitting (Grandfather) */}
          <circle cx="25" cy="15" r="7" fill="#78350f" />
          <path d="M25 22 L25 50 L38 52 L38 85 M25 32 L15 55 L15 85" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
          {/* Walking Stick */}
          <path d="M12 55 Q10 48 6 48 L6 85" stroke="#ea580c" strokeWidth="2.5" fill="none" />

          {/* Elder 2 Sitting (Grandmother) */}
          <circle cx="55" cy="17" r="6.5" fill="#78350f" />
          <path d="M55 24 L55 52 L45 54 L45 85 M55 34 L65 52 L65 85" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
        </g>

        {/* Parents Strolling with Toddler / Walking Track (Right Side) */}
        <g transform="translate(990, 750)">
          {/* Father */}
          <circle cx="20" cy="16" r="7.5" fill="#78350f" />
          <path d="M20 24 L20 62 L12 95 M20 62 L28 95 M20 36 L10 58 M20 36 L32 50" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />

          {/* Child holding father's hand */}
          <circle cx="42" cy="40" r="5" fill="#78350f" />
          <path d="M42 45 L42 70 L36 95 M42 70 L48 95 M42 54 L32 50 M42 54 L52 62" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />

          {/* Mother */}
          <circle cx="68" cy="20" r="7" fill="#78350f" />
          <path d="M68 27 L68 64 L60 95 M68 64 L76 95 M68 38 L52 62 M68 38 L80 58" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
        </g>

        {/* Residents Celebrating / Greeting Namaste (Far Right) */}
        <g transform="translate(1420, 755)">
          {/* Neighbor 1 with folded hands */}
          <circle cx="20" cy="16" r="7" fill="#78350f" />
          <path d="M20 23 L20 60 L14 90 M20 60 L26 90 M20 34 L12 45 L18 45 M20 34 L28 45 L18 45" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />

          {/* Neighbor 2 greeting back */}
          <circle cx="50" cy="16" r="7" fill="#78350f" />
          <path d="M50 23 L50 60 L44 90 M50 60 L56 90 M50 34 L42 45 L48 45 M50 34 L58 45 L48 45" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}
