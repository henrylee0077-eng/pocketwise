// Local-first data store. PocketWise used to keep every table in Supabase
// Postgres; it now keeps everything in the browser's IndexedDB via Dexie, so
// the app works fully offline and per-device storage cost never grows with
// user count. See src/lib/local-db/backup.ts for how this data gets backed
// up to (and restored from) the signed-in user's own Google Drive.
//
// Row shapes are intentionally reused from src/types (originally generated
// from the Supabase schema) so the rest of the app — components, form
// validation, dashboard/report math — didn't need to change at all when the
// storage engine underneath was swapped out.
import Dexie, { type EntityTable } from "dexie";
import type {
  Account,
  Budget,
  Category,
  CategoryBudget,
  PaymentMethod,
  Project,
  RecurringTransaction,
  Tag,
  Transaction,
} from "@/types";

/**
 * Every table that used to be scoped by `user_id` under Postgres Row Level
 * Security is now implicitly scoped to "whoever owns this device's local
 * database" — there is exactly one local user. This constant is written
 * into that column purely so the existing Row types (which require
 * `user_id: string`) stay satisfied; nothing ever reads it back to compare
 * against a real identity. The user's actual identity (if any) lives in
 * `LocalSettings.googleAccountId`, set only when they sign in for backup.
 */
export const LOCAL_USER_ID = "local-device-owner";

/** A transaction plus the tag ids attached to it, stored inline instead of
 * via a separate join table (Supabase's `transaction_tags`) — with
 * IndexedDB's modest scale there's no benefit to normalizing this out, and
 * keeping it inline means one read instead of two. */
export interface LocalTransaction extends Transaction {
  tagIds: string[];
}

/**
 * Replaces the `profiles` table plus a slice of what used to live in
 * Supabase Auth. Always exactly one row, id `"singleton"`.
 */
export interface LocalSettings {
  id: "singleton";
  displayName: string | null;
  avatarUrl: string | null;
  preferredLanguage: "en" | "zh";
  preferredCurrency: string;

  /** App-lock PIN. Hashing happens on-device via Web Crypto (PBKDF2) — see
   * src/lib/local-db/security.ts. Nothing about the PIN ever leaves the
   * device, including in backups (see backup.ts). */
  pinEnabled: boolean;
  pinHash: string | null;
  pinSalt: string | null;
  pinFailedAttempts: number;
  pinLockedUntil: string | null;

  /** Set only once the user explicitly signs in for Google Drive backup.
   * Signing in is never required to use the app itself. */
  googleAccountId: string | null;
  googleEmail: string | null;
  googleName: string | null;
  googlePicture: string | null;
  lastBackupAt: string | null;
  lastRestoreAt: string | null;

  createdAt: string;
  updatedAt: string;
}

class PocketWiseDB extends Dexie {
  categories!: EntityTable<Category, "id">;
  paymentMethods!: EntityTable<PaymentMethod, "id">;
  tags!: EntityTable<Tag, "id">;
  accounts!: EntityTable<Account, "id">;
  transactions!: EntityTable<LocalTransaction, "id">;
  projects!: EntityTable<Project, "id">;
  budgets!: EntityTable<Budget, "id">;
  categoryBudgets!: EntityTable<CategoryBudget, "id">;
  recurringTransactions!: EntityTable<RecurringTransaction, "id">;
  settings!: EntityTable<LocalSettings, "id">;

  constructor() {
    super("pocketwise");

    this.version(1).stores({
      categories: "id, key, type, sort_order",
      paymentMethods: "id, key, sort_order",
      tags: "id, name",
      accounts: "id, type, is_archived, sort_order",
      transactions: "id, expense_date, type, category_id, account_id, to_account_id, project_id, recurring_transaction_id, *tagIds",
      projects: "id, is_archived, sort_order",
      budgets: "id, &month",
      categoryBudgets: "id, month, category_id, &[category_id+month]",
      recurringTransactions: "id, next_run_date, is_active",
      settings: "id",
    });
  }
}

/** Singleton Dexie instance. Safe to import anywhere client-side; Dexie
 * lazily opens the underlying IndexedDB connection on first use. */
export const db = new PocketWiseDB();

export function nowIso(): string {
  return new Date().toISOString();
}

export function newId(): string {
  return crypto.randomUUID();
}
