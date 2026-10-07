# CareerPilot AI — "Mission Control" Design Language System
**Design Manifesto & Engineering Specification**
*Version 2.0 • Top-Tier Product Engineering & Design System*

---

## 1. Concept & Metaphor: "Mission Control for Your Career"

Generic student platforms look like static forms or basic SaaS templates: flat grey backgrounds, centered 3-card rows, generic indigo buttons, and static tables. 

**CareerPilot AI treats a student's career as an interstellar trajectory.** 
The user is not merely browsing a job board; they are at the helm of a flight deck with radar sweeps, orbital waypoints, velocity meters, and real-time guidance telemetry.

### Core Visual Motifs
- **Radar Sweeps & Waypoints:** Scanning radars uncover opportunities; circular progress rings depict orbital trajectory toward dream roles.
- **Constellation Graphs:** Skills and opportunities are interconnected stellar nodes connected by light paths.
- **Flight-Deck Telemetry:** Monospace coordinates, live countdown tickers, real-time pulse indicators, and status telemetry.
- **Glassmorphic HUD (Heads-Up Display):** Layered translucent viewports with hairline borders (`1px solid rgba(255, 255, 255, 0.08)`), deep atmospheric blurs (`backdrop-filter: blur(16px)`), and subtle ambient grain.

---

## 2. Signature Color Palette & Semantic Tokens

Departing from generic single-hue palettes, CareerPilot AI uses a **3-color celestial accent system** balanced on an **Obsidian Deep Space** neutral continuum:

### A. The 3 Celestial Accents
1. **Pulsar Cyan (`#00F2FE` / `#06B6D4` / HSL: 185, 100%, 50%)**
   - *Meaning:* Navigational beacon, high match probability (>=85%), discovery radars, active searchlights.
   - *Tokens:* `--accent-cyan`, `--cyan-glow`, `--match-high`.
2. **Solar Flare Amber (`#F59E0B` / `#FFB703` / HSL: 38, 92%, 50%)**
   - *Meaning:* Urgency, real-time deadlines ("closing in 2d"), active burn/focus, telemetry alerts.
   - *Tokens:* `--accent-amber`, `--amber-glow`, `--badge-deadline`.
3. **Quantum Violet (`#8B5CF6` / `#A855F7` / HSL: 262, 83%, 58%)**
   - *Meaning:* AI Intelligence, resume machine learning, neural skill mastery, orbital paths.
   - *Tokens:* `--accent-violet`, `--violet-glow`, `--ai-core`.

### B. Neutral Obsidian Scale
- `--space-black`: `#06090F` (True void background)
- `--space-slate`: `#0A0F1D` (Sunken cockpit well)
- `--surface-cockpit`: `#0F172A` (HUD primary card surface)
- `--surface-raised`: `#151E34` (Elevated telemetry module)
- `--surface-hover`: `#1E2B4A` (Active hover highlight)
- `--border-hairline`: `rgba(255, 255, 255, 0.08)`
- `--border-glow`: `rgba(0, 242, 254, 0.35)`

### C. 4 Dynamic Themes
- **Deep Space Obsidian (Default dark):** Precision telemetry, dark flight deck.
- **Solar Daybreak (Light mode):** High-contrast clean studio daylight, crisp borders and subtle warm amber accents.
- **Neon Hyperdrive (Cyberpunk):** Ultra-vibrant laser cyan and hot magenta accents.
- **Aurora Matrix (Emerald):** Luminescent emerald and teal space radiation.

---

## 3. Typography Hierarchy & Fluid Scale

Combining three distinct typographic personalities:
1. **Display Face:** `Space Grotesk` — expressive, mechanical, geometric display font for hero headlines, major section headings, and metrics.
2. **UI Face:** `Inter` — hyper-legible, micro-tuned neutral font for navigation, inputs, card bodies, descriptions, and buttons.
3. **Telemetry/Data Face:** `JetBrains Mono` / monospace — for match percentages, countdown timers, salary figures, status codes, and radar metrics.

