"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TicketDTO, TagDTO, OrgMemberDTO } from "@/lib/types";
import { TagBadge } from "./TagBadge";
import { cn } from "@/lib/cn";

interface TicketCardProps {
  ticket: TicketDTO;
  index: number;
  tags: TagDTO[];
  members: OrgMemberDTO[];
  onClick: () => void;
}

export function TicketCard({
  ticket,
  index,
  tags,
  members,
  onClick,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cyber-border bg-black-light/30 border-primary/20 hover:border-primary/50 transition-all duration-300 rounded p-3 cursor-pointer group",
        isDragging && "opacity-50 shadow-lg shadow-primary/20"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-mono text-xs text-primary bg-black/80 rounded px-2 py-0.5">
          #{String(index + 1).padStart(2, "0")}
        </span>
        {assignee && (
          <span className="font-mono text-xs text-muted-foreground truncate max-w-[80px]">
            @{assignee.name.split(" ")[0]}
          </span>
        )}
      </div>
      <h4 className="font-mono text-sm text-primary mb-2 line-clamp-2">
        {ticket.title}
      </h4>
      {ticketTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ticketTags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}
