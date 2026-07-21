"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type {
  TicketDTO,
  TagDTO,
  NoteDTO,
  OrgMemberDTO,
  ProjectDTO,
  TicketStatus,
} from "@/lib/types";
import { TAG_COLORS } from "@/lib/types";
import { formatTicketNumber } from "@/lib/ticketNumber";
import { STATUS_LABELS } from "@/lib/ticketStatus";
import {
  changeTicketStatusAction,
  updateTicketAction,
} from "@/actions/tickets";
import { useTerminalToast } from "@/components/ui/terminal-toast";
import { TicketStatusSelect } from "@/components/board/TicketStatusSelect";
import { TicketStatusNav } from "@/components/board/TicketStatusNav";
import { TagPicker } from "./TagPicker";
import { NotesThread } from "./NotesThread";
import { cn } from "@/lib/cn";
import { getTicketColorScopeStyle, getTicketPeekAccentStyle } from "@/lib/ticketColor";
import { Button } from "@/components/ui/button";

interface TicketPeekContentProps {
  ticket: TicketDTO;
  tags: TagDTO[];
  notes: NoteDTO[];
  members: OrgMemberDTO[];
  project: ProjectDTO;
  onTicketPatch?: (ticketId: string, patch: Partial<TicketDTO>) => void;
}

type SaveState = "idle" | "saving" | "saved" | "error";

