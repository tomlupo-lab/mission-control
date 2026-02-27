# Mission Control v4 — Redesign Spec

## Design Language
Dark navy UI kit: deep backgrounds, teal (#00E5C8) + purple (#7B61FF) accents, glow effects, teal→purple gradients, pill shapes, JetBrains Mono for numbers.

## Color Palette

### Backgrounds
- Page: `#141929`
- Card: `#1B2036`
- Card elevated: `#242B45`
- Input/field: `#2A3150`
- Sidebar/drawer: `#0F1320`

### Accents
- Primary teal: `#00E5C8` (actions, active, progress, links)
- Teal glow: `#5EFCE8`
- Secondary purple: `#7B61FF` (selected pills, gradients)
- Gradient: `linear-gradient(135deg, #00E5C8, #7B61FF)`

### Text
- Primary: `#FFFFFF`
- Secondary: `#A0A8C8`
- Muted: `#555E7E`
- Highlight: `#00E5C8`

### Semantic
- Positive: `#00E5C8`
- Negative: `#FF6B6B`
- Warning: `#FFB84D`
- Border: `#2E3650`

### Properties
- Card radius: 14px
- Pill radius: 20px
- Button radius: 8px
- Progress: 6px height, 6px radius
- Card shadow: `0 4px 20px rgba(0,0,0,0.3)`
- Active glow: `0 0 12px rgba(0, 229, 200, 0.3)`

---

## Navigation — Option D: Drawer

### Mobile (<768px)
- NO bottom nav bar
- Hamburger (☰) icon fixed top-left (or in top header bar)
- Tap → slide-out drawer from left (overlay + backdrop)
- Drawer: full nav list with lucide icons, active state highlighted
- Swipe-right from left edge also opens drawer
- Close: tap backdrop, swipe left, or tap X

### Desktop (≥768px)
- Fixed sidebar (220px) — always visible
- Same items as drawer
- No hamburger

### Nav Items (both drawer + sidebar)
1. Dashboard (/) — LayoutDashboard
2. Health (/health) — Heart
3. Trading (/trading) — TrendingUp
4. Meals (/meals) — UtensilsCrossed
5. Progress (/progress) — Gamepad2
6. Reports (/reports) — FileText
7. Ops (/systems) — Settings

---

## Screens

### 1. Home / Dashboard (/)
- Top bar: hamburger (mobile) + "Mission Control" gradient text + date
- KPI row: 4 stat cards (2x2 mobile, 4x1 desktop)
  - HRV ms + color
  - Ziolo streak days + month X/Y
  - Portfolio equity + 1d%
  - TES level + class
- Vitals strip: BB · TR · RHR · Sleep — compact horizontal
- Today's Meals card: kcal logged/planned + C/P/F bars → tap /meals
- Active Positions card: position pills → tap /trading
- Ziolo alert: conditional (streak <3d or over budget)

### 2. Health (/health)
- Metric grid 3x2: HRV · RHR · Stress · BB · Steps · TR
- HRV 14d bar chart
- Sleep 14d bar chart
- Ziolo detail: streak + monthly/yearly progress bars

### 3. Trading (/trading)
- Summary row 3 cards: equity · 1D P&L · positions
- Strategy cards (tabbed Live/Paper): equity curve + positions + returns + risk
- Trade log timeline

### 4. Meals (/meals)
- Weekly overview: avg macros plan vs actual
- 7 day cards: expandable with logged + planned meals

### 5. Progress (/progress)
- Level ring with class
- 6 domain bars
- Streaks grid
- Weed-free big number + budgets
- Badges

### 6. Reports (/reports)
- Agent filter pills
- Date-grouped timeline, tap to expand

### 7. Ops (/systems)
- Quick stats: jobs healthy X/Y, total crons
- Last sync timestamp
- Cron job list with status dots

---

## Component Library: shadcn/ui + Recharts

### shadcn/ui components to install:
- Card (stat cards, info cards, all containers)
- Button (actions, nav triggers)
- Badge (pills, status indicators)
- Sheet (mobile drawer nav!)
- Tabs (trading Live/Paper, report filters)
- Progress (health bars, macro bars, ziolo budgets)
- DropdownMenu (filters, options)
- Separator (section dividers)
- Tooltip (metric explanations)
- Toggle (future: settings)

### Recharts for data viz:
- AreaChart (equity curves — replace LightweightChart)
- BarChart (HRV 14d, sleep 14d)
- LineChart (trends)
- ResponsiveContainer (auto-sizing)

### Theme: wire navy/teal/purple palette into shadcn CSS variables
Map our vars to shadcn's expected vars (--background, --card, --primary, --secondary, etc.)

## Implementation Order
1. Install shadcn/ui + recharts, configure tailwind + theme
2. globals.css — new palette mapped to shadcn CSS vars
3. layout.tsx — Sheet-based drawer nav (mobile), sidebar (desktop)
4. Delete BottomNav.tsx, rewrite Sidebar.tsx
5. Rebuild page.tsx dashboard with shadcn Card + Recharts
6. Rebuild health page — Recharts BarChart for HRV/sleep
7. Rebuild trading page — Recharts AreaChart for equity curves
8. Restyle meals, progress, reports, ops with shadcn components
9. Build + push to GitHub