### Fluid Type Scale (`clamp()`)
- **Display 1 (Hero Title):** `clamp(2.5rem, 6vw + 1rem, 4.75rem)` — `line-height: 1.05`, `letter-spacing: -0.04em`
- **Heading 1:** `clamp(1.75rem, 3.5vw + 0.5rem, 2.75rem)` — `line-height: 1.15`
- **Heading 2:** `clamp(1.25rem, 2vw + 0.5rem, 1.85rem)` — `line-height: 1.25`
- **Heading 3:** `clamp(1.1rem, 1.5vw + 0.25rem, 1.4rem)` — `line-height: 1.3`
- **Body Large:** `1.125rem` (18px)
- **Body Base:** `0.9375rem` (15px)
- **Body Small:** `0.8125rem` (13px)
- **Telemetry Mono:** `0.75rem` / `0.875rem` with `font-variant-numeric: tabular-nums`

---

## 4. Shape Language, Surface Depth & Textures

- **Hairline Borders:** `1px solid rgba(255, 255, 255, 0.08)` creates crisp structural lines reminiscent of cockpit instrument panels.
- **Surface Elevation:**
  - Level 0: Cockpit background (`#06090F`)
  - Level 1: Ground cards with top specular highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.07)`)
  - Level 2: Raised interactive widgets (`box-shadow: 0 12px 36px -8px rgba(0,0,0,0.6)`)
  - Level 3: Overlays, Modals & Floating AI Orb HUD (`box-shadow: 0 24px 64px -12px rgba(0,0,0,0.85)`)
- **Conic-Gradient Beams:** Animated border glows that rotate along card perimeters for featured opportunities and primary CTAs.
- **Subtle Film Grain:** Ambient noise texture overlay giving tactility and eliminating digital flatness.

---

## 5. Animation Philosophy & Physics System (`src/motion/`)

- **Transform & Opacity Only:** 60fps guaranteed; no layout-reflow inducing animations.
- **Physical Springs:**
  - Snappy: `type: "spring", stiffness: 400, damping: 28` (Buttons, toggles, badges)
  - Smooth: `type: "spring", stiffness: 220, damping: 24` (Cards, drawers, modals)
  - Gentle: `type: "spring", stiffness: 100, damping: 18` (Floating ambient elements, orb breathing)
- **Reduced-Motion Safe:** `useReducedMotionSafe()` automatically disables heavy 3D and parallax translations while maintaining instant, accessible state updates.

---

## 6. Signature Moments Across Every Screen

| Screen | Signature Moment |
|---|---|
| **Landing** | Interactive 3D/particle "Career Constellation" (orbiting opportunity nodes responding to cursor/gyroscope) + Scroll-Linked Waypoint Journey |
| **Dashboard** | Asymmetric Bento Grid with draggable widgets, animated match telemetry rings, real-time streak sparklines |
| **Opportunities** | Live feed ticker with "N new" pill, physics-driven Swipe Deck, shared-element card-to-drawer transitions |
| **Tracker** | Drag-and-drop Kanban with optimistic updates, deadline trajectory countdown, and offer celebration confetti |
| **Resume Analyzer** | High-precision scanning radar beam with real-time OCR telemetry & needle-physics score gauge |
| **Skill Gap** | Interactive radar chart morphing between target roles with skill deficit delta paths |
| **AI Advisor** | Living holographic AI Orb with 4 dynamic physical states (Idle, Listening, Thinking, Speaking) + token streaming |
| **Design System** | Interactive living component laboratory with live token inspector and animation playground |

---

## 7. Mobile-First Ergonomics

- **Thumb-Zone Architecture:** Bottom tab navigation with floating AI launcher within thumb reach.
- **Adaptive Modals:** Modals seamlessly transform into native-feeling swipeable bottom sheets (`BottomSheet`) on mobile viewports.
- **Tactile Feedback & Haptics:** Micro-vibrations (`navigator.vibrate`) on card swipes, bookmarking, and drag drops.
- **Safe Area Insets:** Strict observance of `env(safe-area-inset-bottom)` and dynamic `100dvh` viewport calculations.
