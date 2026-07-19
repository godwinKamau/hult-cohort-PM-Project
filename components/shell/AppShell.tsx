import { AppHeader } from "./AppHeader";
import { HeaderPathProvider } from "./HeaderPathContext";
import { NotificationBanner } from "@/components/banner/NotificationBanner";
import { FloatingAvatarsProvider } from "@/components/avatar/FloatingAvatarsProvider";
import { TerminalToastProvider } from "@/components/ui/terminal-toast";
import type { PixelAvatarDTO } from "@/lib/types";

interface AppShellProps {
  children: React.ReactNode;
  orgSlug?: string;
  myAvatar?: PixelAvatarDTO | null;
}

export function AppShell({ children, myAvatar = null }: AppShellProps) {
  return (
    <TerminalToastProvider>
      <FloatingAvatarsProvider myAvatar={myAvatar}>
        <HeaderPathProvider>
          <div className="min-h-screen flex flex-col">
            <AppHeader />
            <NotificationBanner />
            <main className="relative z-10 flex-1 pt-28 pb-8 px-4 container mx-auto">
              {children}
            </main>
          </div>
        </HeaderPathProvider>
      </FloatingAvatarsProvider>
    </TerminalToastProvider>
  );
}
