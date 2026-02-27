# VibeFit — Implementation Plan & Progress Tracker

> **Status:** 🚧 IN PROGRESS — Phase 3 ✅ + Phase 4.1 ✅ + Phase 4.2 ✅ + Phase 4.5 ✅ + Phase 5.1 ✅ — pushed to GitHub  
> **Last Updated:** 2026-02-22  
> **Framework:** Jobs-to-Be-Done (JTBD) × Entity State Machines  
> **Architecture:** pnpm Monorepo → `@vibefit/{shared,ui,core,api,web,ml,agent}`

---

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 routines, basic tracking, exercise library, streaks |
| Pro | $9.99/mo | Unlimited routines, AI coach, advanced analytics, 3 streak freezes/week, premium exercises |
| Coach | $29.99/mo | Create & sell programs, client management, revenue share |
| Enterprise | Custom | Org accounts, SSO, team challenges, admin dashboards |

---

## 7 Core Jobs-to-Be-Done

| # | Job Statement | Key Metric |
|---|--------------|------------|
| J1 | Help me **start** without being an expert | Onboarding completion > 85% |
| J2 | Help me know **exactly what to do** today | Daily active engagement > 65% |
| J3 | Help me **perform exercises correctly** and safely | Exercise completion > 90% |
| J4 | Help me **see my efforts are paying off** | Week-2 retention > 70% |
| J5 | Help me **stay motivated** when discipline fades | 30-day retention > 55% |
| J6 | Help me **adapt** when life changes | Routine modification < churn |
| J7 | Help me **understand my body** like a pro | Premium conversion > 8% |

---

## Universal Entity State Machine

Every data-driven view implements ALL 8 states:

```
INITIAL → LOADING → LOADED (data) / EMPTY (no data) / ERROR (failed)
LOADED → STALE (after 5min) → bg refresh → LOADED
ANY → OFFLINE (no network) → show cached + banner → LOADING (on reconnect)
ERROR → retry (exp backoff: 1s→2s→4s, max 3) → LOADING
```

| State | UX | Interaction |
|-------|-----|-------------|
| Initial | Skeleton shimmer | Disabled |
| Loading | Skeleton → progressive reveal | Cancel for long ops |
| Loaded | Full content + entrance animation | All enabled |
| Empty | Illustration + guidance + CTA | "Create first X" / "Adjust filters" |
| Error | Error card + retry button | Retry with backoff |
| Partial | Content + "Load more" sentinel | Infinite scroll |
| Stale | "Updated 5m ago" banner | Tap to refresh |
| Offline | Cached data + bottom banner | Read-only, queue writes |

---

## Phase 0: Foundation ← CURRENT

| # | Task | Status | Depends | Verification |
|---|------|--------|---------|-------------|
| 0.1 | Monorepo scaffold (pnpm workspaces, 7 packages, tsconfigs, ESLint, Vitest) | ✅ | — | `pnpm install && pnpm -r build` |
| 0.2 | Pulse design system (`@vibefit/ui` — tokens, Radix primitives, 15+ components) | ✅ | 0.1 | 11 components + tokens, all build clean |
| 0.3 | PostgreSQL schema + Drizzle ORM (16 tables, pgvector, migrations, seed) | ✅ | 0.1 | Schema + seed script + GymVerse data |
| 0.4 | Auth system (JWT + refresh, bcrypt, rate limiting, Zod validation) | ✅ | 0.1 | DB-wired auth with refresh rotation |
| 0.5 | API scaffolding (Express + Zod + error handler + logging + health check) | ✅ | 0.3,0.4 | All routes wired to DB |

## Phase 1: Core Loop (JTBD 1–3)

