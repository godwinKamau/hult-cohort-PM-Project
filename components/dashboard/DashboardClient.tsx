"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProjectDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/states/EmptyState";
import { createProjectAction } from "@/actions/projects";
import { updateGithubUsernameAction } from "@/actions/user";

interface DashboardClientProps {
  projects: ProjectDTO[];
  githubUsername?: string;
}

export function DashboardClient({
  projects,
  githubUsername = "",
}: DashboardClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ghUser, setGhUser] = useState(githubUsername);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const result = await createProjectAction({
      name: name.trim(),
      description: description.trim(),
    });
    if (result.success && result.project) {
      router.push(`/projects/${result.project.id}`);
    }
    setCreating(false);
  };

  const handleSaveGithub = async () => {
    await updateGithubUsernameAction(ghUser);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xl text-primary">./projects</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "cancel()" : "new_project()"}
        </Button>
      </div>

      <div className="border border-primary/20 rounded p-4 bg-black-light/20">
        <Label htmlFor="gh-user">--github_username</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="gh-user"
            value={ghUser}
            onChange={(e) => setGhUser(e.target.value)}
            placeholder="your-github-handle"
            className="max-w-xs"
          />
          <Button size="sm" variant="outline" onClick={handleSaveGithub}>
            save
          </Button>
        </div>
        <p className="font-mono text-xs text-muted-foreground mt-1">
          &gt; used_to_match_github_push_events_to_your_account
        </p>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="cyber-border bg-black-light/30 rounded p-6 space-y-4"
        >
          <div>
            <Label htmlFor="name">--name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="desc">--description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? "creating…" : "create_project()"}
          </Button>
        </form>
      )}

      {projects.length === 0 ? (
        <EmptyState
          title="no_projects_found"
          lines={["> $ create_your_first_project"]}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="cyber-border bg-black-light/30 border-primary/20 hover:border-primary/50 transition-all duration-300 rounded p-4 group"
            >
              <h3 className="font-mono text-primary mb-2">{project.name}</h3>
              <p className="font-mono text-sm text-muted-foreground line-clamp-2">
                {project.description || "No description"}
              </p>
              {project.github.repoFullName && (
                <p className="font-mono text-xs text-green-dark mt-2">
                  [{project.github.repoFullName}]
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
