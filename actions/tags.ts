"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/lib/auth";
import * as tagRepo from "@/repositories/tags";
import type { TagDTO } from "@/lib/types";

export async function createTagAction(data: {
  name: string;
  color: string;
}): Promise<{ success: boolean; tag?: TagDTO; error?: string }> {
  try {
    const { orgId } = await requireOrg();
    const tag = await tagRepo.createTag(orgId, data);
    revalidatePath("/dashboard");
    return { success: true, tag };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteTagAction(
  tagId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { orgId } = await requireOrg();
    const deleted = await tagRepo.deleteTag(orgId, tagId);
    if (!deleted) {
      return { success: false, error: "Tag not found" };
    }

    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
