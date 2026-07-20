"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import type { ProjectDTO } from "@/lib/types";
import { SimHeader } from "../SimHeader";
import { useTourTarget } from "../TourTargetContext";

const DEMO_PROJECT: ProjectDTO = {
  id: "demo-project",
  name: "PM Platform",
  description: "Org-scoped kanban + GitHub banner",
  organizationId: "org_demo",
  archived: false,
  createdBy: "user_demo",
  members: ["user_demo"],
  themeColor: "#00ff41",
  github: {
    repoFullName: "you/pm-platform",
    branch: "main",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface DashboardScreenProps {
  showCreateForm?: boolean;
}

export function DashboardScreen({ showCreateForm = false }: DashboardScreenProps) {
  const newProjectRef = useTourTarget("new-project-btn");
  const createFormRef = useTourTarget("create-project-form");

  return (
    <div className="min-h-[320px]">
      <SimHeader activeNav="dashboard" />
      <div className="px-4 py-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="font-mono text-lg text-primary">./projects</h1>
            <span ref={newProjectRef} className="inline-flex">
            <Button size="sm" className="pointer-events-none font-mono" tabIndex={-1}>
              {showCreateForm ? "cancel()" : "new_project()"}
            </Button>
          </span>
          </div>

          <div className="rounded border border-primary/20 bg-black-light/20 p-4">
            <Label>--github_username</Label>
            <p className="mt-1 font-mono text-primary">@you</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              &gt; linked_from_your_github_account ·
              used_to_match_github_push_events_to_your_account
            </p>
          </div>

          {showCreateForm && (
            <div
              ref={createFormRef}
              className="cyber-border space-y-4 rounded bg-black-light/30 p-5"
            >
              <div>
                <Label htmlFor="tour-project-name">--name</Label>
                <Input
                  id="tour-project-name"
                  readOnly
                  value="PM Platform"
                  className="pointer-events-none mt-1"
                  tabIndex={-1}
                />
              </div>
              <div>
                <Label htmlFor="tour-project-desc">--description</Label>
                <Textarea
                  id="tour-project-desc"
                  readOnly
                  value="Org-scoped kanban + GitHub banner"
                  className="pointer-events-none mt-1"
                  tabIndex={-1}
                />
              </div>
              <Button
                className="pointer-events-none font-mono"
                tabIndex={-1}
              >
                create_project()
              </Button>
            </div>
          )}

          {!showCreateForm && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProjectCard project={DEMO_PROJECT} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
