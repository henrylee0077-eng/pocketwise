"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { ProjectIcon } from "@/components/projects/ProjectIconPicker";
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";
import { Progress } from "@/components/ui/progress";
import { TransactionList } from "@/components/transactions/TransactionList";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useProjects } from "@/hooks/use-projects";
import { useProjectTransactions } from "@/hooks/use-transactions";
import { useFormatCurrency } from "@/hooks/use-currency";
import { formatDisplayDate } from "@/lib/utils";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useLanguage();
  const formatCurrency = useFormatCurrency();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: transactions = [], isLoading: transactionsLoading } = useProjectTransactions(id);
  const [editOpen, setEditOpen] = useState(false);

  const project = projects.find((p) => p.id === id);

  if (projectsLoading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-fit rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <p className="text-sm text-muted-foreground">{t("projects.notFound")}</p>
      </div>
    );
  }

  const target = project.target_amount != null ? Number(project.target_amount) : null;
  const spent = Number(project.spent);
  const usagePercent = target && target > 0 ? Math.min((spent / target) * 100, 100) : null;
  const overTarget = target != null && spent > target;

  const dateRange =
    project.start_date || project.end_date
      ? [project.start_date, project.end_date]
          .filter(Boolean)
          .map((d) => formatDisplayDate(d as string, locale))
          .join(" – ")
      : null;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pb-28 pt-6 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">{project.name}</h1>
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={t("projects.editProject")}
        >
          <Pencil className="size-4" />
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${project.color}22`, color: project.color }}
          >
            <ProjectIcon name={project.icon} className="size-5" />
          </span>
          {dateRange && <p className="text-sm text-muted-foreground">{dateRange}</p>}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">{t("projects.totalSpent")}</p>
        <p className="text-3xl font-semibold tracking-tight text-foreground">{formatCurrency(spent)}</p>

        {target != null && (
          <div className="mt-3 flex flex-col gap-1.5">
            <Progress value={usagePercent ?? 0} indicatorClassName={overTarget ? "bg-destructive" : undefined} />
            <p className={overTarget ? "text-sm font-medium text-destructive" : "text-sm text-muted-foreground"}>
              {t("projects.ofTarget", { spent: formatCurrency(spent), target: formatCurrency(target) })}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{t("accounts.transactionHistory")}</h2>
        {transactionsLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <TransactionList transactions={transactions} />
        )}
      </div>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />
    </div>
  );
}
