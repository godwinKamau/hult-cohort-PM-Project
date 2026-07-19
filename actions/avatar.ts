"use server";

import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  gridHasPixels,
  isValidAvatarColor,
  isValidAvatarGrid,
} from "@/lib/avatar";
import { User } from "@/models";

export async function saveAvatarAction(
  grid: string,
  color: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await requireUser();

    if (!isValidAvatarGrid(grid)) {
      return { success: false, error: "Invalid avatar grid" };
    }
    if (!isValidAvatarColor(color)) {
      return { success: false, error: "Invalid avatar color" };
    }
    if (!gridHasPixels(grid)) {
      return { success: false, error: "Avatar must have at least one pixel" };
    }

    await connectDB();
    await User.findOneAndUpdate(
      { clerkUserId: userId },
      { avatarGrid: grid, avatarColor: color }
    );

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function clearAvatarAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const userId = await requireUser();

    await connectDB();
    await User.findOneAndUpdate(
      { clerkUserId: userId },
      { $unset: { avatarGrid: "", avatarColor: "" } }
    );

    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
