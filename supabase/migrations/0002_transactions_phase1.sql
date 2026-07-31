-- =============================================================================
-- PocketWise (省省账) — Phase 1: transactions, income, payment methods,
-- priority, tags, custom categories, per-category budgets.
--
-- This migration is additive/renaming only — no data is dropped. Existing
-- `expenses` rows become `transactions` rows with type = 'expense'.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- categories: add income/expense type
-- ---------------------------------------------------------------------------
alter table public.categories
  add column if not exists type text not null default 'expense' check (type in ('expense', 'income'));

comment on column public.categories.type is 'Whether this category applies to income or expense transactions.';

-- Re-scope the uniqueness constraints to include type, so an income category
-- and an expense category could (in theory) share a key without conflict.
drop index if exists categories_system_key_unique;
drop index if exists categories_user_key_unique;

create unique index if not exists categories_system_key_unique
  on public.categories (key, type)
  where user_id is null;

create unique index if not exists categories_user_key_unique
  on public.categories (user_id, key, type)
  where user_id is not null;

-- Seed default income categories (system-wide, shared by all users).
insert into public.categories (user_id, key, name_en, name_zh, icon, color, is_essential, is_system, sort_order, type)
values
  (null, 'salary',        'Salary',        '工资',     'Wallet',        '#0D9488', true, true, 1, 'income'),
  (null, 'bonus',         'Bonus',         '奖金',     'Gift',          '#F59E0B', true, true, 2, 'income'),
  (null, 'freelance',     'Freelance',     '自由职业', 'Briefcase',     '#3B82F6', true, true, 3, 'income'),
  (null, 'investment',    'Investment',    '投资收益', 'TrendingUp',    '#10B981', true, true, 4, 'income'),
  (null, 'gift_income',   'Gift',          '礼金',     'Gift',          '#EC4899', true, true, 5, 'income'),
  (null, 'other_income',  'Other Income',  '其他收入', 'MoreHorizontal','#6B7280', true, true, 6, 'income')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- payment_methods
-- ---------------------------------------------------------------------------
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  key text not null,
  name_en text not null,
  name_zh text not null,
  icon text not null default 'Wallet',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.payment_methods is 'How a transaction was paid for. System defaults have user_id IS NULL.';

create unique index if not exists payment_methods_system_key_unique
  on public.payment_methods (key)
  where user_id is null;

create unique index if not exists payment_methods_user_key_unique
  on public.payment_methods (user_id, key)
  where user_id is not null;

alter table public.payment_methods enable row level security;

create policy "payment_methods_select" on public.payment_methods
  for select using (user_id is null or auth.uid() = user_id);
create policy "payment_methods_insert_own" on public.payment_methods
  for insert with check (auth.uid() = user_id);
create policy "payment_methods_update_own" on public.payment_methods
  for update using (auth.uid() = user_id);
create policy "payment_methods_delete_own" on public.payment_methods
  for delete using (auth.uid() = user_id);

insert into public.payment_methods (user_id, key, name_en, name_zh, icon, sort_order)
values
  (null, 'cash',          'Cash',          '现金',     'Banknote',    1),
  (null, 'debit_card',    'Debit Card',    '借记卡',   'CreditCard',  2),
  (null, 'credit_card',   'Credit Card',   '信用卡',   'CreditCard',  3),
  (null, 'bank_transfer', 'Bank Transfer', '银行转账', 'Landmark',    4),
  (null, 'e_wallet',      'E-Wallet',      '电子钱包', 'Smartphone',  5)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- tags (free-form, per-user)
-- ---------------------------------------------------------------------------
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  color text not null default '#6B7280',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.tags enable row level security;

create policy "tags_select_own" on public.tags
  for select using (auth.uid() = user_id);
create policy "tags_insert_own" on public.tags
  for insert with check (auth.uid() = user_id);
create policy "tags_update_own" on public.tags
  for update using (auth.uid() = user_id);
create policy "tags_delete_own" on public.tags
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- expenses -> transactions
-- ---------------------------------------------------------------------------
alter table public.expenses rename to transactions;

alter table public.transactions rename constraint expenses_pkey to transactions_pkey;
alter table public.transactions rename constraint expenses_user_id_fkey to transactions_user_id_fkey;
alter table public.transactions rename constraint expenses_category_id_fkey to transactions_category_id_fkey;
alter table public.transactions rename constraint expenses_amount_check to transactions_amount_check;

alter index expenses_user_date_idx rename to transactions_user_date_idx;
alter index expenses_user_category_idx rename to transactions_user_category_idx;

alter policy "expenses_select_own" on public.transactions rename to "transactions_select_own";
alter policy "expenses_insert_own" on public.transactions rename to "transactions_insert_own";
alter policy "expenses_update_own" on public.transactions rename to "transactions_update_own";
alter policy "expenses_delete_own" on public.transactions rename to "transactions_delete_own";

alter table public.transactions
  add column if not exists type text not null default 'expense' check (type in ('expense', 'income')),
  add column if not exists payment_method_id uuid references public.payment_methods (id) on delete set null,
  add column if not exists priority text check (priority in ('high', 'medium', 'low')),
  add column if not exists merchant text;

comment on table public.transactions is 'Income and expense records (formerly "expenses"). Distinguished by `type`.';
comment on column public.transactions.priority is 'Optional user-assigned importance, independent of category.';

create index if not exists transactions_user_type_idx on public.transactions (user_id, type);
create index if not exists transactions_user_payment_method_idx on public.transactions (user_id, payment_method_id);

-- ---------------------------------------------------------------------------
-- transaction_tags (many-to-many)
-- ---------------------------------------------------------------------------
create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (transaction_id, tag_id)
);

alter table public.transaction_tags enable row level security;

create policy "transaction_tags_select_own" on public.transaction_tags
  for select using (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );
create policy "transaction_tags_insert_own" on public.transaction_tags
  for insert with check (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
    and exists (select 1 from public.tags g where g.id = tag_id and g.user_id = auth.uid())
  );
create policy "transaction_tags_delete_own" on public.transaction_tags
  for delete using (
    exists (select 1 from public.transactions t where t.id = transaction_id and t.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- category_budgets: per-category monthly limit + warning threshold, layered
-- on top of the existing overall monthly `budgets` table.
-- ---------------------------------------------------------------------------
create table if not exists public.category_budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  warning_threshold_percent numeric(5, 2) not null default 80
    check (warning_threshold_percent > 0 and warning_threshold_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint category_budgets_month_is_first_of_month check (date_trunc('month', month) = month)
);

comment on table public.category_budgets is 'Optional per-category spending limit for a given month, layered on top of the overall monthly budget.';

create unique index if not exists category_budgets_user_category_month_unique
  on public.category_budgets (user_id, category_id, month);

drop trigger if exists set_updated_at on public.category_budgets;
create trigger set_updated_at before update on public.category_budgets
  for each row execute function public.set_updated_at();

alter table public.category_budgets enable row level security;

create policy "category_budgets_select_own" on public.category_budgets
  for select using (auth.uid() = user_id);
create policy "category_budgets_insert_own" on public.category_budgets
  for insert with check (auth.uid() = user_id);
create policy "category_budgets_update_own" on public.category_budgets
  for update using (auth.uid() = user_id);
create policy "category_budgets_delete_own" on public.category_budgets
  for delete using (auth.uid() = user_id);

-- =============================================================================
-- Still on the roadmap (Phase 2+): accounts/wallets, recurring_transactions,
-- installments, loans, credit_cards, receipts (OCR), households (shared
-- budgets). See the roadmap note in 0001_init.sql for the full list.
-- =============================================================================
