import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  formatISO,
  getDate,
  lastDayOfMonth,
  setDate,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { getCurrency } from "@/lib/currencies";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number in the given currency, e.g. formatCurrency(1280, "MYR")
 * -> "RM 1,280.00". Defaults to MYR for any existing call site that hasn't
 * been updated to pass a currency yet. Prefer the `useFormatCurrency` hook
 * in components so the user's `preferred_currency` is applied automatically.
 */
export function formatCurrency(amount: number, currencyCode: string = "MYR"): string {
  const currency = getCurrency(currencyCode);
  const formatted = new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(Math.abs(amount));
  return `${amount < 0 ? "-" : ""}${currency.symbol} ${formatted}`;
}

/** Formats an ISO date string (yyyy-MM-dd) for display, locale-aware. */
export function formatDisplayDate(isoDate: string, locale: "en" | "zh" = "en"): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-MY", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Today's date as an ISO yyyy-MM-dd string, safe for date inputs & DB writes. */
export function todayIso(): string {
  return formatISO(new Date(), { representation: "date" });
}

/** First day of the month containing `date`, as an ISO yyyy-MM-dd string. */
export function monthKey(date: Date = new Date()): string {
  return formatISO(startOfMonth(date), { representation: "date" });
}

export interface MonthProgress {
  totalDaysInMonth: number;
  dayOfMonth: number;
  daysRemainingIncludingToday: number;
}

/** How far through the current month we are, used for the daily-budget math. */
export function getMonthProgress(date: Date = new Date()): MonthProgress {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const totalDaysInMonth = differenceInCalendarDays(monthEnd, monthStart) + 1;
  const dayOfMonth = differenceInCalendarDays(date, monthStart) + 1;
  const daysRemainingIncludingToday = totalDaysInMonth - dayOfMonth + 1;
  return { totalDaysInMonth, dayOfMonth, daysRemainingIncludingToday };
}

export function formatMonthLabel(date: Date = new Date(), locale: "en" | "zh" = "en"): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-MY", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatInputDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Given a billing day-of-month (1-31, e.g. a credit card's `payment_due_day`),
 * returns the next occurrence on or after `from`. Clamps to the last day of
 * shorter months (e.g. day 31 in February becomes the 28th/29th) rather than
 * rolling into the next month, matching how banks bill short months.
 */
export function nextDueDateFromDay(dayOfMonth: number, from: Date = new Date()): Date {
  const today = startOfDay(from);
  const clampToMonth = (base: Date) => setDate(base, Math.min(dayOfMonth, getDate(lastDayOfMonth(base))));

  const thisMonth = clampToMonth(today);
  if (thisMonth >= today) return thisMonth;
  return clampToMonth(addMonths(today, 1));
}

/** Whole days between now and `date` (0 = due today). Always >= 0 when `date` came from {@link nextDueDateFromDay}. */
export function daysUntil(date: Date, from: Date = new Date()): number {
  return differenceInCalendarDays(startOfDay(date), startOfDay(from));
}

/**
 * Turns an account `type` value (e.g. "credit_card") into the matching
 * translation key suffix (e.g. "CreditCard", used as `accounts.type${...}`).
 * Not a general-purpose display formatter — only ever used to build that key.
 */
export function toAccountTypeKey(type: string): string {
  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

/** Turns a display name into a URL/DB-safe key, with a short unique suffix. */
export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-龥]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  const suffix = Date.now().toString(36).slice(-4);
  return `${base || "custom"}_${suffix}`;
}
