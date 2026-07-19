"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import {
  clearOrgInvitation,
  ensureOrgMembership,
  getAppBaseUrl,
  getPendingOrgInvitationsForUser,
  getUserEmail,
  isOrgMember,
  requireOrg,
  requireUser,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import type { ProjectInviteDTO, ProjectInviteInboxDTO } from "@/lib/types";
import { User } from "@/models";
import * as inviteRepo from "@/repositories/projectInvites";
import * as projectRepo from "@/repositories/projects";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function canInviteToProject(
  orgId: string,
  projectId: string,
  userId: string
): Promise<boolean> {
  const project = await projectRepo.getProject(orgId, projectId, userId);
  if (!project) return false;
  return (
    project.createdBy === userId || project.members.includes(userId)
  );
}

async function inviteMatchesUser(
  invite: ProjectInviteDTO,
  userId: string,
  userEmail: string | null
): Promise<boolean> {
  if (invite.inviteeClerkId && invite.inviteeClerkId === userId) return true;
  if (
    invite.inviteeEmail &&
    userEmail &&
    invite.inviteeEmail === userEmail
  ) {
    return true;
  }
  return false;
}

async function createOrgInvitationForProjectInvite(
  orgId: string,
  inviterUserId: string,
  emailAddress: string,
  projectInviteId: string,
  projectId: string
): Promise<string> {
  const client = await clerkClient();
  const invitation = await client.organizations.createOrganizationInvitation({
    organizationId: orgId,
    emailAddress,
    role: "org:member",
    inviterUserId,
    redirectUrl: `${getAppBaseUrl()}/invites/${projectInviteId}`,
    publicMetadata: {
      projectInviteId,
      projectId,
    },
  });
  return invitation.id;
}

async function createProjectInviteRecord(
  orgId: string,
  projectId: string,
  inviterClerkId: string,
  options: { inviteeClerkId?: string; inviteeEmail?: string }
): Promise<ProjectInviteDTO> {
  const invite = await inviteRepo.createOrRefreshInvite({
    orgId,
    projectId,
    inviterClerkId,
    inviteeClerkId: options.inviteeClerkId,
    inviteeEmail: options.inviteeEmail,
  });

  if (options.inviteeEmail) {
    const clerkInvitationId = await createOrgInvitationForProjectInvite(
      orgId,
      inviterClerkId,
      options.inviteeEmail,
      invite.id,
      projectId
    );
    await inviteRepo.setClerkInvitationId(invite.id, clerkInvitationId);
    return (await inviteRepo.getInvite(invite.id)) ?? invite;
  }

  return invite;
}

