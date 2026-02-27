# Mission Control Redesign Plan

## Goal
Rebuild UI toward ClawDash Pro style — polished, professional dashboard feel. Keep all Convex backend unchanged.

## Current Problems
- Sub-agent did a sloppy first pass — needs proper thought
- Mobile nav was broken (too many tabs)
- Layout changes were superficial — didn't actually improve the UX

## Reference
- ClawDash Pro demo: https://mission.clawdash.pro/
- Key patterns to adopt: card-based KPI row, activity feed, status indicators, clean sidebar

---

## Phase 1: Design System Upgrade

### Install shadcn/ui properly
- `npx shadcn-ui@latest init` with our existing tailwind config
- Use their Card, Badge, Button, Tabs, Separator, ScrollArea components
- Replace our hand-rolled card/badge/pill CSS with shadcn equivalents
- Keep our color palette (--bg, --card, --green, etc.) but map to shadcn CSS variables

### Typography
- Keep JetBrains Mono for numbers
- Use Inter for body text (add via next/font, not Google Fonts link)
- Tighten the type scale — current sizes are good

### Icons
- Add lucide-react (comes with shadcn)
- Replace emoji nav icons with proper SVG icons
- Keep emoji for domain-specific content (🌿 ziolo, 🐟 fish days, etc.)

---

## Phase 2: Layout

### Desktop (≥768px)
- Fixed sidebar: 220px, dark (var(--bg-subtle)), border-right
- Sidebar: logo/title at top, nav links with lucide icons, active state with accent bg
- Main content: fluid width, max 1000px, centered with padding
- No top header bar (sidebar handles identity)

### Mobile (<768px)
- No sidebar
- Bottom nav: 4 tabs max (Home, Health, Trading, More)
- "More" opens a slide-up sheet with remaining pages
- Compact page headers

### Shared
- Consistent page padding: 24px horizontal, 32px top
- Cards: 1px border, subtle hover, consistent radius (12px)

---

## Phase 3: Dashboard Home (/)

### KPI Row (top)
4 cards in a row (2x2 on mobile):
1. **HRV** — value + 7-day mini sparkline + trend arrow
2. **Streak** — ziolo days clean + monthly budget fraction
3. **Portfolio** — total equity + 1d % change colored
4. **Level** — TES level + class name + XP bar

### Activity Feed (main area)
Single-column timeline, most recent first:
- Cron job completions (green dot + job name + time ago)
- Cron failures (red dot + job name + error snippet)
- Recent trades (buy/sell pill + symbol + notional)
- New reports (report icon + title + agent)
- Source: merge cronJobs + recentTrades + reports, sort by timestamp

### Right sidebar / below on mobile
- **Today's Meals** — compact: kcal logged/planned + macro bars
- **Positions** — list of active positions with side pills
- **Quick Stats** — body battery, training readiness, sleep score

---

## Phase 4: Individual Pages

### Health (/health)
- Keep metric grid (6 tiles) but use shadcn Cards
- HRV + Sleep charts: consider recharts or keep custom bars but polish them
- Ziolo section: keep as-is, it's good

### Trading (/trading)  
- This page is already the best — equity curves, positions, trade log
- Polish: use shadcn Tabs, consistent card styling
- Keep LightweightChart component

### Meals (/meals)
- Keep the day-card expand pattern — it works well
- Polish: shadcn Cards, cleaner macro bars
- Weekly overview card: keep

### Progress (/progress)
- Level ring: keep (looks good)
- Domain bars: keep
- Streaks + badges: keep

### Reports (/reports)
- Agent filter pills: keep
- Timeline grouping: keep
- Expanded detail view: keep

### Ops (/systems)
- Cron job list with status dots: keep
- Add: token usage section (new Convex table needed? or pull from OpenClaw API?)
- Add: last sync timestamp per data source

---

## Phase 5: New Features (post-polish)

### Token Usage Tab (in Ops or separate)
- Need to capture OpenClaw token usage data
- Monthly spend chart
- Per-model breakdown
- Requires new Convex table + sync script

### System Health
- Cron pipeline health summary
- Data freshness indicators per source (Garmin, TP, Strava)
- Last successful sync times

---

## Implementation Order
1. shadcn/ui setup + design system variables
2. Sidebar + layout shell
3. Bottom nav (4 tabs + More sheet)
4. Dashboard home page (KPI + activity feed)
5. Polish individual pages (headers, cards, spacing)
6. Deploy + iterate

## Rules
- Every change must build clean before moving to next step
- Mobile-first — test at 375px width
- No breaking Convex queries — frontend only
- Commit after each phase
