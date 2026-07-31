"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useLanguage } from "@/i18n/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";
import type { TransactionWithTags } from "@/types";

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: transaction, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: async (): Promise<TransactionWithTags> => {
      const supabase = createClient();
      const { data, error } = await supabase.from("transactions").select("*").eq("id", id).single();
      if (error) throw error;

      const { data: tagLinks, error: tagError } = await supabase
        .from("transaction_tags")
        .select("tag_id")
        .eq("transaction_id", id);
      if (tagError) throw tagError;

      return { ...data, tagIds: (tagLinks ?? []).map((l) => l.tag_id) };
    },
    enabled: !!user,
  });

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
          aria-label={t("expenses.cancel")}
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">{t("expenses.editExpense")}</h1>
      </div>

      {isLoading || !transaction ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <TransactionForm
          transaction={transaction}
          onSuccess={() => router.push("/transactions")}
          onCancel={() => router.back()}
        />
      )}
    </div>
  );
}
