-- =============================================================================
-- PocketWise (省省账) — Phase 2: accounts (multi-wallet/bank/credit card/loan/
-- installment/investment), account-to-account transfers, recurring
-- transactions.
--
-- Architecture note: rather than separate tables for credit cards, loans,
-- and installments, all of them are modeled as `accounts` with a signed
-- balance (positive = asset, negative = debt owed), computed from
-- transactions via the `account_balances` view below. A credit card payment
-- or loan repayment is simply a `transfer` transaction between two accounts.
-- This is additive/renaming only — no existing data is dropped.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- accounts
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  type text not null check (type in ('cash', 'bank', 'ewallet', 'investment', 'credit_card', 'loan', 'installment')),
  institution text,
  currency text not null default 'MYR',
  -- Positive for asset accounts (cash/bank/ewallet/investment). Negative for
  -- liability accounts (credit_card/loan/installment) representing money owed.
  opening_balance numeric(12, 2) not null default 0,
  color text not null default '#6B7280',
  icon text not null default 'Wallet',
  -- Liability-only metadata (nullable, only meaningful for credit_card/loan/installment).
  credit_limit numeric(12, 2) check (credit_limit is null or credit_limit >= 0),
  interest_rate numeric(5, 2) check (interest_rate is null or interest_rate >= 0),
  statement_day smallint check (statement_day is null or (statement_day between 1 and 31)),
  payment_due_day smallint check (payment_due_day is null or (payment_due_day between 1 and 31)),
  min_payment_percent numeric(5, 2) check (min_payment_percent is null or (min_payment_percent > 0 and min_payment_percent <= 100)),
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.accounts is 'A wallet, bank account, e-wallet, investment holding, credit card, loan, or installment plan. Liability types carry a negative balance.';
comment on column public.accounts.opening_balance is 'Starting balance before any tracked transactions. Negative for liability account types.';

create index if not exists accounts_user_idx on public.accounts (user_id) where not is_archived;

drop trigger if exists set_updated_at on public.accounts;
create trigger set_updated_at before update on public.accounts
  for each row execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "accounts_select_own" on public.accounts
  for select using (auth.uid() = user_id);
create policy "accounts_insert_own" on public.accounts
  for insert with check (auth.uid() = user_id);
create policy "accounts_update_own" on public.accounts
  for update using (auth.uid() = user_id);
create policy "accounts_delete_own" on public.accounts
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- transactions: add 'transfer' type + account linkage
-- ---------------------------------------------------------------------------
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions
  add constraint transactions_type_check check (type in ('expense', 'income', 'transfer'));

alter table public.transactions
  add column if not exists account_id uuid references public.accounts (id) on delete set null,
  add column if not exists to_account_id uuid references public.accounts (id) on delete set null;

comment on column public.transactions.account_id is 'For expense/income: the account money left/entered. For transfer: the source account.';
comment on column public.transactions.to_account_id is 'Only set when type = transfer: the destination account.';

-- A transfer moves money between two of the user's own accounts and has no
-- spending category; expense/income transactions never have a to_account.
alter table public.transactions
  alter column category_id drop not null;

alter table public.transactions drop constraint if exists transactions_category_required_unless_transfer;
alter table public.transactions
  add constraint transactions_category_required_unless_transfer
    check (type = 'transfer' or category_id is not null);

alter table public.transactions drop constraint if exists transactions_to_account_only_for_transfer;
alter table public.transactions
  add constraint transactions_to_account_only_for_transfer
    check (type = 'transfer' or to_account_id is null);

create index if not exists transactions_user_account_idx on public.transactions (user_id, account_id);
create index if not exists transactions_user_to_account_idx on public.transactions (user_id, to_account_id);

