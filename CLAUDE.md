# CLAUDE.md — Ledger Finance App

> This file is the AI coding context for Claude Code (VS Code extension).
> Place this file in the root of your project folder before starting any session.
> Claude will read this automatically and understand the full project.

---

## Project Name
**Ledger** — Personal Finance PWA

## One-Line Description
A React PWA hosted on GitHub Pages with two password-protected finance accounts, bidirectional Google Sheets sync, loan tracking, budget planning, calendar reminders, and iOS installability.

---

## Stack

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **Charts:** Recharts
- **Routing:** React Router v6
- **Auth:** SHA-256 client-side password hashing (crypto.subtle)
- **Data:** Google Sheets API v4 (REST, no backend)
- **Hosting:** GitHub Pages via `gh-pages` npm package
- **PWA:** Vite PWA plugin (vite-plugin-pwa), Web Push API
- **State:** React Context + useReducer (no Redux needed)
- **Notifications:** Service Worker + Notification API

---

## Project Structure

```
/
├── public/
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons (192x192, 512x512)
├── src/
│   ├── main.jsx               # App entry
│   ├── App.jsx                # Root router
│   ├── auth/
│   │   ├── LoginScreen.jsx    # Login UI
│   │   ├── useAuth.js         # Auth hook, password routing
│   │   └── hashPassword.js    # SHA-256 util
│   ├── views/
│   │   ├── PublicView.jsx     # Shell for public/fake accounting
│   │   └── RealView.jsx       # Shell for real/private accounting
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── NetWorthCard.jsx
│   │   │   └── CashFlowSummary.jsx
│   │   ├── loans/
│   │   │   ├── LoanTracker.jsx
│   │   │   ├── LoanCard.jsx
│   │   │   ├── LoanForm.jsx
│   │   │   └── PayoffChart.jsx
│   │   ├── budget/
│   │   │   ├── BudgetPlanner.jsx
│   │   │   ├── SalarySplitEditor.jsx
│   │   │   └── BudgetVsActualChart.jsx
│   │   ├── calendar/
│   │   │   ├── ReminderCalendar.jsx
│   │   │   ├── ReminderForm.jsx
│   │   │   └── UpcomingReminders.jsx
│   │   ├── projection/
│   │   │   ├── FinancialProjection.jsx
│   │   │   ├── DebtFreeCountdown.jsx
│   │   │   └── WhatIfSimulator.jsx
│   │   └── shared/
│   │       ├── Layout.jsx
│   │       ├── Nav.jsx
│   │       ├── SyncStatusBadge.jsx
│   │       ├── Modal.jsx
│   │       └── LoadingSpinner.jsx
│   ├── services/
│   │   ├── sheets.js          # Google Sheets API read/write
│   │   ├── sync.js            # Bidirectional sync logic
│   │   └── notifications.js   # Push notification scheduling
│   ├── context/
│   │   ├── AppContext.jsx     # Global state (transactions, loans, budget)
│   │   └── SyncContext.jsx    # Sync state and triggers
│   └── config/
│       ├── constants.js       # Loan categories, reminder types
│       └── splitDefaults.js   # Default salary split percentages
├── .env.example               # Required env vars (never commit .env)
├── .env                       # Local secrets — GITIGNORED
├── .gitignore
├── vite.config.js
├── tailwind.config.js
├── index.html
├── package.json
└── CLAUDE.md                  # This file
```

---

## Key Files Explained

| File | Purpose |
|---|---|
| `src/auth/LoginScreen.jsx` | Single login screen. Username field (cosmetic) + password field. On submit, hashes password, compares to env vars, routes to correct view |
| `src/auth/hashPassword.js` | Uses `crypto.subtle.digest('SHA-256', ...)` — no library needed |
| `src/services/sheets.js` | All Google Sheets API calls. `readSheet(tab)` and `writeSheet(tab, data)` functions. Uses different credentials based on active view (public vs real) |
| `src/services/sync.js` | Pulls on app load, pushes on every state change with 1s debounce |
| `src/context/AppContext.jsx` | Holds all finance data: transactions[], loans[], budget{}, reminders[]. Provides dispatch actions |
| `src/views/PublicView.jsx` | Wraps all components with public sheet credentials injected via context |
| `src/views/RealView.jsx` | Same but with real sheet credentials |

---

## Auth Flow

```
User enters password
  → sha256(password)
  → compare to import.meta.env.VITE_PUBLIC_PASSWORD_HASH
      → match → navigate('/public')
  → compare to import.meta.env.VITE_REAL_PASSWORD_HASH
      → match → navigate('/real')
  → no match → show "Incorrect password" error
```

Password hashes are injected at **build time** from GitHub Secrets. They are never in source code.

---

## Google Sheets API Pattern

```js
// sheets.js
const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

export async function readSheet(sheetId, apiKey, tab) {
  const res = await fetch(`${BASE}/${sheetId}/values/${tab}?key=${apiKey}`)
  const data = await res.json()
  return data.values // 2D array
}

export async function writeSheet(sheetId, oauthToken, tab, values) {
  await fetch(`${BASE}/${sheetId}/values/${tab}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${oauthToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values })
  })
}
```

Note: Reading uses API key (public). Writing requires OAuth 2.0 token (user must authorize once via Google sign-in popup on first use).

---

## Google Sheets Tab Structure

Each sheet (public + real) has these tabs:

| Tab Name | Columns |
|---|---|
| `Transactions` | Date, Category, Amount, Note, Type (income/expense) |
| `Loans` | Name, Principal, AmountPaid, EMI, DueDate, Source, Status |
| `Budget` | Month, Category, Budgeted, Actual |
| `Reminders` | Title, Date, RecurrenceType, Amount, Notes |
| `Config` | Key, Value (salary, split rules, goal date, etc.) |

---

## Environment Variables

```env
# .env.example — copy to .env and fill in values

