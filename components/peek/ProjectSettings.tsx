"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  listProjectGithubReposAction,
  setProjectGithubAction,
  verifyProjectGithubRepoAction,
} from "@/actions/projects";
import { inviteToProjectAction, inviteToProjectByEmailAction } from "@/actions/invites";
import { ALL_BRANCHES, branchLabel, isAllBranches } from "@/lib/github-branches";
import { cn } from "@/lib/cn";
import {
  formatPendingInviteStatus,
  getInviteEmptyHelperText,
  getInviteEmptyPlaceholder,
  getInviteEmptyReason,
  resolvePendingInviteDisplayName,
} from "@/lib/project-members";
import type { OrgMemberDTO, ProjectInviteDTO } from "@/lib/types";

interface ProjectSettingsProps {
  projectId: string;
  githubUsername?: string;
  repoFullName?: string;
  branch?: string;
  members: OrgMemberDTO[];
  projectMembers: string[];
  projectCreatorId: string;
  pendingInvites: ProjectInviteDTO[];
  currentUserId: string;
}

function SettingsWindow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded border border-primary/20 bg-black-light/20">
      <div className="flex items-center gap-2 border-b border-primary/20 bg-black-light/50 px-3 py-2">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        <span className="font-mono text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
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

function resolveInitialRepoOwner(
  repoFullName: string,
  githubUsername: string
): string {
  const linkedRepo = repoFullName.trim();
  if (linkedRepo) {
    const { owner } = parseRepoFullName(linkedRepo);
    if (owner) {
      return owner;
    }
  }

  return normalizeOwnerInput(githubUsername);
}

function resolveBranchSelection(
  currentBranch: string,
  savedBranch: string | undefined,
  availableBranches: string[]
): string {
  if (isAllBranches(currentBranch)) {
    return ALL_BRANCHES;
  }

  if (currentBranch && availableBranches.includes(currentBranch)) {
    return currentBranch;
  }

  if (
    savedBranch &&
    !isAllBranches(savedBranch) &&
    availableBranches.includes(savedBranch)
  ) {
    return savedBranch;
  }

  return ALL_BRANCHES;
}

