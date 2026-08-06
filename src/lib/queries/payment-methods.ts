import { db, LOCAL_USER_ID, newId, nowIso } from "@/lib/local-db/schema";
import type { PaymentMethod } from "@/types";
import { slugify } from "@/lib/utils";

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const rows = await db.paymentMethods.toArray();
  return rows.sort((a, b) => a.sort_order - b.sort_order);
}

export async function createPaymentMethod(values: {
  nameEn: string;
  nameZh: string;
  icon?: string;
}): Promise<PaymentMethod> {
  const row: PaymentMethod = {
    id: newId(),
    user_id: LOCAL_USER_ID,
    key: slugify(values.nameEn),
    name_en: values.nameEn,
    name_zh: values.nameZh,
    icon: values.icon ?? "Wallet",
    sort_order: 100,
    created_at: nowIso(),
  };
  await db.paymentMethods.add(row);
  return row;
}
