"use server";

import { revalidatePath } from "next/cache";
import { requireOrg, getUserGithubUsername } from "@/lib/auth";
import {
  getGithubAccessToken,
  listGithubBranches,
  normalizeRepoName,
  verifyGithubRepo,
} from "@/lib/github";
import * as projectRepo from "@/repositories/projects";
import type { ProjectDTO } from "@/lib/types";

async function getLockedGithubUsername(userId: string): Promise<string> {
  const githubUsername = await getUserGithubUsername(userId);
  if (!githubUsername) {
    throw new Error("GitHub account not linked. Sign in with GitHub.");
  }
  return githubUsername;
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

export async function verifyProjectGithubRepoAction(repoName: string): Promise<{
  success: boolean;
  branches?: string[];
  defaultBranch?: string;
  error?: string;
}> {
  try {
    const { userId } = await requireOrg();
    const owner = await getLockedGithubUsername(userId);
    const normalizedRepo = normalizeRepoName(repoName, owner);

    if (!normalizedRepo) {
      return { success: false, error: "Repository name is required" };
    }

    const token = await getGithubAccessToken(userId);
    if (!token) {
      return {
        success: false,
        error:
          "GitHub token unavailable. Sign out and sign in again with GitHub.",
      };
    }

    const { defaultBranch } = await verifyGithubRepo(
      token,
      owner,
      normalizedRepo
    );
    const branches = await listGithubBranches(token, owner, normalizedRepo);

    return { success: true, branches, defaultBranch };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function setProjectGithubAction(
  projectId: string,
  github: { repoName?: string; branch?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    const owner = await getLockedGithubUsername(userId);
    const repoName = normalizeRepoName(github.repoName ?? "", owner);

    if (!repoName) {
      return { success: false, error: "Repository name is required" };
    }

    const branch = github.branch?.trim() || "main";

    await projectRepo.setProjectGithub(orgId, projectId, {
      repoFullName: `${owner}/${repoName}`,
      branch,
    });
    revalidatePath(`/projects/${projectId}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