export function ProjectSettings({
  projectId,
  githubUsername = "",
  repoFullName = "",
  branch = "",
  members,
  projectMembers,
  projectCreatorId,
  pendingInvites,
  currentUserId,
}: ProjectSettingsProps) {
  const router = useRouter();
  const initial = parseRepoFullName(repoFullName);
  const hasLinkedRepo = Boolean(repoFullName.trim());
  const [repoOwner, setRepoOwner] = useState(() =>
    resolveInitialRepoOwner(repoFullName, githubUsername)
  );
  const [repoName, setRepoName] = useState(() => initial.repo);
  const [branchName, setBranchName] = useState(() =>
    branch && !isAllBranches(branch) ? branch : ALL_BRANCHES
  );
  const [branches, setBranches] = useState<string[]>(
    branch && !isAllBranches(branch) ? [branch] : []
  );
  const [ownerRepos, setOwnerRepos] = useState<string[]>(
    initial.repo ? [initial.repo] : []
  );
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedInvitee, setSelectedInvitee] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMode, setInviteMode] = useState<"organization" | "email">(
    "organization"
  );
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");

  const canManageMembers = useMemo(
    () =>
      projectCreatorId === currentUserId ||
      projectMembers.includes(currentUserId),
    [projectCreatorId, currentUserId, projectMembers]
  );

  const memberNameById = useMemo(
    () => new Map(members.map((member) => [member.clerkUserId, member.name])),
    [members]
  );

  const allMemberIds = useMemo(() => {
    const ids = new Set(projectMembers);
    ids.add(projectCreatorId);
    return ids;
  }, [projectMembers, projectCreatorId]);

  const pendingInviteeIds = useMemo(
    () => new Set(pendingInvites.map((invite) => invite.inviteeClerkId)),
    [pendingInvites]
  );

  const inviteCandidates = useMemo(
    () =>
      members.filter(
        (member) =>
          member.clerkUserId !== currentUserId &&
          !allMemberIds.has(member.clerkUserId) &&
          !pendingInviteeIds.has(member.clerkUserId)
      ),
    [members, currentUserId, allMemberIds, pendingInviteeIds]
  );

  const displayedMembers = useMemo(() => {
    const ids = [...allMemberIds];
    return ids
      .filter((id) => memberNameById.has(id))
      .map((id) => ({
        id,
        name: memberNameById.get(id)!,
        isCreator: id === projectCreatorId,
      }));
  }, [allMemberIds, memberNameById, projectCreatorId]);

  const inviteEmptyReason = useMemo(
    () =>
      getInviteEmptyReason(members, currentUserId, inviteCandidates.length),
    [members, currentUserId, inviteCandidates.length]
  );

  const inviteEmptyHelperText = useMemo(
    () => getInviteEmptyHelperText(inviteEmptyReason, pendingInvites.length),
    [inviteEmptyReason, pendingInvites.length]
  );

  const inviteSelectPlaceholder = useMemo(
    () => getInviteEmptyPlaceholder(inviteEmptyReason),
    [inviteEmptyReason]
  );

  const inviteSelectHelperId = `invite-member-helper-${projectId}`;
  const githubRepoHelperId = `github-repo-helper-${projectId}`;
  const githubBranchHelperId = `github-branch-helper-${projectId}`;

  const repoSelectPlaceholder = useMemo(() => {
    if (!normalizeOwnerInput(repoOwner)) {
      return "Enter an owner first";
    }

    if (loadingRepos) {
      return "Loading repos…";
    }

    if (ownerRepos.length > 0) {
      return "Select a repo";
    }

    return "No repos for this owner";
  }, [loadingRepos, ownerRepos.length, repoOwner]);

  const branchHelperText = useMemo(() => {
    if (!verified) {
      return "";
    }

    if (isAllBranches(branchName)) {
      return "> Tracks activity across all branches in this repo";
    }

    return `> Tracks ${branchLabel(branchName)} only`;
  }, [branchName, verified]);

  const handleVerify = useCallback(async () => {
    const owner = normalizeOwnerInput(repoOwner);
    const repo = normalizeRepoInput(repoName, owner);

    if (!owner) {
      setMessage("> error: Owner required");
      setVerified(false);
      return;
    }

    if (!repo) {
      setMessage("> error: Repository name required");
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

      setBranchName((currentBranch) =>
        resolveBranchSelection(currentBranch, branch, result.branches ?? [])
      );

      setMessage("> Repository verified ✓");
    } else {
      setVerified(false);
      setBranches([]);
      setMessage(`> error: ${result.error ?? "Verification failed — try again"}`);
    }

    setVerifying(false);
  }, [branch, repoName, repoOwner]);

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

        setBranchName((currentBranch) =>
          resolveBranchSelection(currentBranch, branch, result.branches ?? [])
        );

        setMessage("> Repository verified ✓");
      } else {
        setVerified(false);
        setBranches([]);
        setMessage(`> error: ${result.error ?? "Verification failed — try again"}`);
      }

      setVerifying(false);
    }

    void autoVerify();

    return () => {
      cancelled = true;
    };
  }, [branch, repoFullName]);

  useEffect(() => {
    if (hasLinkedRepo) return;

    const handle = normalizeOwnerInput(githubUsername);
    if (!handle) return;

    setRepoOwner((current) => (current.trim() ? current : handle));
  }, [githubUsername, hasLinkedRepo]);

  useEffect(() => {
    let cancelled = false;

    async function loadRepos() {
      const owner = normalizeOwnerInput(repoOwner);
      if (!owner) {
        setOwnerRepos([]);
        setLoadingRepos(false);
        return;
      }

      setLoadingRepos(true);
      const result = await listProjectGithubReposAction(owner);
      if (cancelled) return;

      if (result.success && result.repos) {
        const merged = new Set(result.repos);
        if (repoName) {
          merged.add(repoName);
        }
        setOwnerRepos([...merged].sort((left, right) => left.localeCompare(right)));
      } else {
        setOwnerRepos(repoName ? [repoName] : []);
      }

      setLoadingRepos(false);
    }

    const timeoutId = window.setTimeout(() => {
      void loadRepos();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [repoName, repoOwner]);

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
    setBranchName(ALL_BRANCHES);
    setMessage("");
  };

  const handleSave = async () => {
    if (!verified) {
      setMessage("> error: Verify the repo before linking");
      return;
    }

    if (!branchName) {
      setMessage("> error: Branch required");
      return;
    }

    setSaving(true);
    const result = await setProjectGithubAction(projectId, {
      owner: repoOwner,
      repoName,
      branch: branchName,
    });
    setMessage(result.success ? "> Repository linked ✓" : `> error: ${result.error}`);
    setSaving(false);
  };

  const handleInvite = async () => {
    if (!selectedInvitee) {
      setInviteMessage("> error: Select a member");
      return;
    }

    setInviting(true);
    setInviteMessage("");
    const result = await inviteToProjectAction(projectId, selectedInvitee);
    if (result.success) {
      setSelectedInvitee("");
      setInviteMessage("> Invite sent ✓");
      router.refresh();
    } else {
      setInviteMessage(`> error: ${result.error ?? "Invite failed — try again"}`);
    }
    setInviting(false);
  };

  const handleEmailInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteMessage("> error: Email required");
      return;
    }

    setInviting(true);
    setInviteMessage("");
    const result = await inviteToProjectByEmailAction(
      projectId,
      inviteEmail.trim()
    );
    if (result.success) {
      setInviteEmail("");
      setInviteMessage("> Invite sent ✓");
      router.refresh();
    } else {
      setInviteMessage(`> error: ${result.error ?? "Invite failed — try again"}`);
    }
    setInviting(false);
  };

  return (
    <div className="space-y-4">
      {canManageMembers && (
        <SettingsWindow title="members.config">
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            Invite teammates from your organization, or send an email invite
            for collaborators outside your org.
          </p>

          <div className="space-y-3 border-t border-primary/15 pt-3">
            <span className="font-mono text-sm font-medium tracking-wide text-primary">
              --invite
            </span>

            <div
              className="grid grid-cols-2 rounded border border-primary/20 bg-black-light/20 p-0.5"
              role="group"
              aria-label="Invite method"
            >
              {(
                [
                  { id: "organization", label: "From org" },
                  { id: "email", label: "By email" },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={inviteMode === id}
                  onClick={() => {
                    setInviteMode(id);
                    setInviteMessage("");
                  }}
                  className={cn(
                    "rounded px-2 py-1 font-mono text-xs transition-colors",
                    inviteMode === id
                      ? "border border-primary/30 bg-primary/15 text-primary"
                      : "border border-transparent text-muted-foreground hover:text-primary"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {inviteMode === "organization" ? (
              <div className="space-y-1">
                <Label
                  htmlFor={`invite-member-${projectId}`}
                  className="text-xs font-normal text-foreground"
                >
                  Org member
                </Label>
                <Select
                  value={selectedInvitee || undefined}
                  onValueChange={setSelectedInvitee}
                  disabled={inviteCandidates.length === 0}
                >
                  <SelectTrigger
                    id={`invite-member-${projectId}`}
                    aria-describedby={
                      inviteEmptyHelperText ? inviteSelectHelperId : undefined
                    }
                  >
                    <SelectValue placeholder={inviteSelectPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {inviteCandidates.map((member) => (
                      <SelectItem
                        key={member.clerkUserId}
                        value={member.clerkUserId}
                      >
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {inviteEmptyHelperText && (
                  <p
                    id={inviteSelectHelperId}
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "font-mono text-xs",
                      inviteEmptyReason === "solo_org"
                        ? "text-primary/90"
                        : "text-foreground/80"
                    )}
                  >
                    {inviteEmptyHelperText}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Label
                  htmlFor="invite-email"
                  className="text-xs font-normal text-foreground"
                >
                  Email
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@example.com"
                />
                <p className="font-mono text-xs text-foreground/80">
                  &gt; Sends an organization and project invite via email
                </p>
              </div>
            )}

            <div>
              {inviteMode === "organization" ? (
                <Button
                  size="sm"
                  onClick={handleInvite}
                  disabled={inviting || !selectedInvitee}
                >
                  {inviting ? "inviting…" : "invite()"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleEmailInvite}
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? "inviting…" : "invite()"}
                </Button>
              )}
            </div>

            {inviteMessage && (
              <p
                role="status"
                aria-live="polite"
                className={cn(
                  "font-mono text-xs",
                  inviteMessage.startsWith("> error:")
                    ? "text-destructive"
                    : "text-green-dark"
                )}
              >
                {inviteMessage}
              </p>
            )}
          </div>

          <details className="group rounded border border-primary/20 bg-black-light/10">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 font-mono text-xs text-primary [&::-webkit-details-marker]:hidden">
              <ChevronDown
                aria-hidden="true"
                className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              />
              --current_members
              <span className="text-muted-foreground">
                ({displayedMembers.length})
              </span>
            </summary>
            <ul className="space-y-1.5 border-t border-primary/15 px-3 py-2">
              {displayedMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-2 font-mono text-xs"
                >
                  <span className="text-foreground">&gt; {member.name}</span>
                  {member.isCreator && (
                    <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-xs text-primary/80">
                      creator
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </details>

          {pendingInvites.length > 0 && (
            <div>
              <Label className="text-foreground">--pending_invites</Label>
              <ul className="mt-2 space-y-1.5">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="flex items-center justify-between gap-2 font-mono text-xs"
                  >
                    <span className="text-muted-foreground">
                      &gt;{" "}
                      {resolvePendingInviteDisplayName(
                        invite.inviteeClerkId,
                        invite.inviteeEmail,
                        memberNameById
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-primary/70">
                      {formatPendingInviteStatus(invite.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </SettingsWindow>
      )}

      <SettingsWindow title="github.config">
        <p className="font-mono text-xs leading-relaxed text-muted-foreground">
          Set the repository owner and name, verify the repo, choose a branch,
          then link the repo to receive GitHub push and pull request events.
        </p>

        <div className="space-y-3 border-t border-primary/15 pt-3">
          <span className="font-mono text-sm font-medium tracking-wide text-primary">
            --repository
          </span>

          <div className="space-y-1">
            <Label
              htmlFor="owner"
              className="text-xs font-normal text-foreground"
            >
              Owner
            </Label>
            <Input
              id="owner"
              value={repoOwner}
              onChange={(e) => handleOwnerChange(e.target.value)}
              placeholder={githubUsername || "GitHub username"}
            />
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="repo"
              className="text-xs font-normal text-foreground"
            >
              Repository
            </Label>
            <SearchableSelect
              id="repo"
              value={repoName}
              options={ownerRepos}
              onChange={handleRepoChange}
              placeholder={repoSelectPlaceholder}
              searchPlaceholder="Search repos…"
              emptyMessage="No matching repos"
              disabled={!normalizeOwnerInput(repoOwner)}
              loading={loadingRepos}
              aria-describedby={githubRepoHelperId}
            />
            <p
              id={githubRepoHelperId}
              className="font-mono text-xs text-foreground/80"
            >
              &gt; Tracks {repoOwner || "owner"}/{repoName || "repo"}
            </p>
          </div>

          <div className="space-y-1">
            <Label
              htmlFor="branch"
              className="text-xs font-normal text-foreground"
            >
              Branch
            </Label>
            <Select
              value={branchName || undefined}
              onValueChange={setBranchName}
              disabled={!verified}
            >
              <SelectTrigger
                id="branch"
                aria-describedby={
                  branchHelperText ? githubBranchHelperId : undefined
                }
              >
                <SelectValue
                  placeholder={
                    verified
                      ? "Select a branch"
                      : "Verify the repo to load branches"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
                {branches.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {branchHelperText && (
              <p
                id={githubBranchHelperId}
                role="status"
                aria-live="polite"
                className="font-mono text-xs text-foreground/80"
              >
                {branchHelperText}
              </p>
            )}
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
              role="status"
              aria-live="polite"
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
      </SettingsWindow>
    </div>
  );
}
