"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RecurringFormDialog } from "@/components/recurring/RecurringFormDialog";
import { RecurringListItem } from "@/components/recurring/RecurringListItem";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useGenerateRecurringNow, useRecurringTransactions } from "@/hooks/use-recurring-transactions";
import type { RecurringTransaction } from "@/types";

export default function RecurringSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: rules = [], isLoading } = useRecurringTransactions();
  const generateNow = useGenerateRecurringNow();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | undefined>(undefined);

  function openNew() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(rule: RecurringTransaction) {
    setEditing(rule);
    setDialogOpen(true);
  }

  async function handleGenerateNow() {
    try {
      const result = await generateNow.mutateAsync();
      toast.success(t("recurring.generatedToast").replace("{count}", String(result.transactionsGenerated)));
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-28 pt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight">{t("recurring.title")}</h1>
      </div>

      <p className="text-sm text-muted-foreground">{t("recurring.hint")}</p>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={openNew}>
          <Plus className="size-4" />
          {t("recurring.newRule")}
        </Button>
        <Button variant="outline" size="sm" onClick={handleGenerateNow} disabled={generateNow.isPending}>
          <RefreshCw className={`size-4 ${generateNow.isPending ? "animate-spin" : ""}`} />
          {t("recurring.generateNow")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : rules.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("recurring.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rules.map((rule) => (
            <RecurringListItem key={rule.id} rule={rule} onEdit={() => openEdit(rule)} />
          ))}
        </div>
      )}

      <RecurringFormDialog open={dialogOpen} onOpenChange={setDialogOpen} rule={editing} />
    </div>
  );
}
