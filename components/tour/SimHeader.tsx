"use client";

import { Bell, ChevronDown, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTourTarget } from "./TourTargetContext";

interface SimHeaderProps {
  activeNav?: "dashboard" | "avatar";
  showInboxBadge?: boolean;
  orgName?: string;
}

export function SimHeader({
  activeNav = "dashboard",
  showInboxBadge = false,
  orgName = "Hult Hackathon",
}: SimHeaderProps) {
  const navDashboardRef = useTourTarget("nav-dashboard");
  const navAvatarRef = useTourTarget("nav-avatar");
  const inboxBellRef = useTourTarget("inbox-bell");
  const orgSwitcherRef = useTourTarget("org-switcher");

  return (
    <header className="border-b border-primary/20 bg-black-deep/80 backdrop-blur-sm">
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center space-x-2">
            <Terminal className="h-4 w-4 shrink-0 text-primary" />
            <span className="shrink-0 font-mono text-sm text-primary">
              PM_Project
            </span>
          </div>

          <nav className="hidden items-center space-x-1 sm:flex">
            <span ref={navDashboardRef} className="inline-flex">
              <Button
                variant={activeNav === "dashboard" ? "default" : "ghost"}
                size="sm"
                className="pointer-events-none font-mono text-xs"
                tabIndex={-1}
              >
                all projects
              </Button>
            </span>
            <span ref={navAvatarRef} className="inline-flex">
              <Button
                variant={activeNav === "avatar" ? "default" : "ghost"}
                size="sm"
                className="pointer-events-none font-mono text-xs"
                tabIndex={-1}
              >
                avatar
              </Button>
            </span>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <span ref={inboxBellRef} className="inline-flex">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative pointer-events-none h-8 w-8",
                  showInboxBadge && "text-primary"
                )}
                tabIndex={-1}
              >
                <Bell className="h-4 w-4" />
                {showInboxBadge && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary font-mono text-[10px] text-black">
                    1
                  </span>
                )}
              </Button>
            </span>

            <button
              ref={orgSwitcherRef}
              type="button"
              tabIndex={-1}
              className="pointer-events-none hidden items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2 py-1 sm:inline-flex"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/20 font-mono text-[10px] text-primary">
                {orgName.slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[88px] truncate font-mono text-xs text-primary">
                {orgName}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>

            <div
              className="h-8 w-8 shrink-0 rounded-full border border-primary/30 bg-primary/15"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </header>
  );
}
