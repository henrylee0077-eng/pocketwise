-- =============================================================================
-- PocketWise (省省账) — Phase 6: user-selectable preferred currency.
--
-- `profiles.preferred_currency` and `accounts.currency` have existed since
-- day one (0001_init.sql / 0003_phase2.sql) but were never actually exposed
-- to users — every account silently defaulted to MYR. This migration doesn't
-- change the schema at all; it adds one RPC so changing your currency is a
-- single atomic, safe operation instead of a raw client-side update.
--
-- Design note: PocketWise treats currency as one setting per user, not a
-- full multi-currency ledger with exchange rates — every account a user
-- creates is denominated in their `preferred_currency`. Changing it re-labels
-- all of the user's existing accounts to match (no conversion math, since
-- there's only ever one currency in play for a given user). True multi-
-- currency accounting (mixed-currency accounts + FX rates) is a larger,
-- separate feature — this lays the groundwork (the currency column already
-- exists on every account) without taking on that complexity now.
-- =============================================================================

create or replace function public.set_preferred_currency(new_currency text)
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

  if new_currency !~ '^[A-Z]{3}$' then
    raise exception 'Currency must be a 3-letter ISO 4217 code';
  end if;

  update public.profiles
    set preferred_currency = new_currency,
        updated_at = now()
    where id = uid;

  -- Re-label every existing account to the new currency too — PocketWise is
  -- single-currency-per-user, so there's no such thing as "this one account
  -- stays in the old currency" without also wiring up conversion, which is
  -- out of scope here.
  update public.accounts
    set currency = new_currency,
        updated_at = now()
    where user_id = uid;
end;
$$;

comment on function public.set_preferred_currency(text) is 'Atomically sets the calling user''s preferred_currency and re-labels all of their existing accounts to match. No FX conversion — PocketWise is single-currency-per-user by design.';

revoke execute on function public.set_preferred_currency(text) from public;
grant execute on function public.set_preferred_currency(text) to authenticated;
