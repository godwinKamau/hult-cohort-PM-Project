"use server";

import { revalidatePath } from "next/cache";
import { requireOrg, requireProjectMembership } from "@/lib/auth";
import { isHtmlEmpty, sanitizeHtml } from "@/lib/sanitizeHtml";
import * as noteRepo from "@/repositories/notes";
import type { NoteDTO } from "@/lib/types";

export async function addNoteAction(
  ticketId: string,
  projectId: string,
  body: string,
  format: "text" | "html" = "text"
): Promise<{ success: boolean; note?: NoteDTO; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    await requireProjectMembership(orgId, projectId, userId);

    let sanitizedBody = body.trim();
    const noteFormat: "text" | "html" = format;

    if (format === "html") {
      sanitizedBody = sanitizeHtml(body);
      if (isHtmlEmpty(sanitizedBody)) {
        return { success: false, error: "Note body is empty" };
      }
    } else if (!sanitizedBody) {
      return { success: false, error: "Note body is empty" };
    }

    const note = await noteRepo.addNote(
      orgId,
      userId,
      ticketId,
      sanitizedBody,
      noteFormat
    );
    revalidatePath(`/projects/${projectId}`);
    return { success: true, note };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function toggleNoteHighlightAction(
  noteId: string,
  ticketId: string,
  projectId: string,
  highlighted: boolean
): Promise<{ success: boolean; note?: NoteDTO; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    await requireProjectMembership(orgId, projectId, userId);

    const note = await noteRepo.setNoteHighlight(orgId, noteId, highlighted);
    if (!note || note.ticketId !== ticketId) {
      return { success: false, error: "Note not found" };
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, note };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
