"use client";

import { useState } from "react";
import type { NoteDTO, OrgMemberDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNoteAction } from "@/actions/notes";

interface NotesThreadProps {
  notes: NoteDTO[];
  members: OrgMemberDTO[];
  ticketId: string;
  projectId: string;
}

export function NotesThread({
  notes,
  members,
  ticketId,
  projectId,
}: NotesThreadProps) {
  const [body, setBody] = useState("");
  const [localNotes, setLocalNotes] = useState(notes);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSubmitting(true);
    const result = await addNoteAction(ticketId, projectId, body.trim());
    if (result.success && result.note) {
      setLocalNotes((prev) => [...prev, result.note!]);
      setBody("");
    }
    setSubmitting(false);
  };

  const getAuthorName = (clerkId: string) => {
    const member = members.find((m) => m.clerkUserId === clerkId);
    return member?.name ?? clerkId.slice(0, 8);
  };

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-muted-foreground">--notes</p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {localNotes.length === 0 && (
          <p className="font-mono text-xs text-muted-foreground">
            &gt; no_notes_yet
          </p>
        )}
        {localNotes.map((note) => (
          <div
            key={note.id}
            className="border border-primary/10 rounded p-2 bg-black-light/30"
          >
            <p className="font-mono text-xs text-muted-foreground mb-1">
              @{getAuthorName(note.authorClerkId)} ·{" "}
              {new Date(note.createdAt).toLocaleString()}
            </p>
            <p className="font-mono text-sm text-green-dark">{note.body}</p>
          </div>
        ))}
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a note..."
        className="min-h-[60px]"
      />
      <Button size="sm" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "saving…" : "add_note()"}
      </Button>
    </div>
  );
}
