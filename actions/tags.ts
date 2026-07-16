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
