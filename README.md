# PocketWise (省省账)

"Don't let the end of the month leave you with only bread." — a bilingual (English / 简体中文), mobile-first personal expense tracker with monthly budgets, spending warnings, and automatic non-essential spending lockout.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · shadcn-style components on Radix UI · Supabase (Postgres + Auth + Row Level Security) · TanStack Query · React Hook Form + Zod · Vercel.

## Features

- Daily expense tracking (amount in RM, category, date, notes).
- Eight default categories: Meals, Transportation, Daily Necessities, Medical, Shopping, Entertainment, Coffee & Bubble Tea, Others.
- Dashboard: today's spending, month-to-date spending, remaining budget, days left in the month, and a recommended daily budget (remaining budget ÷ remaining days).
- Monthly budget with a configurable warning threshold (default 80%). Crossing it shows a warning banner and highlights the remaining budget in red.
- When the monthly budget is fully used, Shopping, Entertainment, and Coffee & Bubble Tea are blocked from new entries; Meals, Transportation, Daily Necessities, Medical, and Others always remain available.
- Google sign-in; every row in the database is scoped to its owner via Postgres Row Level Security, so no user can ever see another user's data.
- English / 中文 toggle, persisted per-device. Light and dark mode, following the system by default.
- Fully responsive: phone, tablet, and desktop.

## Project structure

```
src/
  app/                 App Router pages (login, auth callback, dashboard, expenses, budget, settings)
  components/          ui/ (design-system primitives), dashboard/, expenses/, budget/, layout/, providers/
  hooks/               TanStack Query hooks (categories, expenses, budget, dashboard)
  i18n/                Translation dictionaries + language context
  lib/                 Supabase clients, validation schemas, currency/date utilities, dashboard math
  types/               Database + domain types
supabase/migrations/   SQL schema, RLS policies, seed data
```

The schema already carries a few forward-looking columns (`profiles.household_id`, per-row `expenses.currency`) so that shared family accounts and multi-currency support can be added later without a breaking migration — see the comment block at the bottom of `supabase/migrations/0001_init.sql` for the fuller roadmap (income, savings goals, recurring expenses, bills, loans, receipt OCR, notifications).

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com/dashboard) and create a new project (pick any region close to your users).
2. Once it's provisioned, open **Project Settings → API** and note down the **Project URL** and the **anon public key** — you'll need both shortly.
3. Open the **SQL Editor**, paste the entire contents of `supabase/migrations/0001_init.sql`, and run it. This creates the `profiles`, `categories`, `expenses`, and `budgets` tables, enables Row Level Security with owner-only policies, and seeds the eight default categories.

## 2. Set up Google sign-in

1. In the Supabase dashboard, go to **Authentication → Sign In / Providers → Google** and toggle it on. Copy the **Callback URL** shown there — it looks like `https://<project-ref>.supabase.co/auth/v1/callback`.
2. In the [Google Cloud Console](https://console.cloud.google.com/), create (or reuse) a project, then go to **APIs & Services → OAuth consent screen** and configure it as an External app (add your own email as a test user if it's still in testing mode).
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**, choose **Web application**, and under **Authorized redirect URIs** paste the Supabase callback URL from step 1.
4. Copy the generated **Client ID** and **Client Secret** back into the Supabase Google provider settings and save.
5. Under **Authentication → URL Configuration**, set the **Site URL** to your production URL once you have it (e.g. `https://pocketwise.vercel.app`), and add `http://localhost:3000/auth/callback` plus your production `/auth/callback` URL under **Redirect URLs**.

## 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in the two Supabase values from step 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 4. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you should land on the login screen. Sign in with Google, set a monthly budget on the Budget tab, and start logging expenses.

## 5. Deploy to Vercel

1. Push this project to a GitHub repository.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository (framework preset auto-detects Next.js).
3. Add the same three environment variables from step 3, but set `NEXT_PUBLIC_SITE_URL` to your real Vercel URL (e.g. `https://pocketwise.vercel.app`) — you can update this after the first deploy once you know the assigned domain.
4. Deploy. Once it's live, go back to Supabase **Authentication → URL Configuration** and add `https://<your-vercel-domain>/auth/callback` to the redirect URL allow-list (and update the Site URL), otherwise Google sign-in will redirect back to an error page.
5. Redeploy (or just refresh) — your public HTTPS URL is now ready for daily use on both mobile and desktop browsers.

## Notes on the "budget enforcement" rule

Per the product spec, once total spending for the month reaches the full budget amount, new expenses in **Shopping**, **Entertainment**, and **Coffee & Bubble Tea** are blocked (the category picker greys them out with a lock icon, and the API layer double-checks server-side data before submit). **Meals**, **Transportation**, **Daily Necessities**, **Medical**, and **Others** are always available, since the spec only names the first three as non-essential. If you'd like `Others` to be blockable too, flip `is_essential` to `false` for that row in the `categories` table.

## Testing checklist

- [x] `npm run typecheck` — no TypeScript errors.
- [x] `npm run lint` — no errors (one informational React Compiler notice about `react-hook-form`'s `watch`, which is expected and harmless).
- [x] `npm run build` — production build succeeds.
- [ ] End-to-end sign-in, expense CRUD, budget warning/enforcement — verify against your own Supabase project after following steps 1–3 above (a placeholder project can't be exercised from this environment).
