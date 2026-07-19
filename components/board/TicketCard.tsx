"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlignLeft, MessageSquare } from "lucide-react";
import type { TicketDTO, TagDTO, OrgMemberDTO, TicketStatus } from "@/lib/types";
import { formatTicketNumber } from "@/lib/ticketNumber";
import { TagBadge } from "./TagBadge";
import { TicketStatusSelect } from "./TicketStatusSelect";
import { MemberAvatar } from "./MemberAvatar";
import { cn } from "@/lib/cn";

interface TicketCardProps {
  ticket: TicketDTO;
  tags: TagDTO[];
  members: OrgMemberDTO[];
  notesCount?: number;
  onClick: () => void;
  onStatusChange?: (ticketId: string, status: TicketStatus) => Promise<boolean>;
  statusChanging?: boolean;
}

export function TicketCard({
  ticket,
  tags,
  members,
  notesCount = 0,
  onClick,
  onStatusChange,
  statusChanging = false,
}: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignee = members.find((m) => m.clerkUserId === ticket.assigneeClerkId);
  const ticketTags = tags.filter((t) => ticket.tagIds.includes(t.id));
  const hasDescription = ticket.description.trim().length > 0;
  const showMeta = hasDescription || notesCount > 0;

  const dragProps = {
    ...listeners,
    onClick,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "cyber-border bg-black-light/30 border-primary/20 hover:border-primary/50 transition-all duration-300 rounded p-2.5 cursor-pointer group",
        isDragging && "opacity-50 shadow-lg shadow-primary/20"
      )}
    >
      <div
        {...dragProps}
        className="cursor-grab active:cursor-grabbing space-y-1.5"
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="shrink-0 font-mono text-[10px] text-primary bg-black/80 rounded px-1.5 py-0.5">
            {formatTicketNumber(ticket.number)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {showMeta && (
              <div className="flex items-center gap-1.5">
                {hasDescription && (
                  <span
                    title="Has description"
                    className="inline-flex items-center text-muted-foreground"
                  >
                    <AlignLeft className="h-3 w-3" aria-hidden />
                    <span className="sr-only">Has description</span>
                  </span>
                )}
                {notesCount > 0 && (
                  <span
                    title={`${notesCount} note${notesCount === 1 ? "" : "s"}`}
                    className="inline-flex items-center gap-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    <MessageSquare className="h-3 w-3" aria-hidden />
                    {notesCount}
                  </span>
                )}
              </div>
            )}
            {assignee && <MemberAvatar member={assignee} size="sm" />}
          </div>
        </div>

        <h4 className="font-mono text-sm text-primary leading-snug line-clamp-2">
          {ticket.title}
        </h4>
      </div>

      {(ticketTags.length > 0 || onStatusChange) && (
        <div className="mt-1.5 flex items-center gap-2 min-w-0">
          {ticketTags.length > 0 ? (
            <div
              {...dragProps}
              className="flex min-w-0 flex-1 flex-wrap gap-1 cursor-grab active:cursor-grabbing"
            >
              {ticketTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  className="h-4 px-1.5 text-[10px]"
                />
              ))}
            </div>
          ) : (
            <div className="flex-1" />
          )}
          {onStatusChange && (
            <TicketStatusSelect
              compact
              value={ticket.status}
              disabled={statusChanging}
              className="shrink-0"
              onChange={(status) => {
                if (status !== ticket.status) {
                  void onStatusChange(ticket.id, status);
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
