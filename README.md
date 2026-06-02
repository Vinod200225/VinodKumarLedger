# Ledger — Personal Finance PWA

A single-user personal finance Progressive Web App with **two password-protected views**, **Google Sheets** as the database, **bidirectional sync**, and **iOS / Android Add-to-Home-Screen** install.

> One URL. One username. Two passwords.
> - `Vinod@4115` → **Public view = Sheet 1 (master)** — where you do all your editing.
> - `Malavika@1925` → **Real view = Sheet 2 (mirror)** — auto-receives everything from Sheet 1, plus any extras you add only here.
>
> Each view is backed by its own Google Sheet. **Sync is one-way: Sheet 1 → Sheet 2, automatically.** See "Current status" below.

---

## Current status (last updated 2026-06-02)

**Sync model — IMPORTANT**
- The Google **Sheet is the source of truth on load**; the app pulls from it first and blocks any write until that pull succeeds (so stale/seed data can never overwrite real data).
- **Every** add / edit / delete in **Sheet 1** auto-mirrors to **Sheet 2** (transactions, loans, EMIs, Slice, reminders, accounts). No "duplicate" checkbox anymore — it's automatic.
- **One-way only:** edits made directly in Sheet 2 are never pushed back to Sheet 1, so Sheet-2-only extras are safe.
- Each row has a hidden stable **`Id`** column (last column of every tab) so edit/delete can match the right row across both sheets. Added non-destructively on first write.
- **⇄ Sync to Sheet 2** button (header, master view only) does a full backfill: upserts everything into Sheet 2, merges budget + config, preserves Sheet-2 extras. **Salary is excluded** from all sync — it's independent per sheet.

**Behavior**
- **Self-transfer** (Dashboard → "⇄ Self transfer"): moves money between accounts; excluded from income/expense totals, counted in account balances.
- **Slice / revolving payment** logs only the **net difference** as one entry (paid − withdrawn), never a separate fake income.
- **Standard-loan EMIs** (Kreditbee, IDFC, HDFC…): once this month's EMI is recorded, the "Pay EMI" button is replaced with "✓ This month's EMI paid" until next month (or until you delete that transaction).
- **Budget tab:** the **Plan** column is what you set; the **Spent** column is **auto-computed** from that month's expenses by category (includes custom categories like TEA). "Budget breakdown" shows the planned split. Post-Debt Salary Split is removed for now (re-add after loans are cleared).
- **June outlook:** shows money-in / money-out only (the "at current pace" forecast was removed).
- **Mobile:** inputs are 16px to stop iOS zoom; background scroll locks while a modal is open; header sync controls sit on their own wrapping row.

---

## Quick start (after `git clone`)

```bash
# 1. install
npm install

# 2. create your .env from the template
cp .env.example .env
# then fill in the values (see "Environment variables" section below)

# 3. run locally
npm run dev    # opens http://localhost:5173
```

If `.env` is correctly filled, the app will sync with your Google Sheets immediately on first login.

---

## What this app does

| Module | Notes |
|---|---|
| **Daily ledger** | Per-day expense & income entry with category, subcategory, account, note. "+ Add new category..." inline. Filter by account/category. |
| **Loans** | Standard EMI loans + revolving credit (Slice-style). Big EMI display + "+ Pay this month's EMI" button. Revolving loans get "+ Record payment" (with paid + withdrawn back fields). Each loan card has expandable payment history. |
| **Budget** | Per-month per-category budget vs actual. Below it: stacked color bar showing % of budget per category + % vs salary, with "+ free / − over" footer. |
| **Calendar / Reminders** | Add LIC, insurance, mobile recharge etc. with recurrence + validity-days for auto-renewal. **✓ Paid** button: logs an expense and advances the next due date in one tap. Reminders can be assigned to an account (e.g. Apple Music → ICICI). |
| **Investments** | All transactions with category = `Investment` grouped by subcategory (LIC Policy 1, RD, NPS, etc.) — total invested + payment history per investment. |
| **Accounts** | Bank / wallet / cash / credit accounts with opening balance + date. Current balance = opening + sum of attributed transactions on/after opening date. |
| **Dashboard** | Quick add (Salary / Income / Expense pre-filled forms), live account balances with colored rails, total debt + Fixed EMI vs Revolving min split, this-month outlook with pace-based end-of-month forecast, upcoming reminders, debt-free countdown. |
| **PWA** | Installable on iOS & Android (Add to Home Screen). Offline-capable shell via service worker. |

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS + a few `@layer components` (see `src/index.css`) |
| Charts | Recharts |
| Routing | React Router v6 |
| State | React Context + `useReducer` (no Redux) |
| Persistence | localStorage (per-view) + Google Sheets (per-view) |
| Auth | SHA-256 client-side password hashing via `crypto.subtle` |
| Reads | Google Sheets REST API v4 with API key (sheets must be shared "Anyone with link → Viewer") |
| Writes | Google Apps Script webhook (no OAuth needed) — see `apps-script/Code.gs` |
| Hosting | GitHub Pages (auto-deploy via Actions) |
| PWA | `vite-plugin-pwa` (auto-update, workbox caching) |

