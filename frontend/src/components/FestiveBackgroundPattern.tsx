"use client";

import React from "react";

export default function FestiveBackgroundPattern() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none opacity-[0.08] transition-opacity duration-1000"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full object-cover"
        viewBox="0 0 1600 950"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <style>{`
            @keyframes swing-natural {
              0%, 100% { transform: rotate(-7deg); transform-origin: 480px 690px; }
              50% { transform: rotate(7deg); transform-origin: 480px 690px; }
            }
            @keyframes kite-soar {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              50% { transform: translate(18px, -15px) rotate(5deg); }
            }
            .animate-swing-natural {
              animation: swing-natural 3.8s ease-in-out infinite;
            }
            .animate-kite-soar {
              animation: kite-soar 6s ease-in-out infinite;
            }
          `}</style>
        </defs>

        {/* ── 1. REALISTIC RESIDENTIAL TOWERS SKYLINE ───────────────── */}
        <g fill="#78350f" opacity="0.6">
          {/* Tower 1 (West Wing) */}
          <path d="M60 400 L190 400 L190 820 L60 820 Z" fill="#92400e" opacity="0.3" />
          <g fill="#faf7f2">
            {[430, 475, 520, 565, 610, 655, 700, 745].map((y) => (
              <React.Fragment key={y}>
                <rect x="75" y={y} width="24" height="22" rx="3" />
                <rect x="115" y={y} width="24" height="22" rx="3" />
                <rect x="155" y={y} width="24" height="22" rx="3" />
              </React.Fragment>
            ))}
          </g>

          {/* Tower 2 (Tower 24 High-Rise Main) */}
          <path d="M230 240 L410 240 L410 820 L230 820 Z" fill="#78350f" opacity="0.45" />
          {/* Architectural Balcony Bands & Rooftop Solar Grid */}
          <rect x="290" y="215" width="60" height="25" rx="4" fill="#78350f" />
          <line x1="230" y1="240" x2="410" y2="240" stroke="#78350f" strokeWidth="4" />
          <g fill="#faf7f2">
            {[280, 330, 380, 430, 480, 530, 580, 630, 680, 730].map((y) => (
              <React.Fragment key={y}>
                {/* Balcony Railings */}
                <rect x="250" y={y} width="40" height="26" rx="4" />
                <rect x="305" y={y} width="40" height="26" rx="4" />
                <rect x="360" y={y} width="35" height="26" rx="4" />
              </React.Fragment>
            ))}
          </g>

          {/* Tower 3 (East Wing) */}
          <path d="M1180 300 L1360 300 L1360 820 L1180 820 Z" fill="#78350f" opacity="0.4" />
          {/* Pergola Terrace */}
          <path d="M1200 300 L1200 280 L1340 280 L1340 300" stroke="#78350f" strokeWidth="4" />
          <g fill="#faf7f2">
            {[340, 390, 440, 490, 540, 590, 640, 690, 740].map((y) => (
              <React.Fragment key={y}>
                <rect x="1205" y={y} width="38" height="26" rx="4" />
                <rect x="1260" y={y} width="40" height="26" rx="4" />
                <rect x="1315" y={y} width="35" height="26" rx="4" />
              </React.Fragment>
            ))}
          </g>

          {/* Tower 4 (Clubhouse Wing) */}
          <path d="M1390 420 L1530 420 L1530 820 L1390 820 Z" fill="#92400e" opacity="0.3" />
          <g fill="#faf7f2">
            {[450, 495, 540, 585, 630, 675, 720, 765].map((y) => (
              <React.Fragment key={y}>
                <rect x="1410" y={y} width="26" height="22" rx="3" />
                <rect x="1450" y={y} width="28" height="22" rx="3" />
                <rect x="1490" y={y} width="26" height="22" rx="3" />
              </React.Fragment>
            ))}
          </g>
        </g>

        {/* ── 2. SKY ELEMENTS & REALISTIC FLYING KITES ─────────────── */}
        <g className="animate-kite-soar">
          {/* Realistic Patang / Indian Kite 1 */}
          <g transform="translate(560, 160) rotate(12)">
            <path d="M0 -30 C12 -12, 28 -5, 30 0 C28 5, 12 12, 0 30 C-12 12, -28 5, -30 0 C-28 -5, -12 -12, 0 -30 Z" fill="#ea580c" opacity="0.85" />
            <line x1="0" y1="-30" x2="0" y2="30" stroke="#ffffff" strokeWidth="1.8" />
            <path d="M-30 0 Q0 12 30 0" stroke="#ffffff" strokeWidth="1.8" fill="none" />
            <polygon points="-6,30 6,30 0,42" fill="#f59e0b" />
            <path d="M0 42 Q15 65 -8 90 Q15 115 0 140" stroke="#ea580c" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          </g>

          {/* Realistic Kite 2 */}
          <g transform="translate(1060, 130) rotate(-18)">
            <path d="M0 -32 C15 -12, 30 -5, 32 0 C30 5, 15 12, 0 32 C-15 12, -30 5, -32 0 C-30 -5, -15 -12, 0 -32 Z" fill="#f59e0b" opacity="0.9" />
            <line x1="0" y1="-32" x2="0" y2="32" stroke="#ffffff" strokeWidth="1.8" />
            <path d="M-32 0 Q0 15 32 0" stroke="#ffffff" strokeWidth="1.8" fill="none" />
            <polygon points="-7,32 7,32 0,45" fill="#ea580c" />
            <path d="M0 45 Q-15 70 10 95 Q-15 120 0 145" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />
          </g>
        </g>

        {/* ── 3. SOCIETY PARK, REALISTIC TREES & WALKING TRACK ───────── */}
        {/* Walking Pathway & Green Lawn */}
        <path d="M0 790 Q400 780 800 790 T1600 790 L1600 950 L0 950 Z" fill="#e7ded2" opacity="0.7" />
        <path d="M0 825 Q400 815 800 825 T1600 825" stroke="#d5ccbf" strokeWidth="8" strokeDasharray="16 12" fill="none" />

        {/* Realistic Lush Trees with detailed leafy canopy and trunk */}
        <g opacity="0.85">
          {/* Tree 1 (Left Park) */}
          <path d="M150 780 C150 750 160 740 162 710 C145 705 130 685 135 660 C125 640 135 615 155 605 C160 585 185 570 210 580 C235 565 265 575 275 600 C295 610 305 635 295 660 C305 685 290 710 270 715 C272 740 280 750 280 780 Z" fill="#047857" />
          <path d="M205 780 C205 745 208 720 200 690 C210 670 225 670 230 690 C222 720 225 745 225 780 Z" fill="#78350f" />

          {/* Tree 2 (Center Park) */}
          <path d="M730 780 C730 745 740 735 742 705 C720 700 705 675 710 650 C700 625 715 595 740 585 C750 560 780 545 810 555 C840 540 875 555 885 580 C910 595 920 625 910 655 C920 680 905 705 880 710 C882 735 890 745 890 780 Z" fill="#059669" />
          <path d="M800 780 C800 740 805 715 795 680 C810 660 825 660 830 680 C820 715 825 740 825 780 Z" fill="#78350f" />

          {/* Tree 3 (Right Park) */}
          <path d="M1100 780 C1100 750 1110 740 1112 710 C1095 705 1080 685 1085 660 C1075 640 1085 615 1105 605 C1110 585 1135 570 1160 580 C1185 565 1215 575 1225 600 C1245 610 1255 635 1245 660 C1255 685 1240 710 1220 715 C1222 740 1230 750 1230 780 Z" fill="#047857" />
          <path d="M1155 780 C1155 745 1158 720 1150 690 C1160 670 1175 670 1180 690 C1172 720 1175 745 1175 780 Z" fill="#78350f" />
        </g>

        {/* ── 4. REALISTIC PLAYGROUND: SWINGS & SLIDE ───────────────── */}
        {/* Realistic Playground Swing Structure */}
        <g transform="translate(420, 670)">
          {/* Steel A-Frames */}
          <path d="M10 140 L45 20 L55 20 L90 140" stroke="#78350f" strokeWidth="6" strokeLinecap="round" fill="none" />
          <line x1="22" y1="95" x2="78" y2="95" stroke="#78350f" strokeWidth="4" />
          
          <path d="M130 140 L165 20 L175 20 L210 140" stroke="#78350f" strokeWidth="6" strokeLinecap="round" fill="none" />
          <line x1="142" y1="95" x2="198" y2="95" stroke="#78350f" strokeWidth="4" />

          {/* Top Crossbar */}
          <line x1="35" y1="20" x2="185" y2="20" stroke="#78350f" strokeWidth="8" strokeLinecap="round" />

          {/* Swing 1: Empty Seat */}
          <line x1="75" y1="24" x2="75" y2="105" stroke="#ea580c" strokeWidth="2.5" />
          <line x1="95" y1="24" x2="95" y2="105" stroke="#ea580c" strokeWidth="2.5" />
          <rect x="70" y="105" width="30" height="6" rx="2" fill="#ea580c" />

          {/* Swing 2: Realistic Child Seated & Swinging Naturally */}
          <g className="animate-swing-natural">
            <line x1="125" y1="24" x2="125" y2="100" stroke="#ea580c" strokeWidth="2.5" />
            <line x1="145" y1="24" x2="145" y2="100" stroke="#ea580c" strokeWidth="2.5" />
            <rect x="120" y="100" width="30" height="6" rx="2" fill="#ea580c" />

            {/* Realistic Seated Child Silhouette with Hair, Torso, Legs */}
            <path
              d="M135 72 C135 68, 138 65, 142 65 C146 65, 149 68, 149 72 C149 76, 146 79, 142 79 C138 79, 135 76, 135 72 Z 
                 M137 79 C134 83, 132 89, 132 98 C132 104, 134 107, 138 107 L148 107 C151 107, 153 103, 152 98 C151 89, 148 83, 145 79 Z
                 M134 107 L142 107 L152 118 L146 122 L138 114 Z
                 M140 107 L148 107 L158 118 L152 122 L144 114 Z
                 M136 86 L126 94 L127 98 L138 89 Z
                 M146 86 L144 94 L146 98 L148 89 Z"
              fill="#78350f"
            />
          </g>
        </g>

        {/* Realistic Playground Slide with Ladder & Child Sliding */}
        <g transform="translate(620, 680)">
          {/* Steps / Ladder */}
          <line x1="15" y1="130" x2="15" y2="30" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />
          <line x1="5" y1="55" x2="15" y2="55" stroke="#78350f" strokeWidth="3" />
          <line x1="5" y1="80" x2="15" y2="80" stroke="#78350f" strokeWidth="3" />
          <line x1="5" y1="105" x2="15" y2="105" stroke="#78350f" strokeWidth="3" />
          
          {/* Top Platform & Safety Guard */}
          <path d="M15 30 L35 30 L35 50 L15 50 Z" fill="#ea580c" />
          <path d="M15 15 L35 15 L35 30" stroke="#78350f" strokeWidth="3.5" fill="none" />

          {/* Smooth Curved Slide Chute */}
          <path d="M35 32 C65 32, 70 85, 120 130" stroke="#ea580c" strokeWidth="8" strokeLinecap="round" fill="none" />
          <path d="M35 27 C65 27, 72 80, 120 125" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" fill="none" />

          {/* Realistic Child Sliding Down Chute with Arms Raised */}
          <path
            d="M74 65 C74 61, 77 58, 81 58 C85 58, 88 61, 88 65 C88 69, 85 72, 81 72 C77 72, 74 69, 74 65 Z
               M75 72 C72 76, 70 82, 72 90 C78 96, 85 96, 90 92 C88 84, 84 76, 80 72 Z
               M78 92 L96 104 L92 108 L74 96 Z
               M68 62 L74 74 L78 72 L72 60 Z
               M82 60 L86 72 L90 70 L86 58 Z"
            fill="#78350f"
          />
        </g>

        {/* ── 5. REALISTIC RESIDENTS & CHILDREN SILHOUETTES ───────────── */}
        {/* Kids Playing Cricket (Left Side) */}
        <g transform="translate(250, 720)">
          {/* Stumps & Bails */}
          <line x1="10" y1="50" x2="10" y2="90" stroke="#78350f" strokeWidth="3" />
          <line x1="15" y1="50" x2="15" y2="90" stroke="#78350f" strokeWidth="3" />
          <line x1="20" y1="50" x2="20" y2="90" stroke="#78350f" strokeWidth="3" />
          <line x1="8" y1="50" x2="22" y2="50" stroke="#78350f" strokeWidth="3" />

          {/* Realistic Batsman (In Batting Stance with Helmet/Cap & Bat) */}
          <path
            d="M38 32 C38 27, 42 23, 47 23 C52 23, 56 27, 56 32 C56 37, 52 41, 47 41 C42 41, 38 37, 38 32 Z
               M36 41 C33 46, 32 54, 34 65 C34 72, 38 76, 44 76 C50 76, 54 72, 53 65 C54 54, 52 46, 48 41 Z
               M35 75 L30 90 L38 90 L40 76 Z
               M46 76 L52 90 L60 90 L52 75 Z
               M36 48 L48 58 L54 54 L42 45 Z"
            fill="#78350f"
          />
          {/* Realistic Cricket Bat */}
          <path d="M48 54 L62 30 L67 32 L53 58 Z" fill="#ea580c" />

          {/* Realistic Bowler Running In (Athletic Pose with Ball in Hand) */}
          <g transform="translate(105, -5)">
            <path
              d="M32 28 C32 23, 36 19, 41 19 C46 19, 50 23, 50 28 C50 33, 46 37, 41 37 C36 37, 32 33, 32 28 Z
                 M32 37 C29 42, 27 50, 29 60 C32 66, 38 68, 44 65 C48 56, 48 46, 43 37 Z
                 M28 60 L16 88 L24 88 L34 65 Z
                 M38 65 L52 86 L58 84 L46 60 Z
                 M34 42 L52 20 L56 24 L38 46 Z
                 M30 44 L16 54 L18 58 L32 48 Z"
              fill="#78350f"
            />
            {/* Red Cricket Ball in Hand */}
            <circle cx="56" cy="18" r="4.5" fill="#ea580c" />
          </g>
        </g>

        {/* Realistic Elders (Grandparents) on Society Garden Bench (Center) */}
        <g transform="translate(860, 715)">
          {/* Wooden Society Park Bench */}
          <rect x="0" y="55" width="95" height="10" rx="3" fill="#78350f" opacity="0.9" />
          <rect x="0" y="32" width="95" height="9" rx="3" fill="#78350f" opacity="0.9" />
          <path d="M12 65 L12 95 M83 65 L83 95" stroke="#78350f" strokeWidth="5" strokeLinecap="round" />

          {/* Grandfather (Seated with Kurta, Spec Frame, & Wooden Walking Cane) */}
          <path
            d="M20 22 C20 17, 24 13, 29 13 C34 13, 38 17, 38 22 C38 27, 34 31, 29 31 C24 31, 20 27, 20 22 Z
               M18 31 C15 36, 14 46, 15 58 L38 58 C40 50, 39 39, 36 31 Z
               M18 58 L18 78 L26 95 L34 95 L28 75 L30 58 Z
               M22 40 L10 65 L14 67 L26 44 Z"
            fill="#78350f"
          />
          {/* Walking Cane */}
          <path d="M10 65 Q8 55 2 55 L2 95" stroke="#ea580c" strokeWidth="3" fill="none" strokeLinecap="round" />

          {/* Grandmother (Seated Gracefully in Saree Pallu & Hair Bun) */}
          <path
            d="M58 24 C58 19, 62 15, 67 15 C72 15, 76 19, 76 24 C76 29, 72 33, 67 33 C62 33, 58 29, 58 24 Z
               M74 20 C76 20, 79 22, 79 25 C79 28, 76 30, 74 30 Z
               M56 33 C52 39, 50 48, 52 60 L78 60 C80 50, 78 40, 74 33 Z
               M54 60 L54 82 L62 95 L72 95 L68 78 L72 60 Z
               M60 42 L72 58 L76 55 L64 38 Z"
            fill="#78350f"
          />
        </g>

        {/* Realistic Family Strolling with Toddler (Right Side) */}
        <g transform="translate(1000, 715)">
          {/* Father (Walking in Casual Polo & Trousers) */}
          <path
            d="M18 20 C18 14, 22 10, 28 10 C34 10, 38 14, 38 20 C38 26, 34 30, 28 30 C22 30, 18 26, 18 20 Z
               M16 30 C12 37, 10 48, 12 62 L38 62 C40 50, 39 38, 36 30 Z
               M14 62 L8 95 L16 95 L24 64 Z
               M26 62 L34 95 L42 95 L34 62 Z
               M16 38 L6 62 L10 64 L20 42 Z
               M32 38 L44 58 L40 60 L28 40 Z"
            fill="#78350f"
          />

          {/* Toddler / Small Kid (Holding Father's Hand Happily Walking) */}
          <path
            d="M48 50 C48 45, 51 42, 55 42 C59 42, 62 45, 62 50 C62 55, 59 58, 55 58 C51 58, 48 55, 48 50 Z
               M46 58 C44 62, 42 70, 44 80 L62 80 C64 72, 62 64, 60 58 Z
               M46 80 L42 95 L48 95 L52 81 Z
               M54 80 L58 95 L64 95 L58 81 Z
               M46 64 L38 56 L40 54 L48 62 Z
               M58 64 L68 74 L66 76 L56 66 Z"
            fill="#78350f"
          />

          {/* Mother (Walking in Kurti with Flowing Dupatta) */}
          <path
            d="M78 22 C78 16, 82 12, 88 12 C94 12, 98 16, 98 22 C98 28, 94 32, 88 32 C82 32, 78 28, 78 22 Z
               M76 32 C72 40, 70 54, 72 70 L98 70 C100 56, 98 42, 94 32 Z
               M74 70 L70 95 L78 95 L84 72 Z
               M86 70 L92 95 L100 95 L92 72 Z
               M76 40 L64 62 L68 64 L80 44 Z
               M92 40 L102 62 L98 64 L88 44 Z"
            fill="#78350f"
          />
        </g>

        {/* Realistic Resident Jogger / Fitness Enthusiast on Track (Far Right) */}
        <g transform="translate(1420, 710)">
          {/* Jogger in Athletic Running Motion */}
          <path
            d="M25 22 C25 16, 29 12, 35 12 C41 12, 45 16, 45 22 C45 28, 41 32, 35 32 C29 32, 25 28, 25 22 Z
               M22 32 C18 40, 18 48, 22 60 L44 58 C46 48, 44 38, 40 32 Z
               M20 60 L8 88 L16 90 L30 62 Z
               M34 58 L54 84 L60 80 L42 56 Z
               M22 40 L38 48 L36 52 L18 44 Z
               M38 38 L24 28 L22 32 L34 42 Z"
            fill="#78350f"
          />
        </g>
      </svg>
    </div>
  );
}
