-- =============================================================================
-- PocketWise (省省账) — Phase 4: App-lock PIN + full account reset.
--
-- PIN design notes:
--   - A 6-digit PIN is only 1,000,000 combinations, far too weak to act as a
--     standalone credential. It is NEVER a replacement for the real Google
--     sign-in session — it is a quick-unlock convenience layered on top of
--     an already-authenticated session, checked entirely server-side inside
--     Postgres (via pgcrypto's bcrypt) so the hash and comparison logic
--     never touch the client.
--   - `pin_hash` is intentionally excluded from the app's TypeScript
--     Database types (see src/types/database.ts) — the client can read
--     `pin_enabled` (a generated column) to know whether a PIN exists, but
--     can never select the hash itself. All hashing/verification happens
--     inside SECURITY INVOKER functions below.
--   - Failed attempts are tracked per-profile with a timed lockout to
--     resist brute-forcing the small PIN space.
--
-- Reset design notes:
--   - `reset_my_account()` deletes all of the calling user's financial data
--     and clears their PIN, scoped by `auth.uid()` and re-enforced by the
--     table's existing RLS policies (SECURITY INVOKER). It never touches
--     another user's rows and never touches `auth.users` itself — signing
--     in remains possible after a reset.
-- =============================================================================

alter table public.profiles
  add column if not exists pin_hash text,
  add column if not exists pin_enabled boolean generated always as (pin_hash is not null) stored,
  add column if not exists pin_failed_attempts integer not null default 0,
  add column if not exists pin_locked_until timestamptz;

comment on column public.profiles.pin_hash is 'bcrypt hash (via pgcrypto) of the optional 6-digit app-lock PIN. NULL = PIN lock disabled. Never selected by client code.';
comment on column public.profiles.pin_enabled is 'Generated from pin_hash — safe for the client to read to know whether a PIN is set.';
comment on column public.profiles.pin_failed_attempts is 'Consecutive failed PIN attempts since the last success or lockout; drives the timed lockout.';
comment on column public.profiles.pin_locked_until is 'If set and in the future, verify_pin() short-circuits with a lockout instead of checking the PIN.';

-- ---------------------------------------------------------------------------
-- set_pin: create or replace the caller's PIN.
-- ---------------------------------------------------------------------------
create or replace function public.set_pin(new_pin text)
returns void
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  if new_pin !~ '^[0-9]{6}$' then
    raise exception 'PIN must be exactly 6 digits';
  end if;

  update public.profiles
    set pin_hash = crypt(new_pin, gen_salt('bf', 10)),
        pin_failed_attempts = 0,
        pin_locked_until = null
    where id = uid;
end;
$$;

comment on function public.set_pin(text) is 'Sets (or replaces) the calling user''s 6-digit app-lock PIN. Resets any existing lockout.';

-- ---------------------------------------------------------------------------
-- verify_pin: check a candidate PIN with brute-force lockout.
-- ---------------------------------------------------------------------------
create or replace function public.verify_pin(candidate text)
returns jsonb
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
  rec record;
  max_attempts constant int := 5;
  lockout_minutes constant int := 5;
  new_attempts int;
  lock_until timestamptz;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select pin_hash, pin_failed_attempts, pin_locked_until
    into rec
    from public.profiles
    where id = uid
    for update;

  if rec.pin_hash is null then
    return jsonb_build_object('ok', false, 'reason', 'not_set');
  end if;

  if rec.pin_locked_until is not null and rec.pin_locked_until > now() then
    return jsonb_build_object('ok', false, 'reason', 'locked', 'lockedUntil', rec.pin_locked_until);
  end if;

  if rec.pin_hash = crypt(candidate, rec.pin_hash) then
    update public.profiles
      set pin_failed_attempts = 0, pin_locked_until = null
      where id = uid;
    return jsonb_build_object('ok', true);
  end if;

  new_attempts := rec.pin_failed_attempts + 1;
  lock_until := null;

  if new_attempts >= max_attempts then
    lock_until := now() + make_interval(mins => lockout_minutes);
    new_attempts := 0;
  end if;

  update public.profiles
    set pin_failed_attempts = new_attempts, pin_locked_until = lock_until
    where id = uid;

  return jsonb_build_object(
    'ok', false,
    'reason', 'incorrect',
    'attemptsRemaining', greatest(max_attempts - new_attempts, 0),
    'lockedUntil', lock_until
  );
end;
$$;

comment on function public.verify_pin(text) is 'Verifies a candidate PIN for the calling user. Returns {ok, reason?, attemptsRemaining?, lockedUntil?}. Locks out for 5 minutes after 5 consecutive failures.';

-- ---------------------------------------------------------------------------
-- clear_pin: remove the caller's PIN (turn off app lock).
-- ---------------------------------------------------------------------------
create or replace function public.clear_pin()
returns void
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.profiles
    set pin_hash = null, pin_failed_attempts = 0, pin_locked_until = null
    where id = uid;
end;
$$;

comment on function public.clear_pin() is 'Disables app-lock PIN for the calling user.';

-- ---------------------------------------------------------------------------
-- reset_my_account: irreversibly wipe the caller's financial data.
-- ---------------------------------------------------------------------------
create or replace function public.reset_my_account()
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Order matters: transactions/recurring_transactions must go before
  -- custom categories (category_id is ON DELETE RESTRICT there).
  delete from public.transactions where user_id = uid;
  delete from public.recurring_transactions where user_id = uid;
  delete from public.category_budgets where user_id = uid;
  delete from public.budgets where user_id = uid;
  delete from public.tags where user_id = uid;
  delete from public.accounts where user_id = uid;
  delete from public.categories where user_id = uid;
  delete from public.payment_methods where user_id = uid;

  update public.profiles
    set pin_hash = null,
        pin_failed_attempts = 0,
        pin_locked_until = null
    where id = uid;
end;
$$;

comment on function public.reset_my_account() is 'Deletes all of the calling user''s financial data (transactions, accounts, recurring rules, budgets, tags, custom categories/payment methods) and clears their PIN. Irreversible. Scoped strictly to auth.uid() — never touches other users or auth.users itself.';

-- ---------------------------------------------------------------------------
-- Lock down execution to authenticated users only.
-- ---------------------------------------------------------------------------
revoke execute on function public.set_pin(text) from public;
revoke execute on function public.verify_pin(text) from public;
revoke execute on function public.clear_pin() from public;
revoke execute on function public.reset_my_account() from public;

grant execute on function public.set_pin(text) to authenticated;
grant execute on function public.verify_pin(text) to authenticated;
grant execute on function public.clear_pin() to authenticated;
grant execute on function public.reset_my_account() to authenticated;
