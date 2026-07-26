-- =============================================================================
-- PocketWise (省省账) — initial schema
--
-- Design notes:
--   * Every user-owned table carries `user_id` referencing `profiles.id`
--     (which mirrors `auth.users.id`), with row-level security scoping all
--     reads/writes to `auth.uid()`. Nothing is readable across accounts.
--   * `categories` supports both system-wide defaults (user_id IS NULL) and
--     future per-user custom categories (user_id = owner). The `is_essential`
--     flag drives the "block non-essential spending once budget is used up"
--     rule from the product spec.
--   * `profiles.household_id` and `expenses.currency` are included now (as
--     nullable / defaulted columns) so that family-shared accounts and
--     multi-currency support can be layered on later without a breaking
--     migration. See the bottom of this file for a fuller extension roadmap.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'zh')),
  preferred_currency text not null default 'MYR',
  -- Reserved for future shared/family accounts. Null today = personal account.
  household_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per authenticated user; extends auth.users with app-specific preferences.';

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  -- NULL user_id = system default category, visible to everyone.
  -- Non-null = a custom category created by that user.
  user_id uuid references public.profiles (id) on delete cascade,
  key text not null,
  name_en text not null,
  name_zh text not null,
  icon text not null default 'MoreHorizontal',
  color text not null default '#6B7280',
  -- Essential categories remain available even after the monthly budget is
  -- fully used; non-essential categories get blocked (see product spec).
  is_essential boolean not null default true,
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.categories is 'Expense categories. System defaults have user_id IS NULL and are shared by all users.';

-- A user cannot define two custom categories with the same key, and the
-- system default set cannot contain duplicate keys either.
create unique index if not exists categories_user_key_unique
  on public.categories (user_id, key)
  where user_id is not null;

create unique index if not exists categories_system_key_unique
  on public.categories (key)
  where user_id is null;

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'MYR',
  note text,
  expense_date date not null default (current_date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.expenses is 'Individual expense records.';

create index if not exists expenses_user_date_idx on public.expenses (user_id, expense_date desc);
create index if not exists expenses_user_category_idx on public.expenses (user_id, category_id);

-- ---------------------------------------------------------------------------
-- budgets  (one row per user per calendar month)
-- ---------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- Always normalized to the first day of the month, e.g. 2026-07-01.
  month date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  warning_threshold_percent numeric(5, 2) not null default 80
    check (warning_threshold_percent > 0 and warning_threshold_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_month_is_first_of_month check (date_trunc('month', month) = month)
);

comment on table public.budgets is 'Monthly budget + warning threshold, one row per user per month.';

create unique index if not exists budgets_user_month_unique on public.budgets (user_id, month);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.expenses;
create trigger set_updated_at before update on public.expenses
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.budgets;
create trigger set_updated_at before update on public.budgets
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- new-user provisioning: create a profile row automatically on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.expenses enable row level security;
alter table public.budgets enable row level security;

-- profiles: a user may only see/change their own profile.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- categories: everyone can read system defaults + their own custom ones;
-- only the owner can create/edit/delete their custom categories.
create policy "categories_select" on public.categories
  for select using (user_id is null or auth.uid() = user_id);
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id);
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- expenses: strictly owner-only.
create policy "expenses_select_own" on public.expenses
  for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on public.expenses
  for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses
  for update using (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses
  for delete using (auth.uid() = user_id);

-- budgets: strictly owner-only.
create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);
create policy "budgets_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);
create policy "budgets_update_own" on public.budgets
  for update using (auth.uid() = user_id);
create policy "budgets_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed: default categories shared by all users
-- ---------------------------------------------------------------------------
insert into public.categories (user_id, key, name_en, name_zh, icon, color, is_essential, is_system, sort_order)
values
  (null, 'meals',              'Meals',               '三餐',      'UtensilsCrossed', '#F59E0B', true,  true, 1),
  (null, 'transportation',     'Transportation',       '交通',      'Car',             '#3B82F6', true,  true, 2),
  (null, 'daily_necessities',  'Daily Necessities',    '日用品',    'ShoppingBasket',  '#10B981', true,  true, 3),
  (null, 'medical',            'Medical',              '医疗',      'HeartPulse',      '#06B6D4', true,  true, 4),
  (null, 'shopping',           'Shopping',             '购物',      'ShoppingBag',     '#A855F7', false, true, 5),
  (null, 'entertainment',      'Entertainment',        '娱乐',      'Film',            '#F97316', false, true, 6),
  (null, 'coffee_bubble_tea',  'Coffee & Bubble Tea',  '咖啡/奶茶', 'Coffee',          '#92400E', false, true, 7),
  (null, 'others',             'Others',               '其他',      'MoreHorizontal',  '#6B7280', true,  true, 8)
on conflict do nothing;

-- =============================================================================
-- Future extension roadmap (not built yet, schema keeps room for it):
--   * income               (user_id, source, amount, currency, received_on)
--   * savings_goals        (user_id, name, target_amount, target_date, current_amount)
--   * recurring_expenses   (user_id, category_id, amount, cadence, next_run_on)
--   * bills                (user_id, name, amount, due_day, autopay boolean)
--   * loans                (user_id, principal, interest_rate, term_months, ...)
--   * receipts             (expense_id, storage_path, ocr_status, ocr_raw_text)
--   * households            (id, name) + profiles.household_id fk, plus a
--                            household_members join table for shared accounts
--   * notifications         (user_id, type, payload, read_at)
--   * expenses.currency is already per-row, so multi-currency just needs an
--     fx_rate table and a display-currency preference on profiles.
-- =============================================================================
