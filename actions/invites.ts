"use server";

import { revalidatePath } from "next/cache";
import { isOrgMember, requireOrg } from "@/lib/auth";
import type { ProjectInviteDTO } from "@/lib/types";
import * as inviteRepo from "@/repositories/projectInvites";
import * as projectRepo from "@/repositories/projects";

async function canInviteToProject(
  orgId: string,
  projectId: string,
  userId: string
): Promise<boolean> {
  const project = await projectRepo.getProject(orgId, projectId, userId);
  if (!project) return false;
  return (
    project.createdBy === userId ||
    project.members.includes(userId)
  );
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

    const inviteeIsMember = await isOrgMember(orgId, inviteeClerkId);
    if (!inviteeIsMember) {
      return { success: false, error: "Invitee is not an org member" };
    }

    if (
      project.members.includes(inviteeClerkId) ||
      project.createdBy === inviteeClerkId
    ) {
      return { success: false, error: "User is already a project member" };
    }

    const existingInvite = await inviteRepo.getPendingInviteForProjectUser(
      projectId,
      inviteeClerkId
    );
    if (existingInvite) {
      return { success: false, error: "An invite is already pending for this user" };
    }

    const invite = await inviteRepo.createInvite(
      orgId,
      projectId,
      userId,
      inviteeClerkId
    );

    // TODO(email): send invitation email here

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
): Promise<{ success: boolean; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    const invite = await inviteRepo.getInvite(inviteId);

    if (!invite) {
      return { success: false, error: "Invite not found" };
    }

    if (invite.organizationId !== orgId) {
      return { success: false, error: "Invite not found" };
    }

    if (invite.inviteeClerkId !== userId) {
      return { success: false, error: "You cannot respond to this invite" };
    }

    if (invite.status !== "pending") {
      return { success: false, error: "Invite is no longer pending" };
    }

    if (accept) {
      await projectRepo.addProjectMember(
        orgId,
        invite.projectId,
        invite.inviteeClerkId
      );
      await inviteRepo.setInviteStatus(inviteId, "accepted");
      revalidatePath(`/projects/${invite.projectId}`);
    } else {
      await inviteRepo.setInviteStatus(inviteId, "rejected");
    }

    revalidatePath("/dashboard");
    return { success: true };
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
