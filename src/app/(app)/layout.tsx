import { AppShell } from "@/components/layout/AppShell";
import { AppLockGate } from "@/components/security/AppLockGate";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLockGate>
      <AppShell>{children}</AppShell>
    </AppLockGate>
  );
}
