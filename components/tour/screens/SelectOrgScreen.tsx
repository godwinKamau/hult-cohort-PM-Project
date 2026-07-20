"use client";

import { Plus, Terminal } from "lucide-react";
import { TerminalPanel } from "@/components/states/TerminalPanel";
import { useTourTarget } from "../TourTargetContext";

export function SelectOrgScreen() {
  const orgPanelRef = useTourTarget("org-panel");

  return (
    <div className="min-h-[320px] matrix-bg">
      <header className="border-b border-primary/20 bg-black-deep/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center space-x-2">
            <Terminal className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm text-primary">root@pending_org</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-md space-y-4">
          <TerminalPanel
            title="org.select"
            lines={[
              "> error: no_active_org",
              "> $ join_or_create_org",
              "> check_notifications_for_pending_invites",
            ]}
            showCursor={false}
          />

          <div
            ref={orgPanelRef}
            className="cyber-border rounded bg-black-light/30 p-4"
          >
            <div className="space-y-2">
              <button
                type="button"
                tabIndex={-1}
                className="pointer-events-none flex w-full items-center gap-3 rounded border border-dashed border-primary/40 bg-primary/5 px-3 py-3 text-left"
              >
                <Plus className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm text-primary">
                  Create organization
                </span>
              </button>

              <div className="rounded border border-primary/20 bg-black-deep/40">
                <button
                  type="button"
                  tabIndex={-1}
                  className="pointer-events-none flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-primary/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded bg-primary/15 font-mono text-xs text-primary">
                    H
                  </span>
                  <div>
                    <span className="block font-mono text-sm text-primary">
                      Hult Hackathon
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      4 members · Admin
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
