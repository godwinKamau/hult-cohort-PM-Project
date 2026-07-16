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

export async function syncUserFromClerk(clerkUserId: string) {
  await connectDB();
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(clerkUserId);

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
    },
    { upsert: true, new: true }
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
      { upsert: true, new: true }
    );
  }
}

export async function getOrgMembers(orgId: string): Promise<OrgMemberDTO[]> {
  const client = await clerkClient();
  const memberships =
    await client.organizations.getOrganizationMembershipList({
      organizationId: orgId,
      limit: 100,
    });

  return memberships.data.map((m) => ({
    clerkUserId: m.publicUserData?.userId ?? "",
    email: m.publicUserData?.identifier ?? "",
    name:
      `${m.publicUserData?.firstName ?? ""} ${m.publicUserData?.lastName ?? ""}`.trim() ||
      m.publicUserData?.identifier ||
      "Member",
    imageUrl: m.publicUserData?.imageUrl ?? undefined,
  }));
}

export async function isOrgMember(
  orgId: string,
  clerkUserId: string
): Promise<boolean> {
  const members = await getOrgMembers(orgId);
  return members.some((m) => m.clerkUserId === clerkUserId);
}
