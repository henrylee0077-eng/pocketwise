"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AccountIcon } from "@/components/accounts/AccountIconPicker";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useAccounts } from "@/hooks/use-accounts";

export function AccountPicker({
  value,
  onChange,
  placeholder,
  excludeId,
}: {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  /** Hide one account from the list — used for the "to" picker in a transfer so you can't pick the same account twice. */
  excludeId?: string;
}) {
  const { t } = useLanguage();
  const { data: accounts = [] } = useAccounts();
  const options = accounts.filter((a) => !a.is_archived && a.id !== excludeId);

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? t("accounts.selectAccount")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <span className="flex items-center gap-2">
              <AccountIcon name={account.icon} className="size-4 text-muted-foreground" />
              {account.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
