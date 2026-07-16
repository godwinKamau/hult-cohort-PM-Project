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
  body: string
): Promise<NoteDTO> {
  await connectDB();
  const doc = await Note.create({
    organizationId: orgId,
    ticketId,
    authorClerkId: userId,
    body,
  });
  return serializeDoc<NoteDTO>(doc.toObject())!;
}
