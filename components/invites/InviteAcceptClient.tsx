"use client";

import { useEffect, useState } from "react";
import type { ProjectInviteInboxDTO } from "@/lib/types";
import {
  getInviteDetailsAction,
  respondToInviteAction,
} from "@/actions/invites";
import { useInviteNavigation } from "@/components/invites/useInviteNavigation";
import { Button } from "@/components/ui/button";
import { TerminalPanel } from "@/components/states/TerminalPanel";

interface InviteAcceptClientProps {
  inviteId: string;
  autoAccept?: boolean;
}

export function InviteAcceptClient({
  inviteId,
  autoAccept = false,
}: InviteAcceptClientProps) {
  const { navigateAfterAccept } = useInviteNavigation();
  const [invite, setInvite] = useState<ProjectInviteInboxDTO | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      const result = await getInviteDetailsAction(inviteId);
      if (cancelled) return;

      if (!result.success || !result.invite) {
        setError(result.error ?? "Invite not found");
        setLoading(false);
        return;
      }

      setInvite(result.invite);
      setLoading(false);

      if (autoAccept) {
        setResponding(true);
        const acceptResult = await respondToInviteAction(inviteId, true);
        if (acceptResult.success && acceptResult.organizationId && acceptResult.redirectTo) {
          await navigateAfterAccept(
            acceptResult.organizationId,
            acceptResult.redirectTo
          );
        } else {
          setError(acceptResult.error ?? "Unable to accept invite");
          setResponding(false);
        }
      }
    }

    void loadInvite();

    return () => {
      cancelled = true;
    };
  }, [autoAccept, inviteId, navigateAfterAccept]);

  const handleRespond = async (accept: boolean) => {
    setResponding(true);
    setError("");
    const result = await respondToInviteAction(inviteId, accept);
    if (result.success) {
      if (accept && result.organizationId && result.redirectTo) {
        await navigateAfterAccept(result.organizationId, result.redirectTo);
        return;
      }
      window.location.href = "/select-org";
      return;
    }
    setError(result.error ?? "Unable to respond to invite");
    setResponding(false);
  };

  if (loading) {
    return <TerminalPanel title="invite.loading" lines={["> $ fetching_invite…"]} />;
  }

  if (error && !invite) {
    return (
      <TerminalPanel
        title="invite.error"
        lines={["> error:", `> ${error}`]}
      />
    );
  }

  if (!invite) {
    return null;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <TerminalPanel
        title="project.invite"
        lines={[
          `> organization: ${invite.organizationName}`,
          `> project: ${invite.projectName}`,
          `> invited_by: ${invite.inviterName}`,
          "> $ accept_to_join_project",
        ]}
      />

      {error && (
        <p className="font-mono text-xs text-destructive">&gt; error: {error}</p>
      )}

      <div className="flex gap-3">
        <Button
          className="flex-1"
          disabled={responding}
          onClick={() => handleRespond(true)}
        >
          {responding ? "accepting…" : "accept()"}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={responding}
          onClick={() => handleRespond(false)}
        >
          reject()
        </Button>
      </div>
    </div>
  );
}
