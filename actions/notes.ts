"use server";

import { revalidatePath } from "next/cache";
import { requireOrg } from "@/lib/auth";
import * as noteRepo from "@/repositories/notes";
import type { NoteDTO } from "@/lib/types";

export async function addNoteAction(
  ticketId: string,
  projectId: string,
  body: string
): Promise<{ success: boolean; note?: NoteDTO; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    const note = await noteRepo.addNote(orgId, userId, ticketId, body);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, note };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
