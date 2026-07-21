"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Highlighter, PenLine } from "lucide-react";
import type { NoteDTO, OrgMemberDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  addNoteAction,
  toggleNoteHighlightAction,
} from "@/actions/notes";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { getTicketColorScopeStyle, getTicketColorStyles } from "@/lib/ticketColor";
import { RichNoteComposer } from "./RichNoteComposer";
import { cn } from "@/lib/cn";

/** Collapse composer when the notes panel is at or below this width (px). */
const COMPACT_COMPOSER_MAX_WIDTH = 1024;

interface NotesThreadProps {
  notes: NoteDTO[];
  members: OrgMemberDTO[];
  ticketId: string;
  projectId: string;
  accentColor?: string;
  className?: string;
}

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

function normalizeNote(note: NoteDTO): NoteDTO {
  return {
    ...note,
    format: note.format ?? "text",
    highlighted: note.highlighted ?? false,
  };
}

export function NotesThread({
  notes,
  members,
  ticketId,
  projectId,
  accentColor,
  className,
}: NotesThreadProps) {
  const normalizedNotes = useMemo(() => notes.map(normalizeNote), [notes]);
  const notesKey = useMemo(
    () =>
      normalizedNotes
        .map(
          (note) =>
            `${note.id}:${note.highlighted}:${note.format}:${note.body}:${note.updatedAt}`
        )
        .join("|"),
    [normalizedNotes]
  );
  const [localNotes, setLocalNotes] = useState(normalizedNotes);
  const [submitting, setSubmitting] = useState(false);
  const [highlightOnly, setHighlightOnly] = useState(false);
  const [togglingHighlightId, setTogglingHighlightId] = useState<string | null>(
    null
  );
  const [syncKey, setSyncKey] = useState(notesKey);
  const [composerOpen, setComposerOpen] = useState(false);
  const [isCompactComposer, setIsCompactComposer] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const sync = (width: number) => {
      const compact = width <= COMPACT_COMPOSER_MAX_WIDTH;
      setIsCompactComposer(compact);
      setComposerOpen((current) => (compact ? current : true));
    };

    const observer = new ResizeObserver(([entry]) => {
      sync(entry.contentRect.width);
    });

    observer.observe(section);
    sync(section.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  if (syncKey !== notesKey) {
    setSyncKey(notesKey);
    setLocalNotes(normalizedNotes);
  }

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [localNotes.length, highlightOnly]);

  const displayedNotes = useMemo(() => {
    if (!highlightOnly) return localNotes;
    return localNotes.filter((note) => note.highlighted);
  }, [highlightOnly, localNotes]);

  const highlightedCount = useMemo(
    () => localNotes.filter((note) => note.highlighted).length,
    [localNotes]
  );

  const handleSubmit = async (body: string, format: "text" | "html") => {
    if (submitting) return;

    setSubmitting(true);
    const result = await addNoteAction(ticketId, projectId, body, format);
    if (result.success && result.note) {
      setLocalNotes((prev) => [...prev, normalizeNote(result.note!)]);
      if (isCompactComposer) {
        setComposerOpen(false);
      }
    }
    setSubmitting(false);
  };

  const handleToggleHighlight = async (note: NoteDTO) => {
    if (togglingHighlightId) return;

    const nextHighlighted = !note.highlighted;
    setTogglingHighlightId(note.id);
    setLocalNotes((prev) =>
      prev.map((item) =>
        item.id === note.id ? { ...item, highlighted: nextHighlighted } : item
      )
    );

    const result = await toggleNoteHighlightAction(
      note.id,
      ticketId,
      projectId,
      nextHighlighted
    );

    if (!result.success) {
      setLocalNotes((prev) =>
        prev.map((item) =>
          item.id === note.id ? { ...item, highlighted: note.highlighted } : item
        )
      );
    } else if (result.note) {
      setLocalNotes((prev) =>
        prev.map((item) =>
          item.id === note.id ? normalizeNote(result.note!) : item
        )
      );
    }

    setTogglingHighlightId(null);
  };

  const getAuthorName = (clerkId: string) => {
    const member = members.find((member) => member.clerkUserId === clerkId);
    return member?.name ?? clerkId.slice(0, 8);
  };

  const threadAccentStyles = accentColor
    ? getTicketColorStyles(accentColor)
    : null;

  return (
    <section
      ref={sectionRef}
      aria-label="Ticket notes"
      style={{
        ...getTicketColorScopeStyle(accentColor),
        ...(threadAccentStyles
          ? { boxShadow: `0 0 24px ${threadAccentStyles.badgeBackground}` }
          : undefined),
      }}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border-2 border-primary/35 bg-black-light/40",
        className
      )}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-primary/25 bg-primary/10 px-3 py-2">
        <h3 className="font-mono text-xs font-medium text-primary">notes.chat</h3>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={highlightOnly ? "default" : "ghost"}
            className="h-6 px-2 font-mono text-[10px]"
            aria-pressed={highlightOnly}
            disabled={highlightedCount === 0}
            onClick={() => setHighlightOnly((current) => !current)}
          >
            highlights_only
            {highlightedCount > 0 ? ` (${highlightedCount})` : ""}
          </Button>
          <span className="font-mono text-[10px] text-muted-foreground">
            {localNotes.length} message{localNotes.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <div
        ref={messagesRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
        <div className="flex flex-col gap-2">
          {displayedNotes.length === 0 && (
            <p className="py-6 text-center font-mono text-xs text-muted-foreground">
              {highlightOnly
                ? "No highlighted messages yet."
                : "No messages yet — start the thread below."}
            </p>
          )}
          {displayedNotes.map((note) => {
            const authorName = getAuthorName(note.authorClerkId);
            const sanitizedBody =
              note.format === "html" ? sanitizeHtml(note.body) : note.body;

            return (
              <article
                key={note.id}
                className={cn(
                  "flex gap-2 rounded-md border bg-black/40 p-2.5",
                  note.highlighted
                    ? "border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_12px_rgba(250,204,21,0.15)]"
                    : "border-primary/15"
                )}
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
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "ml-auto h-6 w-6",
                        note.highlighted
                          ? "text-yellow-300 hover:text-yellow-200"
                          : "text-muted-foreground hover:text-primary"
                      )}
                      aria-label={
                        note.highlighted
                          ? "Remove highlight"
                          : "Highlight message"
                      }
                      aria-pressed={note.highlighted}
                      disabled={togglingHighlightId === note.id}
                      onClick={() => void handleToggleHighlight(note)}
                    >
                      <Highlighter className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                  {note.format === "html" ? (
                    <div
                      className="font-mono text-sm leading-relaxed text-primary/80 [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{ __html: sanitizedBody }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-primary/80">
                      {note.body}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <footer className="shrink-0 border-t border-primary/25 bg-black-light/60 p-3">
        {isCompactComposer && !composerOpen ? (
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full justify-center gap-2 font-mono text-xs"
            onClick={() => setComposerOpen(true)}
          >
            <PenLine className="h-3.5 w-3.5" aria-hidden />
            write_note()
          </Button>
        ) : (
          <div className="space-y-2">
            {isCompactComposer && (
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wide text-primary">
                  compose
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1 px-2 font-mono text-[10px] text-muted-foreground hover:text-primary"
                  aria-expanded={composerOpen}
                  onClick={() => setComposerOpen(false)}
                >
                  collapse
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            )}
            <RichNoteComposer disabled={submitting} onSubmit={handleSubmit} />
            <p className="font-mono text-[10px] text-muted-foreground">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        )}
      </footer>
    </section>
  );
}
