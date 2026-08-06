import { AppShell } from "@/components/layout/AppShell";
import { AppLockGate } from "@/components/security/AppLockGate";
import { RecurringSweep } from "@/components/system/RecurringSweep";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLockGate>
      <RecurringSweep />
      <AppShell>{children}</AppShell>
    </AppLockGate>
  );
}
