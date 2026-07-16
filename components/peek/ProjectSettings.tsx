"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { setProjectGithubAction } from "@/actions/projects";

interface ProjectSettingsProps {
  projectId: string;
  repoFullName?: string;
  branch?: string;
}

export function ProjectSettings({
  projectId,
  repoFullName = "",
  branch = "",
}: ProjectSettingsProps) {
  const [repo, setRepo] = useState(repoFullName);
  const [branchName, setBranchName] = useState(branch);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    const result = await setProjectGithubAction(projectId, {
      repoFullName: repo,
      branch: branchName,
    });
    setMessage(result.success ? "> github_linked: ok" : `> error: ${result.error}`);
    setSaving(false);
  };

  return (
    <div className="space-y-3 border border-primary/20 rounded p-4 bg-black-light/20">
      <p className="font-mono text-xs text-primary">github.config</p>
      <div>
        <Label htmlFor="repo">--repo</Label>
        <Input
          id="repo"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repo"
        />
      </div>
      <div>
        <Label htmlFor="branch">--branch</Label>
        <Input
          id="branch"
          value={branchName}
          onChange={(e) => setBranchName(e.target.value)}
          placeholder="main"
        />
      </div>
      <Button size="sm" onClick={handleSave} disabled={saving}>
        {saving ? "linking…" : "link_repo()"}
      </Button>
      {message && (
        <p className="font-mono text-xs text-green-dark">{message}</p>
      )}
    </div>
  );
}
