"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimHeader } from "../SimHeader";
import { useTourTarget } from "../TourTargetContext";

function SettingsWindow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded border border-primary/35 bg-black-light/20 shadow-sm">
      <div className="flex items-center gap-3 border-b border-primary/30 bg-primary/10 px-4 py-3">
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        <span className="font-mono text-sm font-semibold tracking-wide text-primary">
          {title}
        </span>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

interface ProjectSettingsScreenProps {
  highlightGithub?: boolean;
  highlightMembers?: boolean;
}

export function ProjectSettingsScreen({
  highlightGithub = true,
  highlightMembers = false,
}: ProjectSettingsScreenProps) {
  const settingsPanelRef = useTourTarget("settings-panel");
  const linkRepoRef = useTourTarget("link-repo-btn");
  const inviteRef = useTourTarget("invite-btn");

  return (
    <div className="min-h-[360px]">
      <SimHeader activeNav="dashboard" />
      <div className="flex min-h-[300px]">
        <div className="hidden flex-1 border-r border-primary/10 bg-black-deep/30 p-4 sm:block">
          <div className="mb-3 font-mono text-sm text-primary">PM Platform</div>
          <div className="grid grid-cols-3 gap-2 opacity-60">
            {["backlog", "in_progress", "done"].map((column) => (
              <div
                key={column}
                className="rounded border border-primary/15 bg-black-light/20 p-2"
              >
                <span className="font-mono text-[10px] text-muted-foreground">
                  {column}
                </span>
                <div className="mt-2 h-12 rounded border border-primary/10 bg-black-deep/40" />
              </div>
            ))}
          </div>
        </div>

        <div
          ref={settingsPanelRef}
          className="w-full max-w-sm border-l border-primary/20 bg-black-light/10 p-4"
        >
          <div className="mb-4 font-mono text-sm text-primary">settings()</div>
          <div className="space-y-4">
            {highlightMembers && (
              <SettingsWindow title="members.config">
                <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                  Invite teammates from your organization, or send an email
                  invite for collaborators outside your org.
                </p>
                <div className="space-y-3 border-t border-primary/15 pt-3">
                  <span className="font-mono text-sm font-medium tracking-wide text-primary">
                    --invite
                  </span>
                  <div
                    className="grid grid-cols-2 rounded border border-primary/20 bg-black-light/20 p-0.5"
                    role="group"
                  >
                    <button
                      type="button"
                      tabIndex={-1}
                      className="rounded border border-primary/30 bg-primary/15 px-2 py-1 font-mono text-xs text-primary"
                    >
                      From org
                    </button>
                    <button
                      type="button"
                      tabIndex={-1}
                      className="rounded px-2 py-1 font-mono text-xs text-muted-foreground"
                    >
                      By email
                    </button>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-foreground">
                      Org member
                    </Label>
                    <Select value="nova">
                      <SelectTrigger className="pointer-events-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nova">Nova Kim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span ref={inviteRef} className="inline-flex">
                    <Button
                      size="sm"
                      className="pointer-events-none font-mono"
                      tabIndex={-1}
                    >
                      invite()
                    </Button>
                  </span>
                </div>
              </SettingsWindow>
            )}

            {highlightGithub && (
              <SettingsWindow title="github.config">
                <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                  Set the repository owner and name, verify the repo, choose a
                  branch, then link the repo to receive GitHub push events.
                </p>
                <div className="space-y-3 border-t border-primary/15 pt-3">
                  <span className="font-mono text-sm font-medium tracking-wide text-primary">
                    --repository
                  </span>
                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-foreground">
                      Owner
                    </Label>
                    <Input readOnly value="you" tabIndex={-1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-foreground">
                      Repository
                    </Label>
                    <Input readOnly value="pm-platform" tabIndex={-1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-normal text-foreground">
                      Branch
                    </Label>
                    <Select value="main">
                      <SelectTrigger className="pointer-events-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">main</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="pointer-events-none font-mono"
                      tabIndex={-1}
                    >
                      verify_repo()
                    </Button>
                    <span ref={linkRepoRef} className="inline-flex">
                      <Button
                        size="sm"
                        className="pointer-events-none font-mono"
                        tabIndex={-1}
                      >
                        link_repo()
                      </Button>
                    </span>
                  </div>
                  <p className="font-mono text-xs text-green-dark">
                    &gt; Repository verified ✓
                  </p>
                </div>
              </SettingsWindow>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
