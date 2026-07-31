import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  formatISO,
  startOfMonth,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a number as Malaysian Ringgit, e.g. "RM 1,280.00". */
export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  return `${amount < 0 ? "-" : ""}RM ${formatted}`;
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