VITE_PUBLIC_SHEET_ID=
VITE_PUBLIC_SHEET_API_KEY=
VITE_REAL_SHEET_ID=
VITE_REAL_SHEET_API_KEY=
VITE_PUBLIC_PASSWORD_HASH=
VITE_REAL_PASSWORD_HASH=
```

To generate a password hash for `.env`:
```js
// Run in browser console
const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
console.log(hash)
```

---

## PWA Setup

`vite.config.js` uses `vite-plugin-pwa` with:
- `registerType: 'autoUpdate'`
- `manifest` inline (name, icons, theme_color, display: 'standalone')
- `workbox` caching for offline support

`public/manifest.json`:
```json
{
  "name": "Ledger",
  "short_name": "Finance",
  "display": "standalone",
  "start_url": "/",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Deploy to GitHub Pages

```json
// package.json scripts
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/ledger",
"predeploy": "npm run build",
"deploy": "gh-pages -d dist"
```

GitHub Actions `.github/workflows/deploy.yml` injects secrets as env vars during build.

---

## Coding Conventions

- **Components:** Functional, hooks only. No class components.
- **Naming:** PascalCase for components, camelCase for hooks/utils
- **Tailwind:** Utility classes only. No custom CSS unless absolutely needed.
- **State:** All finance data lives in `AppContext`. Local UI state (modals, form inputs) lives in component.
- **Sheets sync:** Always debounce writes by 1000ms. Never write on every keystroke.
- **Error handling:** All API calls wrapped in try/catch. Show user-friendly toast on failure.
- **Formatting:** Amounts always in ₹ with `toLocaleString('en-IN')` formatting.

---

## Current Financial Seed Data (for development/testing)

Use this as mock data when building — replace with real Google Sheets data in production:

```js
// Mock loans for development
const mockLoans = [
  { id: 1, name: 'Loan App A', principal: 50000, paid: 10000, emi: 5000, dueDate: '2025-06-05', status: 'active' },
  { id: 2, name: 'Loan App B', principal: 30000, paid: 5000, emi: 3000, dueDate: '2025-06-10', status: 'active' },
  { id: 3, name: 'Personal Loan', principal: 80000, paid: 20000, emi: 8000, dueDate: '2025-06-15', status: 'active' },
  { id: 4, name: 'Friend/Family', principal: 40000, paid: 0, emi: 0, dueDate: null, status: 'informal' },
]
// Total: ~₹2,00,000

const mockConfig = {
  currentSalary: 0,        // Fill in real sheet only
  newSalary: 0,            // 1.8x from July
  newSalaryStartDate: '2025-07-01',
  debtFreeGoal: '2026-01-01',
  splitPostDebt: {
    invest: 40,
    savings: 20,
    lifestyle: 20,
    family: 20
  }
}
```

---

## Build Phases

Build in this order. Each phase is a working, deployable state.

### Phase 1 — Foundation
- [ ] Vite + React + Tailwind setup
- [ ] Login screen with dual-password routing
- [ ] Basic shell for PublicView and RealView
- [ ] PWA manifest + service worker
- [ ] Deploy to GitHub Pages

### Phase 2 — Data Layer
- [ ] Google Sheets read integration
- [ ] Google Sheets write integration
- [ ] AppContext with full state shape
- [ ] SyncContext with auto-sync on change
- [ ] OAuth popup for write authorization

### Phase 3 — Loan Tracker
- [ ] Loan list with add/edit/delete
- [ ] Per-loan payoff chart
- [ ] Debt-free countdown
- [ ] Total debt summary card

### Phase 4 — Budget & Salary
- [ ] Monthly budget planner
- [ ] Salary split editor
- [ ] Budget vs actual chart
- [ ] July salary jump handling

### Phase 5 — Calendar & Reminders
- [ ] Reminder list (LIC, insurance, birthdays, functions)
- [ ] Add/edit reminders with recurrence
- [ ] Push notification scheduling via service worker

### Phase 6 — Projection & Polish
- [ ] Financial projection graph (month-by-month)
- [ ] What-if simulator
- [ ] Dashboard final layout
- [ ] iOS Add to Home Screen guide screen
- [ ] Full UI polish pass

---

## Commands

```bash
npm install              # Install dependencies
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview production build locally
npm run deploy           # Deploy to GitHub Pages
```

---

## Open Questions / Decisions for User

1. What is your current monthly salary? (for real sheet seed data)
2. What exact loans/apps do you have? (names + amounts)
3. Do you want Google OAuth write access OR manual "Sync to Sheet" button only?
4. What username text to show on login screen?
5. Color theme preference? (default: dark indigo)
6. Do you want fingerprint/Face ID lock on the PWA after install?

---

## Security Notes

- Password hashes in `.env` are injected at build time — never in git history
- Real sheet credentials never appear in source code
- Public sheet is read-friendly but contains only sanitized data
- For extra protection: rotate API keys every 6 months
- The public password can be shared freely; it only shows the public view
