"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountFormDialog } from "@/components/accounts/AccountFormDialog";
import { AccountListItem } from "@/components/accounts/AccountListItem";
import { NetWorthSummary } from "@/components/accounts/NetWorthSummary";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAccounts } from "@/hooks/use-accounts";
import type { AccountBalance } from "@/types";

export default function AccountsSettingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { data: accounts = [], isLoading } = useAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AccountBalance | undefined>(undefined);

  const active = accounts.filter((a) => !a.is_archived);
  const archived = accounts.filter((a) => a.is_archived);

  function openNew() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(account: AccountBalance) {
    setEditing(account);
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
        <h1 className="text-xl font-semibold tracking-tight">{t("accounts.title")}</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <>
          <NetWorthSummary accounts={accounts} />

          <Button variant="outline" size="sm" onClick={openNew} className="self-start">
            <Plus className="size-4" />
            {t("accounts.newAccount")}
          </Button>

          {active.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              {t("accounts.empty")}
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {active.map((account) => (
                <AccountListItem key={account.id} account={account} onEdit={() => openEdit(account)} />
              ))}
            </div>
          )}

          {archived.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <h2 className="text-sm font-semibold text-muted-foreground">{t("accounts.archived")}</h2>
              {archived.map((account) => (
                <AccountListItem key={account.id} account={account} onEdit={() => openEdit(account)} />
              ))}
            </div>
          )}
        </>
      )}

      <AccountFormDialog open={dialogOpen} onOpenChange={setDialogOpen} account={editing} />
    </div>
  );
}
