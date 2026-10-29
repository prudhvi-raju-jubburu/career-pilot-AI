import React from 'react';

/**
 * StaircaseEnvironment
 * Upgraded to match the 3D Pixar storyboard reference:
 * - Weathered stone mountain steps with 3D bevels, depth, and contact lighting
 * - "Low Motivation" floating dark rock with glowing low-battery indicator
 * - "Lack of Resources" floating island with stacked glowing leather-bound study books
 * - "Skill Gaps" treacherous fractured chasm with floating crumbling stone shards
 * - "Uncertainty" conflicting directional signposts pointing in diverging paths
 * - Persistence phase: steps ignite with cyan/royal-blue neon borders & underglow
 * - Holographic HUD cards: [Personalized Guidance], [Curated Resources], [Verified Opportunities], [Skill Development]
 * - Radiant cyan cyber-bridge reconnecting the fractured gap
 * - Grand golden glowing arched portal of "SUCCESS" radiating sunburst light rays
 */
export default function StaircaseEnvironment({
  currentScene = 1,
  litStepCount = 0,
  showBridge = false,
  showTransformedObstacles = false,
  staircaseDissolve = false,
}) {
  // 10 Steps from base to summit
  const steps = [
    { index: 0, x: 160, y: 540, w: 96, h: 26, depth: 20 },
    { index: 1, x: 220, y: 500, w: 92, h: 26, depth: 20 },
    { index: 2, x: 280, y: 460, w: 92, h: 26, depth: 20 },
    { index: 3, x: 340, y: 420, w: 92, h: 26, depth: 20 }, // Stumble landing step
    { index: 4, x: 400, y: 380, w: 92, h: 26, depth: 20 }, // Low motivation
    { index: 5, x: 460, y: 340, w: 92, h: 26, depth: 20 }, // Resource gaps
    { index: 6, x: 520, y: 300, w: 92, h: 26, depth: 20, isBroken: true }, // Skill gap
    { index: 7, x: 580, y: 260, w: 92, h: 26, depth: 20 }, // Uncertainty
    { index: 8, x: 640, y: 220, w: 92, h: 26, depth: 20 }, // Opportunity discovery
    { index: 9, x: 700, y: 180, w: 92, h: 26, depth: 20 }, // Prep & confidence
  ];

  return (
    <g
      className="cpe-staircase-environment"
      style={{
        opacity: staircaseDissolve ? 0 : 1,
        filter: staircaseDissolve ? 'blur(16px)' : 'none',
        transition: 'opacity 0.8s ease-out, filter 0.8s ease-out',
      }}
    >
      <defs>
        {/* Glow Filters */}
        <filter id="cpeNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="cpeGoldGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Natural Weathered Stone Gradients */}
        <linearGradient id="stoneTread" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id="stoneRiser" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#090e1a" />
        </linearGradient>

        {/* Illuminated Cyan Neon Tread */}
        <linearGradient id="neonCyanTread" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#2563eb" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="1" />
        </linearGradient>

        {/* Floating Mountain Rock Texture */}
        <linearGradient id="rockGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="60%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>

        {/* Golden Success Gateway Gradients */}
        <radialGradient id="portalGoldAura" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="25%" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#eab308" stopOpacity="0.6" />
          <stop offset="85%" stopColor="#ca8a04" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#020617" stopOpacity="0" />
        </radialGradient>

        {/* Cyber Bridge Pattern */}
        <pattern id="cyberLattice" width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.75" />
        </pattern>

        {/* HUD Card Background */}
        <linearGradient id="hudGlassBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(15, 23, 42, 0.85)" />
          <stop offset="100%" stopColor="rgba(30, 58, 138, 0.55)" />
        </linearGradient>
      </defs>

      {/* Atmospheric Mountain Fog & City Lights Backdrop */}
      <g className="cpe-mountain-fog" opacity="0.45">
        <path d="M 0 580 Q 250 520 500 560 T 1000 520 L 1000 650 L 0 650 Z" fill="#081026" />
        <ellipse cx="240" cy="590" rx="180" ry="40" fill="rgba(37, 99, 235, 0.15)" filter="url(#cpeNeonGlow)" />
        <ellipse cx="680" cy="550" rx="220" ry="45" fill="rgba(56, 189, 248, 0.12)" filter="url(#cpeNeonGlow)" />
      </g>

      {/* 3D STEPS (Natural stone with dynamic neon lighting) */}
      {steps.map((st) => {
        const isLit = litStepCount >= st.index + 1;
        const isBroken = st.isBroken && !showBridge;

        if (isBroken) {
          // Treacherous fractured gap with crumbling floating rocks
          return (
            <g key={st.index} className="cpe-step-fractured" transform={`translate(${st.x}, ${st.y})`}>
              {/* Left jagged rock shard */}
              <polygon
                points="-42,0 -12,-4 -16,14 -42,16"
                fill="url(#rockGrad)"
                stroke="#ef4444"
                strokeWidth="1.2"
              />
              {/* Right jagged rock shard falling down */}
              <polygon
                points="14,4 42,-2 38,16 18,22"
                fill="url(#rockGrad)"
                stroke="#ef4444"
                strokeWidth="1.2"
                transform="rotate(12, 28, 10)"
              />
              {/* Tiny falling stone pebbles */}
              <circle cx="2" cy="18" r="2.5" fill="#475569" />
              <circle cx="-6" cy="28" r="1.8" fill="#334155" />
              <circle cx="12" cy="34" r="2.2" fill="#475569" />
              {/* Chasm abyss glow */}
              <ellipse cx="0" cy="14" rx="22" ry="5" fill="rgba(239, 68, 68, 0.35)" filter="url(#cpeNeonGlow)" />
            </g>
          );
        }

        return (
          <g key={st.index} className="cpe-step" transform={`translate(${st.x}, ${st.y})`}>
            {/* Step 3D Riser (Front face) */}
            <polygon
              points={`-${st.w / 2},0 ${st.w / 2},0 ${st.w / 2},${st.h} -${st.w / 2},${st.h}`}
              fill={isLit ? '#1e3a8a' : 'url(#stoneRiser)'}
              stroke={isLit ? '#38bdf8' : 'rgba(100, 116, 139, 0.3)'}
              strokeWidth="1"
            />

            {/* Step 3D Tread (Top face) */}
            <polygon
              points={`-${st.w / 2},0 0,-${st.depth} ${st.w / 2},0 0,${st.depth / 2}`}
              fill={isLit ? 'url(#neonCyanTread)' : 'url(#stoneTread)'}
              stroke={isLit ? '#00f0ff' : 'rgba(148, 163, 184, 0.4)'}
              strokeWidth={isLit ? 2.2 : 1}
              filter={isLit ? 'url(#cpeNeonGlow)' : 'none'}
            />

            {/* Crisp Top Bevel Highlight Line */}
            <line
              x1={`-${st.w / 2}`}
              y1="0"
              x2={`${st.w / 2}`}
              y2="0"
              stroke={isLit ? '#ffffff' : 'rgba(255, 255, 255, 0.35)'}
              strokeWidth={isLit ? 1.8 : 0.8}
            />

            {/* Illuminated cyan underglow reflection */}
            {isLit && (
              <ellipse
                cx="0"
                cy={st.h + 2}
                rx={st.w / 2}
                ry="5"
                fill="rgba(0, 240, 255, 0.4)"
                filter="url(#cpeNeonGlow)"
              />
            )}
          </g>
        );
      })}

      {/* =====================================================================
          OBSTACLE 1: LOW MOTIVATION (Step 4, near x=400, y=380)
          Floating jagged rock with glowing low-battery indicator (Panel 2)
          ===================================================================== */}
      {currentScene === 2 && (
        <g className="cpe-obs-motivation" transform="translate(385, 305)">
          {/* Floating dark boulder */}
          <polygon
            points="-45,-25 25,-32 50,5 30,35 -35,30 -52,5"
            fill="url(#rockGrad)"
            stroke="#f43f5e"
            strokeWidth="1.2"
            filter="url(#cpeNeonGlow)"
          />
          {/* Low Motivation Text */}
          <text x="0" y="-8" fill="#fda4af" fontSize="10.5" fontWeight="700" textAnchor="middle" letterSpacing="0.05em">
            Low Motivation
          </text>
          {/* Glowing Red Low-Battery Icon */}
          <g transform="translate(-14, 2)">
            <rect x="0" y="0" width="28" height="14" rx="2.5" fill="#1e293b" stroke="#f43f5e" strokeWidth="1.5" />
            <rect x="28" y="4" width="3" height="6" rx="1" fill="#f43f5e" />
            <rect x="2" y="2" width="7" height="10" rx="1.5" fill="#ef4444" />
          </g>
        </g>
      )}

      {/* =====================================================================
          OBSTACLE 2: LACK OF RESOURCES (Step 5, high above x=480, y=230)
          Floating island with stacked glowing study books (Panel 3)
          ===================================================================== */}
      {currentScene === 2 && (
        <g className="cpe-obs-resources" transform="translate(485, 225)">
          {/* Floating earth / rock shelf */}
          <polygon
            points="-40,25 40,25 25,48 -25,48"
            fill="url(#rockGrad)"
            stroke="#eab308"
            strokeWidth="1"
          />
          {/* Stack of leather-bound glowing study books */}
          <g transform="translate(-20, 5)">
            {/* Book 1 (bottom green) */}
            <rect x="0" y="12" width="42" height="7" rx="1.5" fill="#15803d" stroke="#86efac" strokeWidth="0.8" />
            {/* Book 2 (middle red) */}
            <rect x="2" y="5" width="38" height="7" rx="1.5" fill="#b91c1c" stroke="#fca5a5" strokeWidth="0.8" />
            {/* Book 3 (top blue) */}
            <rect x="5" y="-2" width="32" height="7" rx="1.5" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="0.8" />
            {/* Book 4 (open gold book on top with glowing pages) */}
            <polygon points="12,-4 21,-9 30,-4 28,-2 21,-6 14,-2" fill="#fef08a" filter="url(#cpeGoldGlow)" />
          </g>
          {/* Floating rock badge: "Lack of Resources" with book icon */}
          <g transform="translate(-55, -20)">
            <rect x="-10" y="-10" width="115" height="22" rx="11" fill="url(#hudGlassBg)" stroke="#eab308" strokeWidth="1" />
            <text x="50" y="5" fill="#fef08a" fontSize="10" fontWeight="700" textAnchor="middle" letterSpacing="0.04em">
              Lack of Resources
            </text>
          </g>
        </g>
      )}

      {/* =====================================================================
          OBSTACLE 3: SKILL GAPS (At Step 6 fractured chasm, x=530, y=345)
          Stone sign with gear icon (Panel 4)
          ===================================================================== */}
      {currentScene === 2 && !showBridge && (
        <g className="cpe-obs-skillgap" transform="translate(530, 350)">
          <polygon points="-45,-12 45,-12 40,14 -40,14" fill="url(#rockGrad)" stroke="#ef4444" strokeWidth="1.2" />
          <circle cx="-24" cy="1" r="5" fill="none" stroke="#fca5a5" strokeWidth="1.5" />
          <text x="6" y="5" fill="#fca5a5" fontSize="10.5" fontWeight="700" textAnchor="middle" letterSpacing="0.05em">
            Skill Gaps
          </text>
        </g>
      )}

      {/* =====================================================================
          OBSTACLE 4: UNCERTAINTY (Behind sitting character at Step 3, x=340)
          Conflicting directional signposts: "Uncertainty" & "?" (Panel 5)
          ===================================================================== */}
      {currentScene === 2 && (
        <g className="cpe-obs-uncertainty" transform="translate(325, 340)">
          {/* Wooden post */}
          <rect x="-2" y="-35" width="4" height="45" fill="#334155" stroke="#1e293b" strokeWidth="0.8" />
          {/* Sign pointing left: "Uncertainty" */}
          <polygon points="-42,-28 10,-28 15,-20 10,-12 -42,-12" fill="#1e293b" stroke="#a855f7" strokeWidth="1" />
          <text x="-16" y="-17" fill="#d8b4fe" fontSize="9" fontWeight="700" textAnchor="middle">
            Uncertainty
          </text>
          {/* Sign pointing right: "?" */}
          <polygon points="-5,-42 25,-42 32,-35 25,-28 -5,-28" fill="#1e293b" stroke="#a855f7" strokeWidth="1" />
          <text x="12" y="-32" fill="#d8b4fe" fontSize="10" fontWeight="800" textAnchor="middle">
            ?
          </text>
        </g>
      )}

      {/* =====================================================================
          PERSISTENCE TRANSFORMATION: CYBER BRIDGE (Step 6)
          ===================================================================== */}
      {showBridge && (
        <g className="cpe-cyber-bridge" transform="translate(520, 300)" filter="url(#cpeNeonGlow)">
          <rect
            x="-46"
            y="-10"
            width="92"
            height="22"
            rx="4"
            fill="url(#cyberLattice)"
            stroke="#00f0ff"
            strokeWidth="2"
          />
          <line x1="-46" y1="-10" x2="46" y2="12" stroke="#00f0ff" strokeWidth="1.5" />
          <line x1="-46" y1="12" x2="46" y2="-10" stroke="#00f0ff" strokeWidth="1.5" />
          {/* Glowing border pulse */}
          <rect x="-46" y="-10" width="92" height="22" rx="4" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="5,4" />
        </g>
      )}

      {/* =====================================================================
          PERSISTENCE: HOLOGRAPHIC HUD CARDS (Panel 7 of Reference Image)
          Floating high-tech HUD cards alongside the glowing steps:
          - Personalized Guidance
          - Curated Resources
          - Verified Opportunities
          - Skill Development
          ===================================================================== */}
      {showTransformedObstacles && (
        <g className="cpe-holographic-hud-cards" filter="url(#cpeNeonGlow)">
          {/* Card 1: Personalized Guidance (near Step 2, x=220, y=430) */}
          <g transform="translate(200, 420)">
            <rect x="-65" y="-14" width="130" height="28" rx="6" fill="url(#hudGlassBg)" stroke="#38bdf8" strokeWidth="1.2" />
            <circle cx="-48" cy="0" r="6" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="10" y="4" fill="#e0f2fe" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.04em">
              Personalized Guidance
            </text>
          </g>

          {/* Card 2: Curated Resources (near Step 5, x=450, y=270) */}
          <g transform="translate(460, 270)">
            <rect x="-60" y="-14" width="120" height="28" rx="6" fill="url(#hudGlassBg)" stroke="#38bdf8" strokeWidth="1.2" />
            <rect x="-48" y="-5" width="10" height="10" rx="1.5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="8" y="4" fill="#e0f2fe" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.04em">
              Curated Resources
            </text>
          </g>

          {/* Card 3: Verified Opportunities (near Step 8, x=650, y=170) */}
          <g transform="translate(650, 160)">
            <rect x="-68" y="-14" width="136" height="28" rx="6" fill="url(#hudGlassBg)" stroke="#38bdf8" strokeWidth="1.2" />
            <rect x="-54" y="-5" width="12" height="9" rx="1.5" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="8" y="4" fill="#e0f2fe" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.04em">
              Verified Opportunities
            </text>
          </g>

          {/* Card 4: Skill Development (near Step 9, x=720, y=110) */}
          <g transform="translate(730, 95)">
            <rect x="-62" y="-14" width="124" height="28" rx="6" fill="url(#hudGlassBg)" stroke="#38bdf8" strokeWidth="1.2" />
            <line x1="-50" y1="4" x2="-50" y2="-4" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <line x1="-46" y1="4" x2="-46" y2="-1" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <line x1="-42" y1="4" x2="-42" y2="-6" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <text x="10" y="4" fill="#e0f2fe" fontSize="9.5" fontWeight="700" textAnchor="middle" letterSpacing="0.04em">
              Skill Development
            </text>
          </g>
        </g>
      )}

      {/* =====================================================================
          THE GOLDEN SUMMIT DAIS & "SUCCESS" ARCHED GATEWAY (Panels 1 & 8)
          ===================================================================== */}
      <g className="cpe-summit-gateway" transform="translate(780, 130)">
        {/* Massive Radiant Golden Light Burst Halo */}
        <circle cx="0" cy="-45" r="140" fill="url(#portalGoldAura)" opacity="0.85" />
        <circle cx="0" cy="-45" r="70" fill="url(#portalGoldAura)" opacity="0.95" />

        {/* Sunburst Light Rays Radiating from the Gateway */}
        <g className="cpe-gold-sunburst" opacity="0.55" filter="url(#cpeGoldGlow)">
          <line x1="-120" y1="-45" x2="120" y2="-45" stroke="#fef08a" strokeWidth="2" />
          <line x1="0" y1="-165" x2="0" y2="75" stroke="#fef08a" strokeWidth="2" />
          <line x1="-85" y1="-130" x2="85" y2="40" stroke="#fef08a" strokeWidth="1.5" />
          <line x1="-85" y1="40" x2="85" y2="-130" stroke="#fef08a" strokeWidth="1.5" />
        </g>

        {/* Towering Golden Arched Portal Gateway */}
        {/* Outer Arch Pillar Left */}
        <rect x="-44" y="-80" width="10" height="80" rx="3" fill="#ca8a04" stroke="#fef08a" strokeWidth="1.2" />
        {/* Outer Arch Pillar Right */}
        <rect x="34" y="-80" width="10" height="80" rx="3" fill="#ca8a04" stroke="#fef08a" strokeWidth="1.2" />
        {/* Golden Arch Top Curve */}
        <path
          d="M -44 -80 C -44 -125, 44 -125, 44 -80"
          fill="none"
          stroke="#fde047"
          strokeWidth="10"
          filter="url(#cpeGoldGlow)"
        />
        {/* Inner Arch Glowing Light Core */}
        <path
          d="M -34 -80 C -34 -115, 34 -115, 34 -80 L 34 0 L -34 0 Z"
          fill="url(#portalGoldAura)"
        />

        {/* Circular Golden Stone Summit Dais (Platform) */}
        {/* Riser */}
        <path
          d="M -75 0 C -75 22, 75 22, 75 0 L 75 28 C 75 50, -75 50, -75 28 Z"
          fill="#1c1917"
          stroke="#ca8a04"
          strokeWidth="1.5"
        />
        {/* Tread Top */}
        <ellipse
          cx="0"
          cy="0"
          rx="75"
          ry="22"
          fill="url(#neonCyanTread)"
          stroke="#00f0ff"
          strokeWidth="2.5"
          filter="url(#cpeNeonGlow)"
        />
        {/* Concentric Gold Trim Ring on Dais */}
        <ellipse cx="0" cy="0" rx="52" ry="15" fill="none" stroke="#fde047" strokeWidth="1.5" />

        {/* Radiant "SUCCESS" Emblem above the Arch */}
        <g transform="translate(0, -135)" filter="url(#cpeGoldGlow)">
          <text
            x="0"
            y="0"
            fill="#ffffff"
            fontSize="16"
            fontWeight="900"
            letterSpacing="0.32em"
            textAnchor="middle"
            style={{
              textShadow: '0 0 15px #fef08a, 0 0 30px #eab308, 0 0 50px #ca8a04',
            }}
          >
            SUCCESS
          </text>
        </g>
      </g>
    </g>
  );
}
