"use client";

import { useEffect, useRef, useState } from "react";
import type { NoteDTO, OrgMemberDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNoteAction } from "@/actions/notes";
import { cn } from "@/lib/cn";

interface NotesThreadProps {
  notes: NoteDTO[];
  members: OrgMemberDTO[];
  ticketId: string;
  projectId: string;
  className?: string;
}

const COMPOSER_HEIGHT = "h-10 min-h-10 max-h-10";

function formatNoteTime(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return (name.slice(0, 2) || "?").toUpperCase();
}

export function NotesThread({
  notes,
  members,
  ticketId,
  projectId,
  className,
}: NotesThreadProps) {
  const [body, setBody] = useState("");
  const [localNotes, setLocalNotes] = useState(notes);
  const [submitting, setSubmitting] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalNotes(notes);
  }, [notes]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [localNotes.length]);

  const handleSubmit = async () => {
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    const result = await addNoteAction(ticketId, projectId, body.trim());
    if (result.success && result.note) {
      setLocalNotes((prev) => [...prev, result.note!]);
      setBody("");
    }
    setSubmitting(false);
  };

  const getAuthorName = (clerkId: string) => {
    const member = members.find((member) => member.clerkUserId === clerkId);
    return member?.name ?? clerkId.slice(0, 8);
  };

  return (
    <section
      aria-label="Ticket notes"
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border-2 border-primary/35 bg-black-light/40",
        "shadow-[0_0_24px_rgba(0,255,65,0.08)]",
        className
      )}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-primary/25 bg-primary/10 px-3 py-2">
        <h3 className="font-mono text-xs font-medium text-primary">notes.chat</h3>
        <span className="font-mono text-[10px] text-muted-foreground">
          {localNotes.length} message{localNotes.length === 1 ? "" : "s"}
        </span>
      </header>

      <div
        ref={messagesRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
        <div className="flex flex-col gap-2">
          {localNotes.length === 0 && (
            <p className="py-6 text-center font-mono text-xs text-muted-foreground">
              No messages yet — start the thread below.
            </p>
          )}
          {localNotes.map((note) => {
            const authorName = getAuthorName(note.authorClerkId);

            return (
              <article
                key={note.id}
                className="flex gap-2 rounded-md border border-primary/15 bg-black/40 p-2.5"
              >
                <div
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-mono text-[10px] text-primary"
                >
                  {getInitials(authorName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="font-mono text-xs font-medium text-primary">
                      {authorName}
                    </span>
                    <time
                      dateTime={note.createdAt}
                      className="font-mono text-[10px] text-muted-foreground"
                    >
                      {formatNoteTime(note.createdAt)}
                    </time>
                  </div>
                  <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-green-dark">
                    {note.body}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <footer className="shrink-0 border-t border-primary/25 bg-black-light/60 p-3">
        <div className="flex items-center gap-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="Write a note…"
            aria-label="Note message"
            rows={1}
            className={cn(
              COMPOSER_HEIGHT,
              "flex-1 resize-none overflow-y-auto bg-black/50 py-2 leading-5"
            )}
            disabled={submitting}
          />
          <Button
            size="sm"
            className={cn(COMPOSER_HEIGHT, "shrink-0 px-4")}
            onClick={() => void handleSubmit()}
            disabled={submitting || !body.trim()}
          >
            {submitting ? "…" : "send"}
          </Button>
        </div>
        <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
        </p>
      </footer>
    </section>
  );
}