---

## Project structure

```
/
├── apps-script/
│   └── Code.gs               # Google Apps Script (deploy once per sheet)
├── public/
│   ├── manifest.json         # PWA manifest (also inlined in vite.config.js)
│   └── icons/                # 192.png, 512.png, icon.svg
├── src/
│   ├── main.jsx, App.jsx     # Entry + routes
│   ├── auth/                 # LoginScreen, useAuth, hashPassword
│   ├── views/                # PublicView, RealView (route wrappers per sheet)
│   ├── components/
│   │   ├── dashboard/        # Dashboard, QuickActions, MonthProjection, NetWorthCard, AccountBalancesCard, CashFlowSummary
│   │   ├── transactions/     # Transactions list page + TransactionForm
│   │   ├── accounts/         # Accounts page + AccountForm
│   │   ├── loans/            # LoanTracker, LoanCard, LoanForm, RevolvingPaymentForm, EMIPaymentForm, PayoffChart
│   │   ├── budget/           # BudgetPlanner, BudgetBreakdown, BudgetVsActualChart, SalarySplitEditor
│   │   ├── calendar/         # ReminderCalendar, ReminderForm, UpcomingReminders
│   │   ├── investments/      # Investments page
│   │   ├── projection/       # FinancialProjection, DebtFreeCountdown, WhatIfSimulator
│   │   └── shared/           # Layout, Nav, SyncStatusBadge, Modal, LoadingSpinner, Toast, IOSInstallGuide
│   ├── context/              # AppContext (state per view), SyncContext (sheet sync)
│   ├── services/             # sheets.js (read/write helpers), sync.js (pullAll/pushAll + mirrorTransactionToOtherView), notifications.js
│   ├── config/               # constants.js (categories, account types, etc.), mockData.js (seed when empty), splitDefaults.js
│   └── utils/                # date.js, format.js
├── .github/workflows/
│   └── deploy.yml            # GitHub Pages deploy with secrets-as-env-vars
├── .env                      # GITIGNORED, see .env.example
├── .env.example              # template
├── vite.config.js            # base path, PWA config
├── tailwind.config.js
├── index.html
└── package.json              # homepage = https://<your-gh-user>.github.io/ledger
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in all values. **Never commit `.env`** (it's in `.gitignore`).

| Variable | What it is |
|---|---|
| `VITE_PUBLIC_SHEET_ID` | Sheet ID for the **public** view (from the Sheet's URL between `/d/` and `/edit`) |
| `VITE_REAL_SHEET_ID` | Sheet ID for the **real** view |
| `VITE_PUBLIC_SHEET_API_KEY` | Google API key restricted to Sheets API (one key fine for both) |
| `VITE_REAL_SHEET_API_KEY` | Same as above; can be the same value |
| `VITE_PUBLIC_SHEETS_WEBHOOK` | Apps Script `/exec` URL deployed against the public Sheet |
| `VITE_REAL_SHEETS_WEBHOOK` | Apps Script `/exec` URL deployed against the real Sheet |
| `VITE_SHEETS_WEBHOOK_SECRET` | Random string shared between `.env` and `WEBHOOK_SECRET` in `apps-script/Code.gs` |
| `VITE_PUBLIC_PASSWORD_HASH` | SHA-256 hex of the public-view password |
| `VITE_REAL_PASSWORD_HASH` | SHA-256 hex of the real-view password |

To compute a password hash, paste this in a browser console:
```js
const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('yourpassword'))
console.log(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join(''))
```

---

## Google Sheets setup (one-time)

For **each** view (public + real), do this once:

1. Create a Google Sheet. Name doesn't matter.
2. Open it → **Share** → "General access" → **Anyone with the link → Viewer**.
3. Copy the Sheet ID from the URL (between `/d/` and `/edit`) → paste into `.env`.
4. Tabs are auto-created on first write. You can also create them manually with these exact names: `Transactions`, `Loans`, `Budget`, `Reminders`, `Config`, `Accounts`.

Then once for the project (covers both sheets):

5. Go to https://console.cloud.google.com → create a project.
6. **APIs & Services → Library** → enable **Google Sheets API**.
7. **Credentials → + Create credentials → API key** → copy.
8. Edit the key → **API restrictions → Restrict key → Google Sheets API**. Save.
9. Paste this key into both `VITE_PUBLIC_SHEET_API_KEY` and `VITE_REAL_SHEET_API_KEY`.

---

## Apps Script webhook setup (one-time, per sheet)

Writes go through a Google Apps Script web app (bound to the sheet). Repeat these steps **for each sheet**:

1. Open the Sheet → **Extensions → Apps Script**.
2. Replace `Code.gs` with the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
3. On the line `const WEBHOOK_SECRET = '...';` set a random string. **Use the same value in both sheets' scripts and in `VITE_SHEETS_WEBHOOK_SECRET`.**
4. Save (Ctrl+S). Optionally rename the project (e.g. "Finance_Tracker Webhook").
5. **Deploy → New deployment → ⚙️ gear → Web app**
   - Description: `v1`
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy** → authorize (Advanced → Go to ... (unsafe) → Allow — it's your own script).
7. Copy the `/exec` URL → paste into `VITE_PUBLIC_SHEETS_WEBHOOK` (or `VITE_REAL_...`).

Sanity check: open the `/exec` URL in a browser. You should see:
```json
{"ok":true,"msg":"Ledger webhook is alive. Use POST."}
```

---

## Sheet tab schemas

The webhook overwrites entire tabs on each push. Schemas are managed entirely from code in [`src/services/sheets.js`](src/services/sheets.js). Header row is regenerated on each write.

Each row-based tab has a hidden trailing **`Id`** column (stable per-row id used for cross-sheet mirroring).

| Tab | Columns |
|---|---|
| `Loans` | Name · Kind (`standard`/`revolving`) · Principal · AmountPaid · EMI · DueDate · EndDate · Source · Status · Phases · **Id** |
| `Transactions` | Date · Category · Subcategory · Amount · Note · Type (`income`/`expense`) · Account · **Id** |
| `Reminders` | Title · Date · RecurrenceType · Amount · Type · ValidityDays · Account · Notes · **Id** |
| `Budget` | Month (`YYYY-MM`) · Category · Budgeted · Actual (Actual is auto-computed from spend in the app) |
| `Config` | Key · Value (flat dot-notation; arrays JSON-encoded, e.g. `customCategories.expense = ["TEA"]`) |
| `Accounts` | Name · Type · OpeningBalance · OpeningDate · CurrentBalance (auto-computed on push) · Notes · **Id** |

Sort order on push: loans active-first, transactions newest-first, reminders soonest-first.

---

## Sync model (important to understand)

- **Source of truth on load is the Google Sheet.** On mount the app pulls from the sheet and hydrates from it. **All writes are blocked until that pull succeeds**, so stale local / seed data can never overwrite real sheet data.
- **On any state change:** a debounced push (300ms) sends the current view's whole state to *its own* sheet.
- **Cross-sheet mirroring is automatic and one-way (Sheet 1 → Sheet 2).** Each discrete add/edit/delete in the master (public) view is mirrored to the other sheet via an operation-based `mirrorOp` (read → change one row by `Id` → write) — it never blind-overwrites the other sheet, and it preserves Sheet-2-only rows. Editing directly in Sheet 2 does **not** push back. See `src/hooks/useMirror.js`, `src/services/sync.js` (`mirrorOp`), and `MASTER_VIEW` in `src/config/constants.js`.
- **Stable ids:** every entity carries a permanent `id` persisted in a hidden trailing `Id` column on each tab (`src/utils/id.js`). Legacy rows fall back to row-position until their id is written on the next save.
- **Full backfill:** the **⇄ Sync to Sheet 2** button (header, master view only) calls `backfillToOtherView()` — upserts all transactions/loans/reminders/accounts by id, merges budget + config (minus salary), and keeps Sheet-2 extras. Use it to bring data created before auto-mirroring existed.
- **To pull edits made directly in the Sheet**, tap **↓ Pull** (replaces local with sheet) or the **Sync badge** (push-then-pull).

---

## Commands

```bash
npm run dev       # local dev server on :5173
npm run build     # production build to dist/
npm run preview   # serve the production build locally
npm run deploy    # build + push dist/ to gh-pages branch (manual deploy)
```

Auto-deploy via GitHub Actions runs on every push to `main` — see [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

---

## GitHub Pages deployment

1. Push the repo to GitHub.
2. Repo **Settings → Pages → Source = "GitHub Actions"**.
3. **Settings → Secrets and variables → Actions → New repository secret**, add **all 9** env vars from your `.env`. The workflow injects them at build time as `VITE_*`.
4. Push to `main`. The Actions tab will run `Build` → `Deploy`. Within a minute, the site is live at `https://<your-gh-user>.github.io/<repo-name>/`.

