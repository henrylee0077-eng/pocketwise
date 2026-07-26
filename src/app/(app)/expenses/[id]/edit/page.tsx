"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { useLanguage } from "@/i18n/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/AuthProvider";

export default function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useAuth();

  const { data: expense, isLoading } = useQuery({
    queryKey: ["expense", id],
    queryFn: async () => {
      const { data, error } = await createClient()
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
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

      {isLoading || !expense ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ExpenseForm
          expense={expense}
          onSuccess={() => router.push("/expenses")}
          onCancel={() => router.back()}
        />
      )}
    </div>
  );
}
