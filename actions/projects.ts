"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/lib/auth";
import {
  getGithubAccessToken,
  listGithubBranches,
  normalizeRepoTarget,
  verifyGithubRepo,
} from "@/lib/github";
import * as projectRepo from "@/repositories/projects";
import type { ProjectDTO } from "@/lib/types";

async function requireGithubToken(userId: string): Promise<string> {
  const token = await getGithubAccessToken(userId);
  if (!token) {
    throw new Error(
      "GitHub token unavailable. Sign out and sign in again with GitHub."
    );
  }
  return token;
}

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

export async function verifyProjectGithubRepoAction(
  owner: string,
  repoName: string
): Promise<{
  success: boolean;
  branches?: string[];
  defaultBranch?: string;
  error?: string;
}> {
  try {
    const { userId } = await requireOrg();
    const target = normalizeRepoTarget(owner, repoName);

    if (!target) {
      return { success: false, error: "Owner and repository name are required" };
    }

    const token = await requireGithubToken(userId);

    const { defaultBranch } = await verifyGithubRepo(
      token,
      target.owner,
      target.repo
    );
    const branches = await listGithubBranches(token, target.owner, target.repo);

    return { success: true, branches, defaultBranch };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function setProjectGithubAction(
  projectId: string,
  github: { owner?: string; repoName?: string; branch?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { orgId } = await requireOrg();
    const target = normalizeRepoTarget(
      github.owner ?? "",
      github.repoName ?? ""
    );

    if (!target) {
      return { success: false, error: "Owner and repository name are required" };
    }

    const branch = github.branch?.trim() || "main";

    await projectRepo.setProjectGithub(orgId, projectId, {
      repoFullName: `${target.owner}/${target.repo}`,
      branch,
    });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
