"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

export async function updateGithubUsernameAction(
  githubUsername: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await requireOrg();
    await connectDB();
    await User.findOneAndUpdate(
      { clerkUserId: userId },
      { githubUsername: githubUsername.trim() },
      { upsert: true }
    );
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