function formatSavedAt(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function TicketPeekContent({
  ticket,
  tags,
  notes,
  members,
  project,
  onTicketPatch,
}: TicketPeekContentProps) {
  const router = useRouter();
  const { showToast } = useTerminalToast();
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [assignee, setAssignee] = useState(ticket.assigneeClerkId ?? "");
  const [selectedTags, setSelectedTags] = useState(ticket.tagIds);
  const [ticketColor, setTicketColor] = useState(ticket.color ?? "");
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [lastFailedData, setLastFailedData] = useState<
    Parameters<typeof updateTicketAction>[2] | null
  >(null);
  const peekColorScopeStyle = useMemo(
    () => getTicketColorScopeStyle(ticketColor || undefined),
    [ticketColor]
  );

  const saveField = useCallback(
    async (data: Parameters<typeof updateTicketAction>[2]) => {
      setSaveState("saving");
      setLastFailedData(null);

      const result = await updateTicketAction(ticket.id, project.id, data);

      if (result.success) {
        const timestamp = formatSavedAt(new Date());
        setSavedAt(timestamp);
        setSaveState("saved");
        router.refresh();
        return true;
      }

      setSaveState("error");
      setLastFailedData(data);
      showToast(`save_failed: ${result.error ?? "retry"}`, "error");
      return false;
    },
    [project.id, router, showToast, ticket.id]
  );

  const commitTitleEdit = async () => {
    setIsEditingTitle(false);

    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(ticket.title);
      return;
    }

    if (trimmed === ticket.title) {
      setTitle(trimmed);
      return;
    }

    setTitle(trimmed);
    const ok = await saveField({ title: trimmed });
    if (!ok) {
      setTitle(ticket.title);
    }
  };

  const cancelTitleEdit = () => {
    setTitle(ticket.title);
    setIsEditingTitle(false);
  };

  const commitDescriptionEdit = async () => {
    setIsEditingDescription(false);

    if (description === ticket.description) {
      return;
    }

    const ok = await saveField({ description });
    if (!ok) {
      setDescription(ticket.description);
    }
  };

  const cancelDescriptionEdit = () => {
    setDescription(ticket.description);
    setIsEditingDescription(false);
  };

  const handleAssigneeChange = async (value: string) => {
    const previous = assignee;
    setAssignee(value);
    const ok = await saveField({
      assigneeClerkId: value === "unassigned" ? null : value,
    });
    if (!ok) {
      setAssignee(previous);
    }
  };

  const handleTagsChange = async (tagIds: string[]) => {
    const previous = selectedTags;
    setSelectedTags(tagIds);
    const ok = await saveField({ tagIds });
    if (!ok) {
      setSelectedTags(previous);
    }
  };

  const handleColorChange = async (color: string) => {
    const previous = ticketColor;
    setTicketColor(color);
    onTicketPatch?.(ticket.id, { color });
    const ok = await saveField({ color });
    if (!ok) {
      setTicketColor(previous);
      onTicketPatch?.(ticket.id, { color: previous });
    }
  };

  const handleStatusChange = async (nextStatus: TicketStatus) => {
    if (nextStatus === status) return;

    const previous = status;
    setStatus(nextStatus);
    setSaveState("saving");

    const result = await changeTicketStatusAction(
      ticket.id,
      project.id,
      nextStatus
    );

    if (result.success) {
      const timestamp = formatSavedAt(new Date());
      setSavedAt(timestamp);
      setSaveState("saved");
      router.refresh();
      return;
    }

    setStatus(previous);
    setSaveState("error");
    showToast("move_failed: reverting", "error");
  };

  const handleRetry = async () => {
    if (!lastFailedData) return;
    await saveField(lastFailedData);
  };

  const ticketNotes = notes.filter((n) => n.ticketId === ticket.id);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      style={peekColorScopeStyle}
    >
      <SheetHeader className="shrink-0 space-y-2 text-left">
        <SheetDescription className="font-mono text-[10px] uppercase tracking-wide text-primary">
          ticket.peek() · {formatTicketNumber(ticket.number)} ·{" "}
          {STATUS_LABELS[status]}
        </SheetDescription>

        {isEditingTitle ? (
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onBlur={() => void commitTitleEdit()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void commitTitleEdit();
              }
              if (event.key === "Escape") {
                cancelTitleEdit();
              }
            }}
            autoFocus
            aria-label="Ticket title"
            className="h-9 border-primary/40 bg-black-light/40 font-mono text-base font-medium text-primary"
          />
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <SheetTitle
              className="min-w-0 flex-1 truncate text-left text-lg font-medium leading-tight text-primary"
              title={title}
            >
              {title}
            </SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-primary"
              aria-label="Edit title"
              onClick={() => setIsEditingTitle(true)}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )}

        <div
          className="group/desc relative rounded-md border border-primary/30 bg-accent px-4 py-3"
          style={getTicketPeekAccentStyle(ticketColor || undefined)}
        >
          {isEditingDescription ? (
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              onBlur={() => void commitDescriptionEdit()}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  cancelDescriptionEdit();
                }
                if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void commitDescriptionEdit();
                }
              }}
              autoFocus
              aria-label="Ticket description"
              placeholder="Add a description…"
              className={cn(
                "min-h-[88px] resize-none border-primary/25 bg-black-light/50",
                "font-mono text-sm leading-relaxed text-primary",
                "placeholder:text-primary/50 focus-visible:ring-primary/40"
              )}
            />
          ) : (
            <>
              <blockquote className="min-h-[2.5rem] pr-8 font-mono text-sm leading-relaxed whitespace-pre-wrap text-primary/90">
                {description.trim() ? (
                  description
                ) : (
                  <span className="text-primary/60 italic">
                    No description yet.
                  </span>
                )}
              </blockquote>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={cn(
                  "absolute right-2 top-2 h-7 w-7 text-primary/70",
                  "opacity-0 transition-opacity hover:bg-primary/10 hover:text-primary",
                  "group-hover/desc:opacity-100 focus-visible:opacity-100"
                )}
                aria-label="Edit description"
                onClick={() => setIsEditingDescription(true)}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </>
          )}
        </div>

        <div className="space-y-3 rounded-lg border border-primary/20 bg-black-light/20 p-3">
          <div className="flex items-center gap-3">
            <Label
              htmlFor={`ticket-status-${ticket.id}`}
              className="w-24 shrink-0"
            >
              --status
            </Label>
            <TicketStatusNav
              side="prev"
              value={status}
              disabled={saveState === "saving"}
              onChange={(nextStatus) => void handleStatusChange(nextStatus)}
            />
            <TicketStatusSelect
              value={status}
              disabled={saveState === "saving"}
              onChange={(nextStatus) => void handleStatusChange(nextStatus)}
              className="min-w-0 flex-1 [&_button]:h-8 [&_button]:w-full"
            />
            <TicketStatusNav
              side="next"
              value={status}
              disabled={saveState === "saving"}
              onChange={(nextStatus) => void handleStatusChange(nextStatus)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Label
              htmlFor={`ticket-assignee-${ticket.id}`}
              className="w-24 shrink-0"
            >
              --assignee
            </Label>
            <div className="min-w-0 flex-1">
              <Select
                value={assignee || "unassigned"}
                onValueChange={(value) => void handleAssigneeChange(value)}
              >
                <SelectTrigger
                  id={`ticket-assignee-${ticket.id}`}
                  className="h-8 w-full"
                >
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.clerkUserId} value={m.clerkUserId}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <TagPicker
            tags={tags}
            selectedTagIds={selectedTags}
            projectId={project.id}
            onChange={(tagIds) => void handleTagsChange(tagIds)}
          />
          <div className="flex items-center gap-3">
            <Label className="w-24 shrink-0">--color</Label>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <button
                type="button"
                aria-label="Use default theme color"
                aria-pressed={!ticketColor}
                onClick={() => void handleColorChange("")}
                className={cn(
                  "h-7 rounded border px-2 font-mono text-[10px] transition-colors",
                  !ticketColor
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-primary/20 text-muted-foreground hover:border-primary/40"
                )}
              >
                default
              </button>
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Set ticket color ${color}`}
                  aria-pressed={ticketColor === color}
                  onClick={() => void handleColorChange(color)}
                  className={cn(
                    "h-7 w-7 rounded border-2 transition-all",
                    ticketColor === color
                      ? "scale-110 border-primary"
                      : "border-primary/20 hover:border-primary/50"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div
          aria-live="polite"
          className={cn(
            "font-mono text-xs",
            saveState === "error"
              ? "text-destructive"
              : saveState === "saved"
                ? "text-primary"
                : "text-muted-foreground"
          )}
        >
          {saveState === "saving" && "> saving…"}
          {saveState === "saved" && savedAt && `> saved_at ${savedAt}`}
          {saveState === "error" && (
            <button
              type="button"
              onClick={() => void handleRetry()}
              className="underline underline-offset-2"
            >
              save_failed: retry
            </button>
          )}
        </div>
      </SheetHeader>
      <NotesThread
        className="mt-2 min-h-0 flex-1"
        notes={ticketNotes}
        members={members}
        ticketId={ticket.id}
        projectId={project.id}
        accentColor={ticketColor || undefined}
      />
    </div>
  );
}
