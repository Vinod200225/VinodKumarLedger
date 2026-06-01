# Ledger — Personal Finance Tracker
## Project Summary

A dual-view personal finance PWA (Progressive Web App) with two password-protected accounting modes, bidirectional Google Sheets sync, iOS installability, and full personal finance tracking including loans, budgets, salary planning, calendar reminders, and future projections.

---

## The Core Idea

One URL. One username. Two passwords.

- **Password A** → "Public" view (shows lower declared salary, sanitized financials — safe to show anyone)
- **Password B** → "Real" view (actual salary, actual debts, true financial picture — private)

Each view syncs with its own separate Google Sheet, bidirectionally in real time.

---

## Why This Exists

- Current situation: ~₹2,00,000 in loans across multiple apps and sources
- June = last month at current company
- July = June salary received + joins new company at ~1.8x salary jump
- Goal: **Clear all debt by January 2026**
- From January 2026: shift mode to structured savings/investment split
- Need to track this privately (real view) while having a "presentable" version for others (fake/public view)

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React + Vite | Fast, modern, PWA-ready |
| Styling | Tailwind CSS + shadcn/ui | Clean, responsive, no design system needed |
| Charts | Recharts | Lightweight, composable |
| Hosting | GitHub Pages | Free, public URL |
| Database | Google Sheets API v4 | No backend needed, familiar format |
| Auth | SHA-256 client-side | Single-user, no server required |
| iOS App | PWA manifest + Service Worker | Install via Safari "Add to Home Screen" |
| Notifications | Web Push / Service Worker | Calendar reminders |

---

## Architecture

```
/src
  /auth          → Login screen, password routing logic
  /views
    /public      → Fake/public accounting view
    /real        → Real/private accounting view
  /components
    /dashboard   → Summary cards, net worth snapshot
    /loans       → Loan tracker, EMI table, payoff timeline
    /budget      → Monthly budget planner, salary split
    /calendar    → Reminders (LIC, insurance, birthdays, functions)
    /projection  → Future financial graphs, debt-free countdown
    /shared      → Charts, modals, inputs, nav
  /services
    /sheets      → Google Sheets API read/write
    /sync        → Bidirectional sync logic
    /notifications → Service worker reminder triggers
  /config
    /routes.js   → Password-to-view routing
    /constants.js → Loan categories, split percentages
/public
  manifest.json  → PWA metadata
  sw.js          → Service worker
CLAUDE.md        → This file (AI coding context)
.env.example     → Required env vars (never commit real .env)
```

---

## Features — Both Views

### Dashboard
- Net worth snapshot (assets vs liabilities)
- Monthly cash flow summary
- Quick-add transaction button
- Sync status indicator (Google Sheets last synced)

### Loan Tracker
- List all active loans with: lender name, total amount, amount paid, remaining, EMI, due date
- Color-coded health (green = on track, yellow = due soon, red = overdue)
- Per-loan payoff projection chart
- Mark as paid, edit, delete

### Budget Planner
- Monthly income input
- Category-wise expense allocation (percentage + absolute)
- Actual vs budgeted comparison
- Salary split template (different % for real vs public view)

### Calendar & Reminders
- Annual commitments: LIC premium, Health Insurance renewal
- Monthly EMI due dates
- Birthdays and family events with average budget allotment
- Push notification reminders (3 days before, day-of)

### Financial Projection
- Month-by-month debt payoff timeline
- Debt-free date countdown (target: Jan 2026)
- Post-debt savings projection
- What-if simulator (extra payment → faster payoff)

### Google Sheets Sync
- Read on app load (pull latest from sheet)
- Write on every data change (push to sheet)
- Conflict resolution: app data wins on conflict (last-write)
- Manual "Sync Now" button

---

## Features — Real View Only

- Actual salary figures (current + post-July 1.8x)
- True loan amounts across all sources
- Private savings goals
- Real split plan post-Jan 2026 (e.g., 40% invest, 20% save, 20% lifestyle, 20% family)
- Hidden from public view entirely

## Features — Public View Only

- Adjusted/lower declared salary
- Fewer or smaller loan entries
- Conservative budget ratios
- Presentable to family, friends, or anyone with the link

---

## Google Sheets Structure

### Real Sheet (private, credentials in .env)
```
Tab 1: Transactions     → Date, Category, Amount, Note, Type (income/expense)
Tab 2: Loans            → Name, Principal, Paid, EMI, DueDate, Source, Status
Tab 3: Budget           → Month, Category, Budgeted, Actual
Tab 4: Reminders        → Title, Date, Recurrence, Amount, Notes
Tab 5: Config           → Salary, SplitRules, GoalDate
```

### Public Sheet (sanitized, separate credentials)
```
Same structure, different data
```

---

## Auth Logic

```js
// On login
const hash = sha256(password)
if (hash === PUBLIC_HASH)  → route to /public-view
if (hash === REAL_HASH)    → route to /real-view
else                       → show error
```

Password hashes stored in `.env` (injected at build time via GitHub Actions secrets — never in public code).

---

## iOS PWA Install Instructions (for user)

1. Open the GitHub Pages URL in **Safari** on iPhone
2. Tap the **Share** button (box with arrow)
3. Tap **"Add to Home Screen"**
4. Name it (e.g., "Finance") → tap **Add**
5. App icon appears on home screen, opens fullscreen like a native app

---

## Environment Variables Required

```env
VITE_PUBLIC_SHEET_ID=your_public_google_sheet_id
VITE_PUBLIC_SHEET_API_KEY=your_api_key_for_public_sheet
VITE_REAL_SHEET_ID=your_real_google_sheet_id
VITE_REAL_SHEET_API_KEY=your_api_key_for_real_sheet
VITE_PUBLIC_PASSWORD_HASH=sha256_of_public_password
VITE_REAL_PASSWORD_HASH=sha256_of_real_password
```

Never commit `.env`. Add to GitHub Secrets for CI/CD build.

---

## Build & Deploy

```bash
npm install
npm run dev          # local development
npm run build        # production build
npm run deploy       # deploys to GitHub Pages (gh-pages branch)
```

---

## Current Financial Context (seed data)

- Total debt: ~₹2,00,000 across multiple sources (loan apps, personal loans)
- Current salary: X (to be filled in real sheet)
- Post-July salary: ~1.8x current
- Debt-free target: January 2026
- Post-debt split plan (real): TBD by user
- Post-debt split plan (public): Adjusted version of above

---
