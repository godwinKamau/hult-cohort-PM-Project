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
      return "only_org_member";
    case "all_added_or_pending":
      return "all_members_added_or_pending";
    case "roster_unavailable":
      return "org_roster_unavailable";
    default:
      return "select_org_member";
  }
}

export function getInviteEmptyHelperText(
  reason: InviteEmptyReason,
  pendingInviteCount: number
): string {
  switch (reason) {
    case "solo_org":
      return "> no_other_org_members — use invite_by_email() below to add teammates";
    case "all_added_or_pending":
      return pendingInviteCount > 0
        ? `> all_org_members_on_project — ${pendingInviteCount} invite(s)_pending`
        : "> all_org_members_already_have_project_access";
    case "roster_unavailable":
      return "> could_not_load_org_members — refresh_or_use_invite_by_email()";
    default:
      return "";
  }
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
