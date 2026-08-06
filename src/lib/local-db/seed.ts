// First-run seed data — a direct port of the default rows that used to be
// inserted by the Supabase migrations (0001_init.sql, 0002_transactions_phase1.sql,
// 0005_more_payment_methods.sql). Runs once per device the first time the
// local database is opened with no categories in it yet.
import { db, newId, nowIso } from "@/lib/local-db/schema";
import type { Category, PaymentMethod } from "@/types";

type SeedCategory = Pick<
  Category,
  "key" | "name_en" | "name_zh" | "icon" | "color" | "is_essential" | "type"
> & { sort_order: number };

const DEFAULT_EXPENSE_CATEGORIES: SeedCategory[] = [
  { key: "meals", name_en: "Meals", name_zh: "三餐", icon: "UtensilsCrossed", color: "#F59E0B", is_essential: true, type: "expense", sort_order: 1 },
  { key: "transportation", name_en: "Transportation", name_zh: "交通", icon: "Car", color: "#3B82F6", is_essential: true, type: "expense", sort_order: 2 },
  { key: "daily_necessities", name_en: "Daily Necessities", name_zh: "日用品", icon: "ShoppingBasket", color: "#10B981", is_essential: true, type: "expense", sort_order: 3 },
  { key: "medical", name_en: "Medical", name_zh: "医疗", icon: "HeartPulse", color: "#06B6D4", is_essential: true, type: "expense", sort_order: 4 },
  { key: "shopping", name_en: "Shopping", name_zh: "购物", icon: "ShoppingBag", color: "#A855F7", is_essential: false, type: "expense", sort_order: 5 },
  { key: "entertainment", name_en: "Entertainment", name_zh: "娱乐", icon: "Film", color: "#F97316", is_essential: false, type: "expense", sort_order: 6 },
  { key: "coffee_bubble_tea", name_en: "Coffee & Bubble Tea", name_zh: "咖啡/奶茶", icon: "Coffee", color: "#92400E", is_essential: false, type: "expense", sort_order: 7 },
  { key: "others", name_en: "Others", name_zh: "其他", icon: "MoreHorizontal", color: "#6B7280", is_essential: true, type: "expense", sort_order: 8 },
];

const DEFAULT_INCOME_CATEGORIES: SeedCategory[] = [
  { key: "salary", name_en: "Salary", name_zh: "工资", icon: "Wallet", color: "#0D9488", is_essential: true, type: "income", sort_order: 1 },
  { key: "bonus", name_en: "Bonus", name_zh: "奖金", icon: "Gift", color: "#F59E0B", is_essential: true, type: "income", sort_order: 2 },
  { key: "freelance", name_en: "Freelance", name_zh: "自由职业", icon: "Briefcase", color: "#3B82F6", is_essential: true, type: "income", sort_order: 3 },
  { key: "investment", name_en: "Investment", name_zh: "投资收益", icon: "TrendingUp", color: "#10B981", is_essential: true, type: "income", sort_order: 4 },
  { key: "gift_income", name_en: "Gift", name_zh: "礼金", icon: "Gift", color: "#EC4899", is_essential: true, type: "income", sort_order: 5 },
  { key: "other_income", name_en: "Other Income", name_zh: "其他收入", icon: "MoreHorizontal", color: "#6B7280", is_essential: true, type: "income", sort_order: 6 },
];

type SeedPaymentMethod = Pick<PaymentMethod, "key" | "name_en" | "name_zh" | "icon"> & {
  sort_order: number;
};

const DEFAULT_PAYMENT_METHODS: SeedPaymentMethod[] = [
  { key: "cash", name_en: "Cash", name_zh: "现金", icon: "Banknote", sort_order: 1 },
  { key: "debit_card", name_en: "Debit Card", name_zh: "借记卡", icon: "CreditCard", sort_order: 2 },
  { key: "credit_card", name_en: "Credit Card", name_zh: "信用卡", icon: "CreditCard", sort_order: 3 },
  { key: "bank_transfer", name_en: "Bank Transfer", name_zh: "银行转账", icon: "Landmark", sort_order: 4 },
  { key: "e_wallet", name_en: "E-Wallet", name_zh: "电子钱包", icon: "Smartphone", sort_order: 5 },
  { key: "cheque", name_en: "Cheque", name_zh: "支票", icon: "FileText", sort_order: 6 },
  { key: "tng_ewallet", name_en: "Touch 'n Go eWallet", name_zh: "Touch 'n Go 电子钱包", icon: "Smartphone", sort_order: 7 },
  { key: "grabpay", name_en: "GrabPay", name_zh: "GrabPay", icon: "Smartphone", sort_order: 8 },
  { key: "shopeepay", name_en: "ShopeePay", name_zh: "虾皮钱包", icon: "Smartphone", sort_order: 9 },
  { key: "boost", name_en: "Boost", name_zh: "Boost", icon: "Smartphone", sort_order: 10 },
  { key: "duitnow", name_en: "DuitNow", name_zh: "DuitNow", icon: "QrCode", sort_order: 11 },
];

/**
 * Populates system default categories/payment methods and the singleton
 * settings row the very first time the app runs on a device. Safe to call
 * on every app start — it's a no-op once seeded.
 */
export async function ensureSeeded(): Promise<void> {
  const [categoryCount, paymentMethodCount, settings] = await Promise.all([
    db.categories.count(),
    db.paymentMethods.count(),
    db.settings.get("singleton"),
  ]);

  if (categoryCount === 0) {
    const timestamp = nowIso();
    await db.categories.bulkAdd(
      [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].map((c) => ({
        id: newId(),
        user_id: null,
        is_system: true,
        created_at: timestamp,
        ...c,
      })),
    );
  }

  if (paymentMethodCount === 0) {
    const timestamp = nowIso();
    await db.paymentMethods.bulkAdd(
      DEFAULT_PAYMENT_METHODS.map((p) => ({
        id: newId(),
        user_id: null,
        created_at: timestamp,
        ...p,
      })),
    );
  }

  if (!settings) {
    const timestamp = nowIso();
    await db.settings.add({
      id: "singleton",
      displayName: null,
      avatarUrl: null,
      preferredLanguage: "en",
      preferredCurrency: "MYR",
      pinEnabled: false,
      pinHash: null,
      pinSalt: null,
      pinFailedAttempts: 0,
      pinLockedUntil: null,
      googleAccountId: null,
      googleEmail: null,
      googleName: null,
      googlePicture: null,
      lastBackupAt: null,
      lastRestoreAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}
