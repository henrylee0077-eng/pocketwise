-- =============================================================================
-- PocketWise (省省账) — Phase 5: broader Malaysian payment method defaults.
--
-- The original five (cash, debit card, credit card, bank transfer, generic
-- e-wallet) don't cover common Malaysian payment rails users actually name
-- in quick-add (cheque, Touch 'n Go eWallet, GrabPay, ShopeePay, Boost,
-- DuitNow). Adding them as system defaults (user_id IS NULL) makes them
-- selectable in the manual form picker and directly matchable by name in
-- the quick-add AI prompt, rather than relying on the generic "E-Wallet"
-- catch-all or the AI's newPaymentMethodName auto-create escape hatch.
-- =============================================================================

insert into public.payment_methods (user_id, key, name_en, name_zh, icon, sort_order)
values
  (null, 'cheque',         'Cheque',              '支票',              'FileText',  6),
  (null, 'tng_ewallet',    'Touch ''n Go eWallet', 'Touch ''n Go 电子钱包', 'Smartphone', 7),
  (null, 'grabpay',        'GrabPay',             'GrabPay',           'Smartphone', 8),
  (null, 'shopeepay',      'ShopeePay',           '虾皮钱包',           'Smartphone', 9),
  (null, 'boost',          'Boost',               'Boost',             'Smartphone', 10),
  (null, 'duitnow',        'DuitNow',             'DuitNow',           'QrCode',    11)
on conflict do nothing;
