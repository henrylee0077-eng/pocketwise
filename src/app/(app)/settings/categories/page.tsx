"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Pencil, Plus, Trash2 } from "lucide-react";
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
import { CategoryFormDialog } from "@/components/settings/CategoryFormDialog";
import { CategoryIcon, categoryName } from "@/components/transactions/CategoryPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";
import type { Category } from "@/types";

function CategoryRow({ category, onEdit }: { category: Category; onEdit: () => void }) {
  const { locale, t } = useLanguage();
  const deleteCategory = useDeleteCategory();

  async function handleDelete() {
    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success(t("categories.deleted"));
    } catch {
      toast.error(t("categories.deleteError"));
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${category.color}22`, color: category.color }}
      >
        <CategoryIcon name={category.icon} className="size-4.5" />
      </span>
      <p className="min-w-0 flex-1 truncate text-sm font-medium">
        {categoryName(category, locale)}
      </p>

      {category.is_system ? (
        <Lock className="size-4 shrink-0 text-muted-foreground" />
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="size-4" />
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
                <AlertDialogTitle>{t("categories.deleteConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("categories.deleteConfirmBody")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("expenses.cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>{t("expenses.delete")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

function CategorySection({
  title,
  categories,
  onEdit,
}: {
  title: string;
  categories: Category[];
  onEdit: (category: Category) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="text-sm font-semibold text-muted-foreground">{title}</h2>
      {categories.map((category) => (
        <CategoryRow key={category.id} category={category} onEdit={() => onEdit(category)} />
      ))}
    </div>
  );
}

export default function CategoriesSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: categories = [] } = useCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [defaultType, setDefaultType] = useState<"expense" | "income">("expense");

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  function openNew(type: "expense" | "income") {
    setEditingCategory(undefined);
    setDefaultType(type);
    setDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setDefaultType(category.type);
    setDialogOpen(true);
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
        <h1 className="text-xl font-semibold tracking-tight">{t("categories.title")}</h1>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => openNew("expense")}>
          <Plus className="size-4" />
          {t("categories.newExpenseCategory")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => openNew("income")}>
          <Plus className="size-4" />
          {t("categories.newIncomeCategory")}
        </Button>
      </div>

      <CategorySection
        title={t("transactions.typeExpense")}
        categories={expenseCategories}
        onEdit={openEdit}
      />
      <CategorySection
        title={t("transactions.typeIncome")}
        categories={incomeCategories}
        onEdit={openEdit}
      />

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
        defaultType={defaultType}
      />
    </div>
  );
}
