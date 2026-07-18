"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { inviteToProjectAction } from "@/actions/invites";
import { cn } from "@/lib/cn";
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
  members,
  projectMembers,
  projectCreatorId,
  pendingInvites,
  currentUserId,
}: ProjectSettingsProps) {
  const router = useRouter();
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
  const [selectedInvitee, setSelectedInvitee] = useState("");
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
    return ids.map((id) => ({
      id,
      name: memberNameById.get(id) ?? "Unknown member",
      isCreator: id === projectCreatorId,
    }));
  }, [allMemberIds, memberNameById, projectCreatorId]);

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

  const handleInvite = async () => {
    if (!selectedInvitee) {
      setInviteMessage("> error: select_a_member");
      return;
    }

    setInviting(true);
    setInviteMessage("");
    const result = await inviteToProjectAction(projectId, selectedInvitee);
    if (result.success) {
      setSelectedInvitee("");
      setInviteMessage("> invite_sent: ok");
      router.refresh();
    } else {
      setInviteMessage(`> error: ${result.error ?? "invite_failed"}`);
    }
    setInviting(false);
  };

  return (
    <div className="space-y-4">
      {canManageMembers && (
        <div className="space-y-3 border border-primary/20 rounded p-4 bg-black-light/20">
          <p className="font-mono text-xs text-primary">members.config</p>

          <div>
            <Label>--current_members</Label>
            <ul className="mt-2 space-y-1">
              {displayedMembers.map((member) => (
                <li
                  key={member.id}
                  className="font-mono text-xs text-muted-foreground"
                >
                  &gt; {member.name}
                  {member.isCreator ? " (creator)" : ""}
                </li>
              ))}
            </ul>
          </div>

          {pendingInvites.length > 0 && (
            <div>
              <Label>--pending_invites</Label>
              <ul className="mt-2 space-y-1">
                {pendingInvites.map((invite) => (
                  <li
                    key={invite.id}
                    className="font-mono text-xs text-muted-foreground"
                  >
                    &gt; {memberNameById.get(invite.inviteeClerkId) ?? "Unknown member"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <Label>--invite_member</Label>
            <Select
              value={selectedInvitee || undefined}
              onValueChange={setSelectedInvitee}
              disabled={inviteCandidates.length === 0}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    inviteCandidates.length > 0
                      ? "select_org_member"
                      : "no_members_available"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {inviteCandidates.map((member) => (
                  <SelectItem key={member.clerkUserId} value={member.clerkUserId}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={handleInvite}
            disabled={inviting || !selectedInvitee}
          >
            {inviting ? "inviting…" : "invite()"}
          </Button>

          {inviteMessage && (
            <p
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
      )}

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
    </div>
  );
}