-- ---------------------------------------------------------------------------
-- recurring_transactions
-- ---------------------------------------------------------------------------
create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('expense', 'income', 'transfer')),
  amount numeric(12, 2) not null check (amount > 0),
  category_id uuid references public.categories (id) on delete restrict,
  account_id uuid references public.accounts (id) on delete set null,
  to_account_id uuid references public.accounts (id) on delete set null,
  payment_method_id uuid references public.payment_methods (id) on delete set null,
  priority text check (priority in ('high', 'medium', 'low')),
  merchant text,
  note text,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  interval_count smallint not null default 1 check (interval_count > 0),
  start_date date not null,
  end_date date,
  next_run_date date not null,
  last_generated_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_transactions_category_required_unless_transfer
    check (type = 'transfer' or category_id is not null),
  constraint recurring_transactions_to_account_only_for_transfer
    check (type = 'transfer' or to_account_id is null),
  constraint recurring_transactions_end_after_start
    check (end_date is null or end_date >= start_date)
);

comment on table public.recurring_transactions is 'Template for auto-generated transactions (salary, rent, subscriptions, loan payments, etc).';

create index if not exists recurring_transactions_user_idx on public.recurring_transactions (user_id) where is_active;
create index if not exists recurring_transactions_next_run_idx on public.recurring_transactions (next_run_date) where is_active;

drop trigger if exists set_updated_at on public.recurring_transactions;
create trigger set_updated_at before update on public.recurring_transactions
  for each row execute function public.set_updated_at();

alter table public.recurring_transactions enable row level security;

create policy "recurring_transactions_select_own" on public.recurring_transactions
  for select using (auth.uid() = user_id);
create policy "recurring_transactions_insert_own" on public.recurring_transactions
  for insert with check (auth.uid() = user_id);
create policy "recurring_transactions_update_own" on public.recurring_transactions
  for update using (auth.uid() = user_id);
create policy "recurring_transactions_delete_own" on public.recurring_transactions
  for delete using (auth.uid() = user_id);

alter table public.transactions
  add column if not exists recurring_transaction_id uuid references public.recurring_transactions (id) on delete set null;

comment on column public.transactions.recurring_transaction_id is 'Set when this transaction was auto-generated from a recurring rule.';

create index if not exists transactions_user_recurring_idx on public.transactions (user_id, recurring_transaction_id);

-- ---------------------------------------------------------------------------
-- account_balances: current balance per account, derived from transactions.
-- security_invoker means this view runs with the caller's own RLS, not the
-- view owner's — required so it can never leak another user's data.
-- ---------------------------------------------------------------------------
create or replace view public.account_balances
  with (security_invoker = true) as
select
  a.id,
  a.user_id,
  a.name,
  a.type,
  a.institution,
  a.currency,
  a.color,
  a.icon,
  a.credit_limit,
  a.interest_rate,
  a.statement_day,
  a.payment_due_day,
  a.min_payment_percent,
  a.is_archived,
  a.sort_order,
  a.opening_balance,
  a.opening_balance
    + coalesce(sum(case when t.type = 'income' and t.account_id = a.id then t.amount end), 0)
    - coalesce(sum(case when t.type = 'expense' and t.account_id = a.id then t.amount end), 0)
    - coalesce(sum(case when t.type = 'transfer' and t.account_id = a.id then t.amount end), 0)
    + coalesce(sum(case when t.type = 'transfer' and t.to_account_id = a.id then t.amount end), 0)
    as current_balance,
  a.created_at,
  a.updated_at
from public.accounts a
left join public.transactions t
  on t.user_id = a.user_id and (t.account_id = a.id or t.to_account_id = a.id)
group by a.id;

comment on view public.account_balances is 'Accounts with their live balance computed from transactions. Positive = asset, negative = amount owed.';

grant select on public.account_balances to authenticated;

-- =============================================================================
-- Still on the roadmap (Phase 3+): receipt OCR, export to Excel/PDF, richer
-- dashboard charts/trends, shared/household budgets. See 0001_init.sql for
-- the original full list.
-- =============================================================================