Update `homepage` in `package.json` if your repo isn't named `ledger`.

---

## iOS / Android "Add to Home Screen"

The app is a full PWA with installable manifest, service worker, and icons. To install:

**iOS Safari:**
1. Open the published URL in Safari.
2. Tap the **Share** button (square with arrow up).
3. Tap **Add to Home Screen** → name it → **Add**.

**Android Chrome:**
1. Open the URL.
2. Tap the **⋮** menu → **Install app** (or wait for the banner).

After install the app runs full-screen with no Safari/Chrome chrome — looks native.

> Icons are 192×192 / 512×512 PNG in `public/icons/`. They were generated with PowerShell from the gradient design in `icon.svg`. To regenerate or replace, drop new files into `public/icons/` and rebuild.

---

## Architecture notes

- **Per-view independence.** `PublicView` and `RealView` each mount their own `AppProvider` and `SyncProvider`. Their state, localStorage keys, and target sheet are fully separated. Logging in with the public password never affects the real sheet.
- **No backend.** The only server-side code is the Apps Script bound to each Sheet (handles writes via the webhook secret). Reads use the public Sheets REST API + your API key.
- **Auth is client-side hashing.** SHA-256 of your typed password is compared to the build-time injected hashes. The hashes are not secret-secret — they're in the bundled JS. The actual passwords are never in the bundle.
- **Categories are extensible.** Built-in expense / income categories are in `src/config/constants.js`. Users can also add ad-hoc categories from the transaction form via "+ Add new category..."; these are persisted in `config.customCategories` (per view).
- **Investments are derived data.** No separate `investments` array — anything tagged `category = Investment` with a subcategory shows up on the Investments page grouped by that subcategory.
- **Revolving credit handling.** Loans with `kind = 'revolving'` (e.g. Slice) have a custom "Record payment" flow that captures both `paid` and `withdrawn back` amounts. Net reduction = paid − withdrawn, and a **single** transaction is logged for that net amount (so it never inflates income). Standard EMI loans hide the "Pay EMI" button once the current month's EMI is recorded.

