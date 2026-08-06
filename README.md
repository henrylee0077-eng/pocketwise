# PocketWise (省省账)

"Don't let the end of the month leave you with only bread." — a bilingual (English / 简体中文), mobile-first, installable personal finance app with accounts, budgets, spending projects, recurring transactions, reports, and an AI quick-add assistant.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS v4 · shadcn-style components on Radix UI · Dexie (IndexedDB) for on-device storage · Google Identity Services + Google Drive for optional backup/sync · TanStack Query · React Hook Form + Zod · Vercel.

## Architecture: local-first, not a hosted database

PocketWise stores all of your data — transactions, accounts, budgets, categories, tags, projects, recurring rules, settings — in the browser's own on-device storage (IndexedDB, via [Dexie](https://dexie.org/)). There is no central database and no per-user hosting cost that grows with the number of people using the app: every device holds only its own owner's data, the same as a file saved locally.

Signing in with Google is entirely optional and only used for the "Backup & Sync" feature in Settings. When connected, PocketWise writes a single backup file directly from the browser to a hidden, app-only folder in the user's own Google Drive (Google's ["app data" folder](https://developers.google.com/workspace/drive/api/guides/appdata), free up to 15GB, invisible in the user's regular Drive UI). This is what lets someone move to a new phone (restore) or keep two devices in sync (backup on one, restore on the other) — all inside their own Google account, never through a server we operate.

The server-side code that's left is three small, stateless Next.js API routes — none of them have a database, and none of them persist anything:
- `/api/quick-add/parse` calls Google's Gemini API to parse the free-text "Quick Add" assistant. The client sends the conversation plus its already-loaded categories/accounts/payment methods in the request; the route returns a parsed draft.
- `/api/export/xlsx` and `/api/export/pdf` generate report files. These run server-side (not in the browser) because `exceljs` and `@react-pdf/renderer` depend on Node-only packages that don't bundle for the browser — but the client still sends its own already-loaded local data in the request, and the generated file is streamed straight back with nothing saved.

## Features

- Accounts (cash, bank, e-wallet, investment, credit card, loan, installment) with running balances and net worth.
- Daily transaction tracking — expense, income, and transfers between accounts — with categories, tags, payment methods, merchant, priority, and notes.
- Spending projects (e.g. a trip or renovation) that roll up linked expenses against an optional target amount.
- Monthly budgets with a configurable warning threshold, plus per-category budgets.
- Recurring transactions (daily/weekly/monthly/yearly), generated automatically on-device when the app is opened or brought back to the foreground.
- Reports (week/month/year) with category breakdowns and trend charts, exportable to Excel and PDF.
- "Quick Add" — a conversational AI assistant (Google Gemini) that turns a sentence like "today lunch RM20" into a saved transaction, asking a clarifying question only when something required is missing.
- Optional app-lock PIN (hashed on-device with Web Crypto PBKDF2 — never sent anywhere, never included in backups).
- Optional Google Drive backup, restore, and cross-device sync.
- English / 中文 toggle, persisted per-device. Light and dark mode, following the system by default.
- Fully responsive and installable as a PWA / Android TWA.

## Project structure

```
src/
  app/                 App Router pages (dashboard, transactions, budget, projects, reports, settings, ask-ai)
  app/api/quick-add/   Stateless server route — Gemini call for Quick Add
  app/api/export/      Stateless server routes — Excel (ExcelJS) and PDF (@react-pdf/renderer) generation; Node-only libraries, so these run server-side, but the client sends its own local data in the request and nothing is persisted
  components/          ui/ (design-system primitives), dashboard/, transactions/, settings/, security/, layout/, providers/
  hooks/               TanStack Query + Dexie live-query hooks (accounts, transactions, budgets, security, google backup, …)
  i18n/                Translation dictionaries + language context
  lib/local-db/        Dexie schema, seed data, derived/computed views, PIN security, recurring-transaction engine
  lib/google-drive/    Google Identity Services sign-in + Drive app-data backup/restore
  lib/export/          Excel (ExcelJS) and PDF (@react-pdf/renderer) report generation, used by app/api/export/
  lib/queries/         Data-access layer — every function reads/writes Dexie directly
  types/               Domain types (row shapes originally modeled on a Postgres schema, now the Dexie row shapes too)
```

## 1. Set up Google Sign-In (for backup/sync)

This step is only needed for the optional "Backup & Sync" feature — the app works fully without it.

1. In the [Google Cloud Console](https://console.cloud.google.com/), create (or reuse) a project.
2. Go to **APIs & Services → OAuth consent screen** and configure it as an External app (add your own email as a test user if it's still in testing mode).
3. Go to **APIs & Services → Library** and enable the **Google Drive API** and **Google People API**.
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**, choose **Web application**, and add `http://localhost:3000` and your production URL (e.g. `https://pocketwise.vercel.app`) under **Authorized JavaScript origins**. No redirect URI is needed — sign-in happens via a popup token flow, not a redirect.
5. Copy the generated **Client ID**.

## 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GEMINI_API_KEY=your-gemini-api-key
```

`GEMINI_API_KEY` powers the Quick Add assistant (`/api/quick-add/parse`) — get one from [Google AI Studio](https://aistudio.google.com/apikey). Both variables are optional at build time; the app runs without them, just without Quick Add and/or Google backup.

## 3. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land straight on the dashboard with a freshly seeded set of default categories and payment methods. No sign-in required.

## 4. Deploy to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository (framework preset auto-detects Next.js).
3. Add the two environment variables from step 2, using your real production URL for the Google OAuth client's authorized origins (step 1.4).
4. Deploy.

## Notes on data & privacy

See `/privacy` (also linked in the app) for the full policy. In short: there's no PocketWise-operated database, so there's nothing for us to lose in a breach and no per-user hosting cost — data lives on-device, with backups (if enabled) living in the user's own Google Drive.

## Testing checklist

- [ ] `npm run typecheck` — no TypeScript errors.
- [ ] `npm run lint` — no errors.
- [ ] `npm run build` — production build succeeds.
- [ ] Core flows on a fresh browser profile: seed data appears, create/edit/delete a transaction, set a budget, create a recurring rule and confirm it generates on next load, connect Google Drive and back up / restore, set and verify a PIN lock, reset the device from Settings.