export async function inviteToProjectAction(
  projectId: string,
  inviteeClerkId: string
): Promise<{ success: boolean; invite?: ProjectInviteDTO; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();

    if (inviteeClerkId === userId) {
      return { success: false, error: "You cannot invite yourself" };
    }

    const allowed = await canInviteToProject(orgId, projectId, userId);
    if (!allowed) {
      return { success: false, error: "You cannot invite members to this project" };
    }

    const project = await projectRepo.getProject(orgId, projectId, userId);
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (
      project.members.includes(inviteeClerkId) ||
      project.createdBy === inviteeClerkId
    ) {
      return { success: false, error: "User is already a project member" };
    }

    const inviteeIsOrgMember = await isOrgMember(orgId, inviteeClerkId);

    if (inviteeIsOrgMember) {
      const invite = await createProjectInviteRecord(orgId, projectId, userId, {
        inviteeClerkId,
      });
      revalidatePath(`/projects/${projectId}`);
      revalidatePath("/dashboard");
      return { success: true, invite };
    }

    await connectDB();
    const invitee = await User.findOne({ clerkUserId: inviteeClerkId }).lean();
    if (!invitee?.email) {
      return {
        success: false,
        error: "Invitee must join the organization before being added to this project",
      };
    }

    const invite = await createProjectInviteRecord(orgId, projectId, userId, {
      inviteeClerkId,
      inviteeEmail: invitee.email,
    });

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: true, invite };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function inviteToProjectByEmailAction(
  projectId: string,
  emailAddress: string
): Promise<{ success: boolean; invite?: ProjectInviteDTO; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    const email = normalizeEmail(emailAddress);

    if (!email) {
      return { success: false, error: "Email address is required" };
    }

    const allowed = await canInviteToProject(orgId, projectId, userId);
    if (!allowed) {
      return { success: false, error: "You cannot invite members to this project" };
    }

    const project = await projectRepo.getProject(orgId, projectId, userId);
    if (!project) {
      return { success: false, error: "Project not found" };
    }

    await connectDB();
    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      if (
        project.members.includes(existingUser.clerkUserId) ||
        project.createdBy === existingUser.clerkUserId
      ) {
        return { success: false, error: "User is already a project member" };
      }

      if (await isOrgMember(orgId, existingUser.clerkUserId)) {
        return inviteToProjectAction(projectId, existingUser.clerkUserId);
      }

      const invite = await createProjectInviteRecord(orgId, projectId, userId, {
        inviteeClerkId: existingUser.clerkUserId,
        inviteeEmail: email,
      });
      revalidatePath(`/projects/${projectId}`);
      revalidatePath("/dashboard");
      return { success: true, invite };
    }

    const invite = await createProjectInviteRecord(orgId, projectId, userId, {
      inviteeEmail: email,
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: true, invite };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function respondToInviteAction(
  inviteId: string,
  accept: boolean
): Promise<{
  success: boolean;
  organizationId?: string;
  redirectTo?: string;
  error?: string;
}> {
  try {
    const userId = await requireUser();
    const userEmail = await getUserEmail(userId);
    const invite = await inviteRepo.getInvite(inviteId);

    if (!invite) {
      return { success: false, error: "Invite not found" };
    }

    if (!(await inviteMatchesUser(invite, userId, userEmail))) {
      return { success: false, error: "You cannot respond to this invite" };
    }

    if (invite.status !== "pending") {
      return { success: false, error: "Invite is no longer pending" };
    }

    if (accept) {
      await ensureOrgMembership(invite.organizationId, userId);
      if (invite.clerkInvitationId) {
        await clearOrgInvitation(
          invite.organizationId,
          invite.clerkInvitationId
        ).catch(() => {});
      }
      await inviteRepo.attachInviteeClerkId(inviteId, userId);
      await projectRepo.addProjectMember(
        invite.organizationId,
        invite.projectId,
        userId
      );
      await inviteRepo.setInviteStatus(inviteId, "accepted");
      revalidatePath(`/projects/${invite.projectId}`);
      revalidatePath("/dashboard");
      revalidatePath("/select-org");
      return {
        success: true,
        organizationId: invite.organizationId,
        redirectTo: `/projects/${invite.projectId}`,
      };
    }

    await inviteRepo.setInviteStatus(inviteId, "rejected");
    revalidatePath("/dashboard");
    revalidatePath("/select-org");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function acceptOrgInvitationAction(
  invitationId: string
): Promise<{
  success: boolean;
  organizationId?: string;
  redirectTo?: string;
  error?: string;
}> {
  try {
    const userId = await requireUser();
    const pending = await getPendingOrgInvitationsForUser(userId);
    const invitation = pending.find((item) => item.id === invitationId);

    if (!invitation) {
      return { success: false, error: "Organization invitation not found" };
    }

    await ensureOrgMembership(invitation.organizationId, userId);
    await clearOrgInvitation(
      invitation.organizationId,
      invitationId
    ).catch(() => {});
    revalidatePath("/dashboard");
    revalidatePath("/select-org");

    return {
      success: true,
      organizationId: invitation.organizationId,
      redirectTo: "/dashboard",
    };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getInviteDetailsAction(
  inviteId: string
): Promise<{
  success: boolean;
  invite?: ProjectInviteInboxDTO;
  error?: string;
}> {
  try {
    const userId = await requireUser();
    const userEmail = await getUserEmail(userId);
    const invite = await inviteRepo.getInvite(inviteId);

    if (!invite || invite.status !== "pending") {
      return { success: false, error: "Invite not found" };
    }

    if (!(await inviteMatchesUser(invite, userId, userEmail))) {
      return { success: false, error: "You cannot view this invite" };
    }

    const pending = await inviteRepo.listPendingInvitesForUser(
      userId,
      userEmail
    );
    const match = pending.find((item) => item.id === inviteId);

    if (!match) {
      return { success: false, error: "Invite not found" };
    }

    return { success: true, invite: match };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function listProjectInvitesAction(
  projectId: string
): Promise<{ success: boolean; invites?: ProjectInviteDTO[]; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    const allowed = await canInviteToProject(orgId, projectId, userId);
    if (!allowed) {
      return { success: false, error: "You cannot view invites for this project" };
    }

    const invites = await inviteRepo.listInvitesForProject(orgId, projectId);
    return { success: true, invites };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
