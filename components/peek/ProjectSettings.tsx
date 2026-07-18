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

interface ProjectSettingsProps {
  projectId: string;
  githubUsername?: string;
  repoFullName?: string;
  branch?: string;
}

function parseRepoName(fullName: string, owner: string): string {
  if (!fullName) return "";
  if (owner && fullName.startsWith(`${owner}/`)) {
    return fullName.slice(owner.length + 1);
  }
  const slashIndex = fullName.indexOf("/");
  return slashIndex >= 0 ? fullName.slice(slashIndex + 1) : fullName;
}

function normalizeRepoInput(value: string, owner: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (owner && trimmed.startsWith(`${owner}/`)) {
    return trimmed.slice(owner.length + 1);
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
  const [repoName, setRepoName] = useState(() =>
    parseRepoName(repoFullName, githubUsername)
  );
  const [branchName, setBranchName] = useState(branch);
  const [branches, setBranches] = useState<string[]>(branch ? [branch] : []);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleVerify = useCallback(async () => {
    if (!githubUsername) {
      setMessage("> error: sign_in_with_github_required");
      setVerified(false);
      return;
    }

    const normalizedRepo = normalizeRepoInput(repoName, githubUsername);
    if (!normalizedRepo) {
      setMessage("> error: repository_name_required");
      setVerified(false);
      return;
    }

    setVerifying(true);
    setMessage("");

    const result = await verifyProjectGithubRepoAction(normalizedRepo);

    if (result.success && result.branches) {
      setRepoName(normalizedRepo);
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
  }, [githubUsername, repoName]);

  useEffect(() => {
    if (!repoFullName || !githubUsername) return;

    let cancelled = false;

    async function autoVerify() {
      const initialRepo = parseRepoName(repoFullName, githubUsername);
      if (!initialRepo) return;

      setVerifying(true);
      setMessage("");

      const result = await verifyProjectGithubRepoAction(initialRepo);
      if (cancelled) return;

      if (result.success && result.branches) {
        setRepoName(initialRepo);
        setBranches(result.branches);
        setVerified(true);

        setBranchName((currentBranch) => {
          if (currentBranch && result.branches?.includes(currentBranch)) {
            return currentBranch;
          }
          if (
            branch &&
            result.branches?.includes(branch)
          ) {
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
  }, [branch, githubUsername, repoFullName]);

  const handleRepoChange = (value: string) => {
    setRepoName(normalizeRepoInput(value, githubUsername));
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
      repoName,
      branch: branchName,
    });
    setMessage(result.success ? "> github_linked: ok" : `> error: ${result.error}`);
    setSaving(false);
  };

  return (
    <div className="space-y-3 border border-primary/20 rounded p-4 bg-black-light/20">
      <p className="font-mono text-xs text-primary">github.config</p>

      {!githubUsername ? (
        <p className="font-mono text-xs text-muted-foreground">
          &gt; sign_in_with_github_required
        </p>
      ) : (
        <>
          <div>
            <Label htmlFor="repo">--repo</Label>
            <div className="flex mt-1">
              <span className="inline-flex items-center rounded-l border border-r-0 border-primary/20 bg-black-light/40 px-3 font-mono text-sm text-muted-foreground">
                {githubUsername}/
              </span>
              <Input
                id="repo"
                value={repoName}
                onChange={(e) => handleRepoChange(e.target.value)}
                placeholder="my-repo"
                className="rounded-l-none"
              />
            </div>
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
              disabled={verifying || !repoName.trim()}
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
        </>
      )}

      {message && (
        <p className="font-mono text-xs text-green-dark">{message}</p>
      )}
    </div>
  );
}
