"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/lib/auth";
import * as projectRepo from "@/repositories/projects";
import type { ProjectDTO } from "@/lib/types";

export async function createProjectAction(data: {
  name: string;
  description?: string;
}): Promise<{ success: boolean; project?: ProjectDTO; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    const project = await projectRepo.createProject(orgId, userId, data);
    revalidatePath("/dashboard");
    return { success: true, project };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateProjectAction(
  projectId: string,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { orgId } = await requireOrg();
    await projectRepo.updateProject(orgId, projectId, data);
    revalidatePath("/dashboard");
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function archiveProjectAction(
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { orgId } = await requireOrg();
    await projectRepo.archiveProject(orgId, projectId);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function setProjectGithubAction(
  projectId: string,
  github: { repoFullName?: string; branch?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { orgId } = await requireOrg();
    await projectRepo.setProjectGithub(orgId, projectId, github);
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
