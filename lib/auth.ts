import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectDB } from "./db";
import { User, Organization } from "@/models";
import type { OrgMemberDTO } from "./types";

export interface AuthContext {
  userId: string;
  orgId: string;
}

export async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }
  return userId;
}

export async function requireOrg(): Promise<AuthContext> {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect("/");
  }
  if (!orgId) {
    redirect("/select-org");
  }
  await syncUserFromClerk(userId);
  return { userId, orgId };
}

export async function getOptionalOrg(): Promise<AuthContext | null> {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) return null;
  await syncUserFromClerk(userId);
  return { userId, orgId };
}

type ClerkExternalAccount = {
  provider?: string;
  username?: string | null;
};

export function getGithubLoginFromExternalAccounts(
  externalAccounts: ClerkExternalAccount[] | undefined
): string | undefined {
  const githubAccount = externalAccounts?.find(
    (account) =>
      account.provider === "oauth_github" || account.provider === "github"
  );
  return githubAccount?.username?.trim() || undefined;
}

export function getGithubLoginFromClerkUser(user: {
  externalAccounts?: ClerkExternalAccount[];
}): string | undefined {
  return getGithubLoginFromExternalAccounts(user.externalAccounts);
}

export async function getUserGithubUsername(
  clerkUserId: string
): Promise<string | null> {
  await connectDB();
  const user = await User.findOne({ clerkUserId }).lean();
  if (user?.githubUsername) {
    return user.githubUsername;
  }

  await syncUserFromClerk(clerkUserId);
  const syncedUser = await User.findOne({ clerkUserId }).lean();
  return syncedUser?.githubUsername ?? null;
}

export async function syncUserFromClerk(clerkUserId: string) {
  await connectDB();
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);
  const githubUsername = getGithubLoginFromClerkUser(clerkUser);

  await User.findOneAndUpdate(
    { clerkUserId },
    {
      clerkUserId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name:
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        clerkUser.username ||
        "User",
      imageUrl: clerkUser.imageUrl,
      ...(githubUsername ? { githubUsername } : {}),
    },
    { upsert: true, returnDocument: "after" }
  );

  const { orgId } = await auth();
  if (orgId) {
    const org = await client.organizations.getOrganization({
      organizationId: orgId,
    });
    await Organization.findOneAndUpdate(
      { clerkOrgId: orgId },
      {
        clerkOrgId: orgId,
        name: org.name,
        slug: org.slug ?? org.name.toLowerCase().replace(/\s+/g, "-"),
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  await cleanupStaleOrgInvitations(clerkUserId).catch(() => {});
}

export async function getOrgMembers(orgId: string): Promise<OrgMemberDTO[]> {
  const client = await clerkClient();
  const members: OrgMemberDTO[] = [];
  const limit = 100;
  let offset = 0;

  while (true) {
    const memberships =
      await client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit,
        offset,
      });

    for (const membership of memberships.data) {
      const clerkUserId = membership.publicUserData?.userId ?? "";
      if (!clerkUserId) continue;

      members.push({
        clerkUserId,
        email: membership.publicUserData?.identifier ?? "",
        name:
          `${membership.publicUserData?.firstName ?? ""} ${membership.publicUserData?.lastName ?? ""}`.trim() ||
          membership.publicUserData?.identifier ||
          "Member",
        imageUrl: membership.publicUserData?.imageUrl ?? undefined,
      });
    }

    if (memberships.data.length < limit) break;
    offset += limit;
  }

  return members;
}

export async function isOrgMember(
  orgId: string,
  clerkUserId: string
): Promise<boolean> {
  const members = await getOrgMembers(orgId);
  return members.some((m) => m.clerkUserId === clerkUserId);
}

export function getAppBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export async function getUserEmail(clerkUserId: string): Promise<string | null> {
  await connectDB();
  const user = await User.findOne({ clerkUserId }).lean();
  return user?.email?.toLowerCase() ?? null;
}

export async function ensureOrgMembership(
  orgId: string,
  clerkUserId: string
): Promise<void> {
  if (await isOrgMember(orgId, clerkUserId)) return;

  const client = await clerkClient();
  await client.organizations.createOrganizationMembership({
    organizationId: orgId,
    userId: clerkUserId,
    role: "org:member",
  });
}

export async function clearOrgInvitation(
  organizationId: string,
  invitationId: string
): Promise<void> {
  const client = await clerkClient();
  await client.organizations.revokeOrganizationInvitation({
    organizationId,
    invitationId,
  });
}

export async function cleanupStaleOrgInvitations(
  clerkUserId: string
): Promise<void> {
  const client = await clerkClient();
  const [response, memberships] = await Promise.all([
    client.users.getOrganizationInvitationList({
      userId: clerkUserId,
      status: "pending",
      limit: 100,
    }),
    client.users.getOrganizationMembershipList({
      userId: clerkUserId,
      limit: 100,
    }),
  ]);

  const memberOrgIds = new Set(
    memberships.data.map((membership) => membership.organization.id)
  );

  const staleInvitations = response.data.filter((invitation) =>
    memberOrgIds.has(invitation.organizationId)
  );

  await Promise.allSettled(
    staleInvitations.map((invitation) =>
      clearOrgInvitation(invitation.organizationId, invitation.id)
    )
  );
}

export async function getPendingOrgInvitationsForUser(
  clerkUserId: string
): Promise<
  {
    id: string;
    organizationId: string;
    organizationName: string;
    emailAddress: string;
    role: string;
    createdAt: string;
  }[]
> {
  const client = await clerkClient();
  const [response, memberships] = await Promise.all([
    client.users.getOrganizationInvitationList({
      userId: clerkUserId,
      status: "pending",
      limit: 20,
    }),
    client.users.getOrganizationMembershipList({
      userId: clerkUserId,
      limit: 100,
    }),
  ]);

  const memberOrgIds = new Set(
    memberships.data.map((membership) => membership.organization.id)
  );

  return response.data
    .filter((invitation) => !invitation.publicMetadata?.projectInviteId)
    .filter((invitation) => !memberOrgIds.has(invitation.organizationId))
    .map((invitation) => ({
      id: invitation.id,
      organizationId: invitation.organizationId,
      organizationName:
        invitation.publicOrganizationData?.name ?? "Organization",
      emailAddress: invitation.emailAddress,
      role: invitation.role,
      createdAt: new Date(invitation.createdAt).toISOString(),
    }));
}

export async function requireProjectMembership(
  orgId: string,
  projectId: string,
  userId: string
): Promise<void> {
  const { getProject } = await import("@/repositories/projects");
  const project = await getProject(orgId, projectId, userId);
  if (!project) {
    throw new Error("You do not have access to this project");
  }
}

export async function requireProjectOwnership(
  orgId: string,
  projectId: string,
  userId: string
): Promise<void> {
  const { getProject } = await import("@/repositories/projects");
  const project = await getProject(orgId, projectId, userId);
  if (!project) {
    throw new Error("You do not have access to this project");
  }
  if (project.createdBy !== userId) {
    throw new Error("Only the project owner can perform this action");
  }
}
