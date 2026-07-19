import { AppHeader } from "./AppHeader";
import { HeaderPathProvider } from "./HeaderPathContext";
import { NotificationBanner } from "@/components/banner/NotificationBanner";
import { TerminalToastProvider } from "@/components/ui/terminal-toast";

interface AppShellProps {
  children: React.ReactNode;
  orgSlug?: string;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TerminalToastProvider>
      <HeaderPathProvider>
        <div className="min-h-screen flex flex-col">
          <AppHeader />
          <NotificationBanner />
          <main className="flex-1 pt-28 pb-8 px-4 container mx-auto">
            {children}
          </main>
        </div>
      </HeaderPathProvider>
    </TerminalToastProvider>
  );
}
