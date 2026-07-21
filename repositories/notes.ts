import { connectDB } from "@/lib/db";
import { serializeDoc } from "@/lib/serialize";
import type { NoteDTO } from "@/lib/types";
import { Note } from "@/models";

export async function listNotes(
  orgId: string,
  ticketId: string
): Promise<NoteDTO[]> {
  await connectDB();
  const docs = await Note.find({ organizationId: orgId, ticketId })
    .sort({ createdAt: 1 })
    .lean();
  return docs.map((d) => serializeDoc<NoteDTO>(d)!);
}

export async function addNote(
  orgId: string,
  userId: string,
  ticketId: string,
  body: string,
  format: "text" | "html" = "text"
): Promise<NoteDTO> {
  await connectDB();
  const doc = await Note.create({
    organizationId: orgId,
    ticketId,
    authorClerkId: userId,
    body,
    format,
  });
  return serializeDoc<NoteDTO>(doc.toObject())!;
}

export async function setNoteHighlight(
  orgId: string,
  noteId: string,
  highlighted: boolean
): Promise<NoteDTO | null> {
  await connectDB();
  const doc = await Note.findOneAndUpdate(
    { _id: noteId, organizationId: orgId },
    { $set: { highlighted } },
    { returnDocument: "after" }
  ).lean();
  return serializeDoc<NoteDTO>(doc);
}
