import type { OrgMemberDTO } from "@/lib/types";

export const FORMER_MEMBER_LABEL = "Former organization member";

export type InviteEmptyReason =
  | "selectable"
  | "solo_org"
  | "all_added_or_pending"
  | "roster_unavailable";

export function resolveMemberDisplayName(
  clerkUserId: string,
  memberNameById: Map<string, string>
): string {
  return memberNameById.get(clerkUserId) ?? FORMER_MEMBER_LABEL;
}

export function getInviteEmptyReason(
  members: OrgMemberDTO[],
  currentUserId: string,
  inviteCandidatesCount: number
): InviteEmptyReason {
  if (inviteCandidatesCount > 0) return "selectable";

  if (members.length === 0) return "roster_unavailable";

  const otherOrgMembers = members.filter(
    (member) => member.clerkUserId && member.clerkUserId !== currentUserId
  );

  if (otherOrgMembers.length === 0) return "solo_org";

  return "all_added_or_pending";
}

export function getInviteEmptyPlaceholder(reason: InviteEmptyReason): string {
  switch (reason) {
    case "solo_org":
      return "You're the only org member";
    case "all_added_or_pending":
      return "All members added or pending";
    case "roster_unavailable":
      return "Org roster unavailable";
    default:
      return "Select a member";
  }
}

export function getInviteEmptyHelperText(
  reason: InviteEmptyReason,
  pendingInviteCount: number
): string {
  switch (reason) {
    case "solo_org":
      return "> No other org members — switch to By email to invite teammates";
    case "all_added_or_pending":
      return pendingInviteCount > 0
        ? `> Everyone in your org is on this project — ${pendingInviteCount} invite(s) still pending`
        : "> Everyone in your org already has project access";
    case "roster_unavailable":
      return "> Could not load org members — refresh or use By email";
    default:
      return "";
  }
}

export function formatPendingInviteStatus(createdAt: string): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) {
    return "pending";
  }

  const diffDays = Math.floor(
    (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays <= 0) {
    return "pending";
  }

  if (diffDays === 1) {
    return "pending · 1d ago";
  }

  return `pending · ${diffDays}d ago`;
}

export function resolvePendingInviteDisplayName(
  inviteeClerkId: string | undefined,
  inviteeEmail: string | undefined,
  memberNameById: Map<string, string>
): string {
  if (inviteeClerkId) {
    return (
      memberNameById.get(inviteeClerkId) ??
      `${FORMER_MEMBER_LABEL} (invite pending)`
    );
  }

  if (inviteeEmail) {
    return inviteeEmail;
  }

  return "Invitee details unavailable";
}
