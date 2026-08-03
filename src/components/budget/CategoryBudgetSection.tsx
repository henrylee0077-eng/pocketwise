"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CategoryIcon, categoryName } from "@/components/transactions/CategoryPicker";
import { CategoryBudgetFormDialog } from "@/components/budget/CategoryBudgetFormDialog";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories } from "@/hooks/use-categories";
import { useDeleteCategoryBudget } from "@/hooks/use-category-budgets";
import { useFormatCurrency } from "@/hooks/use-currency";
import type { CategoryBudgetStatus } from "@/types";

export function CategoryBudgetSection({
  monthIso,
  statuses,
}: {
  monthIso: string;
  statuses: CategoryBudgetStatus[];
}) {
  const { locale, t } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const { data: categories = [] } = useCategories();
  const deleteCategoryBudget = useDeleteCategoryBudget(monthIso);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryBudgetStatus | undefined>(undefined);

  async function handleDelete(id: string) {
    try {
      await deleteCategoryBudget.mutateAsync(id);
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t("budget.categoryBudgets")}</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing(undefined);
            setDialogOpen(true);
          }}
        >
          <Plus className="size-4" />
          {t("budget.addCategoryBudget")}
        </Button>
      </div>

      {statuses.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("budget.noCategoryBudgets")}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {statuses.map((status) => {
            const category = categories.find((c) => c.id === status.categoryId);
            return (
              <div
                key={status.categoryId}
                className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-3.5"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: `${category?.color ?? "#6B7280"}22`,
                      color: category?.color ?? "#6B7280",
                    }}
                  >
                    <CategoryIcon name={category?.icon ?? "MoreHorizontal"} className="size-4" />
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(status);
                      setDialogOpen(true);
                    }}
                    className="min-w-0 flex-1 text-left text-sm font-medium"
                  >
                    {category ? categoryName(category, locale) : "—"}
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("expenses.deleteConfirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("expenses.deleteConfirmBody")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("expenses.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(status.budget.id)}>
                          {t("expenses.delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                <Progress
                  value={Math.min(status.usagePercent, 100)}
                  indicatorClassName={
                    status.exceeded ? "bg-destructive" : status.warningTriggered ? "bg-warning" : undefined
                  }
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatCurrency(status.spent)} / {formatCurrency(Number(status.budget.amount))}
                  </span>
                  <span className={status.remaining < 0 ? "font-medium text-destructive" : undefined}>
                    {formatCurrency(status.remaining)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CategoryBudgetFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        monthIso={monthIso}
        existing={editing?.budget}
        excludeCategoryIds={statuses.map((s) => s.categoryId)}
      />
    </div>
  );
}