| # | Task | Status | Depends | Verification |
|---|------|--------|---------|-------------|
| 1.1 | Onboarding wizard (7 steps, per-step persistence, profile creation) | ✅ | 0.2,0.5 | Profile API + Redux + 7-step wizard + redirect |
| 1.2 | Exercise library (debounced search, URL-synced filters, skeleton, pagination) | ✅ | 0.2,0.5 | Filter → URL → refresh preserves |
| 1.3 | Routine builder (7-step wizard, multi-week, progressive overload, editing) | ✅ | 0.5,1.2 | Generated routine has progressive overload |
| 1.4 | Routine management (calendar view, deep-link, delete confirm, duplicate) | ✅ | 0.5,1.3 | Duplicate + start workout + action buttons |
| 1.5 | Workout execution (full-screen, set logging, rest timer, swap, auto-save) | ✅ | 0.2,0.5,1.3 | API + Redux + execution page + rest timer + RPE/mood |
| 1.6 | Cardio tracking (timer modes, effort logging, Surprise Me upgrade) | ✅ | 0.2,0.5 | Library + detail + search/filter |
| 1.7 | Dashboard (today's workout, streak, weekly progress, muscle map) | ✅ | 0.5,1.5 | Real workout data + onboarding redirect + quick actions |

## Phase 2: Retention Engine (JTBD 4–5)

| # | Task | Status | Depends | Verification |
|---|------|--------|---------|-------------|
| 2.1 | Streak system (active tracking, freeze, milestones, recovery) | ✅ | 1.5 | API + Redux + dashboard widget + freeze button |
| 2.2 | Achievement engine (50+ achievements, unlock animations, progress) | ✅ | 1.5,2.1 | Auto-check on workout complete + toast + page |
| 2.3 | Personal records (auto-detect PRs, toast, PR board, history) | ✅ | 1.5 | Auto-detect on set log + toast + mastery tracking |
| 2.4 | Progress analytics (volume charts, strength curves, balance radar) | ✅ | 1.5,2.3 | Summary cards + weekly bar chart + top exercises |
| 2.5 | Weekly/monthly recaps (auto summary, AI insights, shareable cards) | ✅ | 2.4 | Weekly/monthly tabs + stats + achievements list |
| 2.6 | Toast & notification system (stacking, auto-dismiss, preferences) | ✅ | 0.2 | 6 types + slide-in + auto-dismiss + cap 5 |

## Phase 3: Intelligence Layer (JTBD 6–7)

| # | Task | Status | Depends | Verification |
|---|------|--------|---------|-------------|
| 3.1 | Biomechanical substitution (joint stress, injury-aware, pgvector similarity) | ✅ | 0.3,1.2 | Scoring engine + injury-aware + API endpoint |
| 3.2 | Adaptive difficulty (RPE-based, auto-deload, performance trends) | ✅ | 1.5,2.4 | 3 hard sessions → deload suggestion |
| 3.3 | LSTM adherence prediction (TF.js, motivation interventions) | ✅ | 1.5,2.1 | >70% accuracy after 4 weeks |
| 3.4 | Form cue engine (movement-pattern coaching, injury risk tips) | ✅ | 1.2,3.1 | Phase-based cues + contextual tips + API endpoint |
| 3.5 | AI coach (CascadeFlow: Ollama/Claude, personality, context-aware) | ✅ | 0.5,2.4 | Ask about plateau → references user data |

## Phase 4: Social & Platform

| # | Task | Status | Depends | Verification |
|---|------|--------|---------|-------------|
| 4.1 | Social feed (follow, shares, kudos, comments, privacy) | ✅ | 0.4,1.5 | Share → follower feed → kudos |
| 4.2 | Community challenges (leaderboards, seasonal events, H2H) | ✅ | 2.2,4.1 | Join → daily progress → leaderboard |
| 4.3 | WhatsApp/Telegram bot (reminders, quick-log, motivation) | ⬜ | 0.5,2.1 | Send "Bench 185 10" → logs set |
| 4.4 | Wearable integration (Apple Health, Google Fit, Garmin) | ⬜ | 1.5,2.4 | Import sleep → difficulty adjusts |
| 4.5 | PWA + offline (SW, IndexedDB, install prompt, push) | ✅ | 1.5 | Offline workout → sync on reconnect |

## Phase 5: Scale & Monetize

| # | Task | Status | Depends | Verification |
|---|------|--------|---------|-------------|
| 5.1 | Premium tier (Stripe, feature gating, 7-day trial) | ✅ | 0.4,3.5 | Subscribe → unlock → cancel → downgrade |
| 5.2 | Coach marketplace (trainer programs, revenue share, reviews) | ⬜ | 1.3,4.1 | Upload program → purchase → populates |
| 5.3 | Enterprise B2B (org accounts, SSO, team challenges, admin) | ⬜ | 4.2,5.1 | Org → invite → team challenge → admin |
| 5.4 | Agentic infrastructure (Lobster workflows, task queue) | ⬜ | 3.1-3.5 | Workflow: profile → routine → biomech → predict |

---

## Design System: "Pulse"

### Color Tokens
```
--pulse-bg-primary: #050505     --pulse-green-500: #9EFD38
--pulse-bg-elevated: #111111    --pulse-green-600: #7acc2d
--pulse-bg-surface: #0d0d0d    --pulse-gold-500: #C9A96E
--pulse-bg-interactive: #1a1a1a --pulse-red-500: #ff4444
--pulse-text-primary: #f0f0f0  --pulse-amber-500: #ffaa00
--pulse-text-secondary: #8a8a8a --pulse-blue-500: #4488ff
--pulse-text-muted: #555555
```

### Typography (Inter)
| Name | Size/Line | Weight | Use |
|------|-----------|--------|-----|
| Display | 48/56px | 800 | Hero |
| H1 | 32/40px | 700 | Page titles |
| H2 | 24/32px | 600 | Sections |
| H3 | 20/28px | 600 | Card titles |
| Body | 16/24px | 400 | Content |
| Caption | 14/20px | 400 | Metadata |
| Micro | 12/16px | 500 | Badges |

### Breakpoints
```
$mobile: 480px  $tablet: 768px  $desktop: 1024px  $wide: 1280px
```

### Component Library (Radix UI + Framer Motion)
Button, Input, Select, Slider, Toggle, Checkbox, Card, Modal, Sheet, Drawer,
Toast, Skeleton, EmptyState, ErrorState, OfflineBanner, ProgressBar, ProgressRing,
Streak, Badge, BodyMap, Chart

---

## Accessibility Contract (WCAG 2.2 AA)

- [x] Focus visible (2px green outline, 2px offset)
- [x] Focus trapping in modals/drawers
- [x] Focus restoration on close
- [x] All elements keyboard-accessible
- [x] Skip-to-content link
- [x] ARIA live regions for dynamic content
- [x] Semantic landmarks
- [x] Color-independent indicators
- [x] Touch targets min 44×44px (48×48px workout mode)
- [x] Screen reader announcements
- [x] Alt text on content images
- [x] Form labels (no placeholder-only)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Frontend | React 18, TypeScript 5.6, Vite 5 |
| Desktop | Electrobun |
| Design | Radix UI, Framer Motion, CSS Custom Properties |
| Backend | Express 5, TypeScript, Zod |
| Database | PostgreSQL 16 + pgvector |
| ORM | Drizzle ORM |
| Auth | JWT + refresh, bcrypt, Passport.js |
| ML | TensorFlow.js (LSTM) |
| AI | CascadeFlow (Ollama + Claude/Gemini) |
| Agents | Lobster workflow engine |
| Testing | Vitest, Testing Library, Playwright |
| Config | Pkl (type-safe config) |
| Logging | pino |

---

## GymVerse Assets to Migrate

| Asset | Source | Action |
|-------|--------|--------|
| 64 exercises | `exercises.json` | Import to PG + add biomech_tags, embeddings |
| 37 cardio | `cardio.json` | Import to PG + add effort fields |
| Design tokens | `_variables.scss` | Port to CSS custom properties |
| GoalConfig | `routineGenerator.ts` | Extend with progressive overload |
| Day templates | `routineGenerator.ts` | Keep pattern, add periodization |
| Exercise crossfade | `ExerciseAnimDemo.tsx` | Port to `@vibefit/ui` |
| Page transitions | `PageTransition.tsx` | Port with `filter: 'none'` fix |
| Wizard pattern | `RoutineBuilder.tsx` | Extend to 7 steps with persistence |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-21 | Radix UI over Shadcn/ui | Need unstyled primitives for Pulse; Shadcn couples to Tailwind |
| 2026-02-21 | Recharts for charts | Lightweight, composable, no Canvas (Electrobun compat) |
| 2026-02-21 | PWA before native mobile | Covers mobile; native is Phase 6+ based on traction |
| 2026-02-21 | CascadeFlow LLM routing | Ollama handles 80% (free), cloud 20% (Pro) |
| 2026-02-21 | Linear overload for beginners | 2.5lb/wk upper, 5lb/wk lower |
| 2026-02-21 | Streak freeze: 1/wk free, 3/wk Pro | Balance accessibility with monetization |
