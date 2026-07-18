"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  setProjectGithubAction,
  verifyProjectGithubRepoAction,
} from "@/actions/projects";
import { cn } from "@/lib/cn";

interface ProjectSettingsProps {
  projectId: string;
  githubUsername?: string;
  repoFullName?: string;
  branch?: string;
}

function parseRepoFullName(fullName: string): { owner: string; repo: string } {
  const trimmed = fullName.trim();
  const slashIndex = trimmed.indexOf("/");
  if (slashIndex <= 0) {
    return { owner: "", repo: trimmed };
  }

  return {
    owner: trimmed.slice(0, slashIndex),
    repo: trimmed.slice(slashIndex + 1),
  };
}

function normalizeOwnerInput(value: string): string {
  return value.trim().replace(/^@/, "");
}

function normalizeRepoInput(value: string, owner: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const normalizedOwner = normalizeOwnerInput(owner);
  if (normalizedOwner && trimmed.startsWith(`${normalizedOwner}/`)) {
    return trimmed.slice(normalizedOwner.length + 1);
  }

  const slashIndex = trimmed.indexOf("/");
  if (slashIndex > 0) {
    return trimmed.slice(slashIndex + 1);
  }

  return trimmed;
}

export function ProjectSettings({
  projectId,
  githubUsername = "",
  repoFullName = "",
  branch = "",
}: ProjectSettingsProps) {
  const initial = parseRepoFullName(repoFullName);
  const [repoOwner, setRepoOwner] = useState(
    () => initial.owner || githubUsername
  );
  const [repoName, setRepoName] = useState(() => initial.repo);
  const [branchName, setBranchName] = useState(branch);
  const [branches, setBranches] = useState<string[]>(branch ? [branch] : []);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = useCallback(async () => {
    const owner = normalizeOwnerInput(repoOwner);
    const repo = normalizeRepoInput(repoName, owner);

    if (!owner) {
      setMessage("> error: owner_required");
      setVerified(false);
      return;
    }

    if (!repo) {
      setMessage("> error: repository_name_required");
      setVerified(false);
      return;
    }

    setVerifying(true);
    setMessage("");

    const result = await verifyProjectGithubRepoAction(owner, repo);

    if (result.success && result.branches) {
      setRepoOwner(owner);
      setRepoName(repo);
      setBranches(result.branches);
      setVerified(true);

      setBranchName((currentBranch) => {
        if (currentBranch && result.branches?.includes(currentBranch)) {
          return currentBranch;
        }
        if (
          result.defaultBranch &&
          result.branches?.includes(result.defaultBranch)
        ) {
          return result.defaultBranch;
        }
        return result.branches?.[0] ?? "";
      });

      setMessage("> repo_verified: ok");
    } else {
      setVerified(false);
      setBranches([]);
      setMessage(`> error: ${result.error ?? "verification_failed"}`);
    }

    setVerifying(false);
  }, [repoName, repoOwner]);

  useEffect(() => {
    if (!repoFullName) return;

    let cancelled = false;
    const { owner, repo } = parseRepoFullName(repoFullName);
    if (!owner || !repo) return;

    async function autoVerify() {
      setVerifying(true);
      setMessage("");

      const result = await verifyProjectGithubRepoAction(owner, repo);
      if (cancelled) return;

      if (result.success && result.branches) {
        setRepoOwner(owner);
        setRepoName(repo);
        setBranches(result.branches);
        setVerified(true);

        setBranchName((currentBranch) => {
          if (currentBranch && result.branches?.includes(currentBranch)) {
            return currentBranch;
          }
          if (branch && result.branches?.includes(branch)) {
            return branch;
          }
          if (
            result.defaultBranch &&
            result.branches?.includes(result.defaultBranch)
          ) {
            return result.defaultBranch;
          }
          return result.branches?.[0] ?? "";
        });

        setMessage("> repo_verified: ok");
      } else {
        setVerified(false);
        setBranches([]);
        setMessage(`> error: ${result.error ?? "verification_failed"}`);
      }

      setVerifying(false);
    }

    void autoVerify();

    return () => {
      cancelled = true;
    };
  }, [branch, repoFullName]);

  const handleOwnerChange = (value: string) => {
    setRepoOwner(normalizeOwnerInput(value));
    setVerified(false);
    setBranches([]);
    setMessage("");
  };

  const handleRepoChange = (value: string) => {
    setRepoName(normalizeRepoInput(value, repoOwner));
    setVerified(false);
    setBranches([]);
    setMessage("");
  };

  const handleSave = async () => {
    if (!verified) {
      setMessage("> error: verify_repo_before_linking");
      return;
    }

    if (!branchName) {
      setMessage("> error: branch_required");
      return;
    }

    setSaving(true);
    const result = await setProjectGithubAction(projectId, {
      owner: repoOwner,
      repoName,
      branch: branchName,
    });
    setMessage(result.success ? "> github_linked: ok" : `> error: ${result.error}`);
    setSaving(false);
  };

  return (
    <div className="space-y-3 border border-primary/20 rounded p-4 bg-black-light/20">
      <p className="font-mono text-xs text-primary">github.config</p>

      <div>
        <Label htmlFor="owner">--owner</Label>
        <Input
          id="owner"
          value={repoOwner}
          onChange={(e) => handleOwnerChange(e.target.value)}
          placeholder={githubUsername || "github-username"}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="repo">--repo</Label>
        <Input
          id="repo"
          value={repoName}
          onChange={(e) => handleRepoChange(e.target.value)}
          placeholder="my-repo"
          className="mt-1"
        />
        <p className="font-mono text-xs text-muted-foreground mt-1">
          &gt; tracks {repoOwner || "owner"}/{repoName || "repo"}
        </p>
      </div>

      <div>
        <Label htmlFor="branch">--branch</Label>
        <Select
          value={branchName || undefined}
          onValueChange={setBranchName}
          disabled={!verified || branches.length === 0}
        >
          <SelectTrigger id="branch" className="mt-1">
            <SelectValue
              placeholder={
                verified ? "select_branch" : "verify_repo_to_load_branches"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {branches.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleVerify}
          disabled={verifying || !repoOwner.trim() || !repoName.trim()}
        >
          {verifying ? "verifying…" : "verify_repo()"}
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving || !verified || !branchName}
        >
          {saving ? "linking…" : "link_repo()"}
        </Button>
      </div>

      {message && (
        <p
          className={cn(
            "font-mono text-xs",
            message.startsWith("> error:")
              ? "text-destructive"
              : "text-green-dark"
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}