---

## Common gotchas

| Symptom | Likely cause / fix |
|---|---|
| Sync badge stuck on "Local only" | `.env` missing or webhook URL blank. Restart `npm run dev` after editing `.env`. |
| Sync badge red ("Sync error") | Sheet not shared "Anyone with link → Viewer", OR API key wrong, OR webhook secret mismatch between `.env` and `Code.gs`. |
| Edits in app don't appear in Sheet | Debounce is 300ms — give it a second. Or tap the Sync badge / 💾 Save on Reminders page. |
| Edits in Sheet don't appear in app on refresh | By design — local is source of truth. Tap the Sync badge to pull. |
| iOS Safari shows app full-screen with white background flash on launch | Add splash images (not done by default; not required for functionality). |
| iPhone notch/Dynamic Island overlap | Already handled via `safe-top`/`safe-bottom` CSS classes + `viewport-fit=cover` meta tag. |
| Numbers below 16px causing iOS zoom-on-tap-input | Inputs use Tailwind `text-sm` (14px). If you find it disruptive, bump `.input { font-size: 16px; }` in `src/index.css`. |

---

## Restoring after a fresh clone

If you clone the repo on a new machine, here's the minimum to get a working dev environment:

1. `npm install`
2. Recreate `.env` from `.env.example` with your actual values (Sheet IDs, API key, webhook URLs, secret, password hashes). Without these, the app runs but only with localStorage — no sheet sync.
3. `npm run dev` → log in with one of your passwords → app pulls from sheet on first load and seeds local state.

The Google Sheets themselves (with your data) are the durable backup. As long as you have:
- the 2 Sheet IDs,
- the API key (or can create a new one),
- the 2 webhook URLs (or can redeploy the Apps Script — secret should match),
- the secret string,
- the password hashes (or can regenerate them with the snippet above),

…your data is recoverable in one `npm install + npm run dev` session.

---

## License

Personal project. No license — do not redistribute.
