/**
 * Curated set of currencies PocketWise supports as a user's "preferred
 * currency" — the single currency the whole app (dashboard, budgets,
 * reports, quick-add AI) formats and reasons about for a given user.
 *
 * Deliberately a fixed, human-reviewed list rather than the full ISO 4217
 * table (180+ codes, many irrelevant/obsolete) — easy to extend by adding a
 * row here, no migration needed since `profiles.preferred_currency` is a
 * plain text column.
 */
export interface Currency {
  /** ISO 4217 code, e.g. "MYR". Stored as-is in `profiles.preferred_currency` and `accounts.currency`. */
  code: string;
  /** Symbol or short prefix shown before the amount, e.g. "RM", "$", "€". */
  symbol: string;
  nameEn: string;
  nameZh: string;
  /** Locale used for thousands/decimal separator conventions. */
  locale: string;
  /** Decimal places conventionally shown for this currency (most use 2; some use 0). */
  decimals: number;
}

export const CURRENCIES: Currency[] = [
  { code: "MYR", symbol: "RM", nameEn: "Malaysian Ringgit", nameZh: "马来西亚令吉", locale: "en-MY", decimals: 2 },
  { code: "SGD", symbol: "S$", nameEn: "Singapore Dollar", nameZh: "新加坡元", locale: "en-SG", decimals: 2 },
  { code: "USD", symbol: "$", nameEn: "US Dollar", nameZh: "美元", locale: "en-US", decimals: 2 },
  { code: "EUR", symbol: "€", nameEn: "Euro", nameZh: "欧元", locale: "en-IE", decimals: 2 },
  { code: "GBP", symbol: "£", nameEn: "British Pound", nameZh: "英镑", locale: "en-GB", decimals: 2 },
  { code: "AUD", symbol: "A$", nameEn: "Australian Dollar", nameZh: "澳大利亚元", locale: "en-AU", decimals: 2 },
  { code: "NZD", symbol: "NZ$", nameEn: "New Zealand Dollar", nameZh: "新西兰元", locale: "en-NZ", decimals: 2 },
  { code: "CAD", symbol: "C$", nameEn: "Canadian Dollar", nameZh: "加拿大元", locale: "en-CA", decimals: 2 },
  { code: "CHF", symbol: "CHF", nameEn: "Swiss Franc", nameZh: "瑞士法郎", locale: "de-CH", decimals: 2 },
  { code: "CNY", symbol: "¥", nameEn: "Chinese Yuan", nameZh: "人民币", locale: "zh-CN", decimals: 2 },
  { code: "HKD", symbol: "HK$", nameEn: "Hong Kong Dollar", nameZh: "港币", locale: "zh-HK", decimals: 2 },
  { code: "TWD", symbol: "NT$", nameEn: "New Taiwan Dollar", nameZh: "新台币", locale: "zh-TW", decimals: 0 },
  { code: "JPY", symbol: "¥", nameEn: "Japanese Yen", nameZh: "日元", locale: "ja-JP", decimals: 0 },
  { code: "KRW", symbol: "₩", nameEn: "South Korean Won", nameZh: "韩元", locale: "ko-KR", decimals: 0 },
  { code: "THB", symbol: "฿", nameEn: "Thai Baht", nameZh: "泰铢", locale: "th-TH", decimals: 2 },
  { code: "IDR", symbol: "Rp", nameEn: "Indonesian Rupiah", nameZh: "印尼盾", locale: "id-ID", decimals: 0 },
  { code: "PHP", symbol: "₱", nameEn: "Philippine Peso", nameZh: "菲律宾比索", locale: "en-PH", decimals: 2 },
  { code: "VND", symbol: "₫", nameEn: "Vietnamese Dong", nameZh: "越南盾", locale: "vi-VN", decimals: 0 },
  { code: "INR", symbol: "₹", nameEn: "Indian Rupee", nameZh: "印度卢比", locale: "en-IN", decimals: 2 },
  { code: "AED", symbol: "AED", nameEn: "UAE Dirham", nameZh: "阿联酋迪拉姆", locale: "ar-AE", decimals: 2 },
];

const CURRENCY_BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

/** Falls back to MYR (the app's original default) for any code not in the curated list. */
export function getCurrency(code: string): Currency {
  return CURRENCY_BY_CODE.get(code) ?? CURRENCY_BY_CODE.get("MYR")!;
}
