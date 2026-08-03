-- =============================================================================
-- PocketWise (省省账) — Spending projects (e.g. "House Renovation", "Wedding"):
-- track cumulative spend against a big, irregular, open-ended goal, separate
-- from the monthly category-budget system.
--
-- Architecture note: modeled after `accounts` (same name/icon/color/
-- is_archived shape) rather than as a special kind of tag or category —
-- projects need an optional target amount and date range that neither tags
-- nor categories carry, and unlike tags a transaction belongs to at most one
-- project. `transactions.project_id` is nullable and only ever set for
-- type = 'expense' (income/transfers don't count as "spend"). Deleting a
-- project unlinks its transactions (ON DELETE SET NULL) rather than deleting
-- transaction history.
-- =============================================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  icon text not null default 'Sparkles',
  color text not null default '#0D9488',
  target_amount numeric(12, 2) check (target_amount is null or target_amount >= 0),
  start_date date,
  end_date date,
  is_archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_end_after_start check (end_date is null or start_date is null or end_date >= start_date)
);

comment on table public.projects is 'A big, open-ended spending goal (e.g. "Wedding", "House Renovation") that transactions can optionally link to, for cumulative spend tracking.';
comment on column public.projects.target_amount is 'Optional budget/target for the project. NULL means "just track total spent, no target".';

create index if not exists projects_user_idx on public.projects (user_id) where not is_archived;

drop trigger if exists set_updated_at on public.projects;
create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- transactions: optional project link
-- ---------------------------------------------------------------------------
alter table public.transactions
  add column if not exists project_id uuid references public.projects (id) on delete set null;

comment on column public.transactions.project_id is 'Optional link to a spending project. Only ever set for type = expense.';

alter table public.transactions drop constraint if exists transactions_project_only_for_expense;
alter table public.transactions
  add constraint transactions_project_only_for_expense
    check (project_id is null or type = 'expense');

create index if not exists transactions_user_project_idx on public.transactions (user_id, project_id);

-- ---------------------------------------------------------------------------
-- project_spend: projects with live cumulative spend, derived from linked
-- expense transactions. security_invoker = true so this always runs under
-- the caller's own RLS, same as account_balances.
-- ---------------------------------------------------------------------------
create or replace view public.project_spend
  with (security_invoker = true) as
select
  p.id,
  p.user_id,
  p.name,
  p.icon,
  p.color,
  p.target_amount,
  p.start_date,
  p.end_date,
  p.is_archived,
  p.sort_order,
  coalesce(sum(t.amount) filter (where t.type = 'expense'), 0) as spent,
  count(t.id) filter (where t.type = 'expense') as transaction_count,
  p.created_at,
  p.updated_at
from public.projects p
left join public.transactions t
  on t.user_id = p.user_id and t.project_id = p.id
group by p.id;

comment on view public.project_spend is 'Projects with live cumulative spend and transaction count computed from linked expense transactions.';

grant select on public.project_spend to authenticated;

-- =============================================================================
-- Still on the roadmap: savings_goals (accumulating toward a target, the
-- inverse of projects), bills, loans, receipts (OCR), households. See
-- 0001_init.sql for the original full list.
-- =============================================================================
