import { AppHeader } from "./AppHeader";
import { NotificationBanner } from "@/components/banner/NotificationBanner";
import { TerminalToastProvider } from "@/components/ui/terminal-toast";

interface AppShellProps {
  children: React.ReactNode;
  orgSlug?: string;
}

export function AppShell({ children, orgSlug }: AppShellProps) {
  return (
    <TerminalToastProvider>
      <div className="min-h-screen flex flex-col">
        <AppHeader orgSlug={orgSlug} />
        <NotificationBanner />
        <main className="flex-1 pt-28 pb-8 px-4 container mx-auto">{children}</main>
      </div>
    </TerminalToastProvider>
  );
}
