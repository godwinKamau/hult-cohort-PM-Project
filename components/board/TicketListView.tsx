"use client";

import type { TicketDTO, TagDTO, OrgMemberDTO, TicketStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { TagBadge } from "./TagBadge";

const STATUS_LABELS: Record<TicketStatus, string> = {
  todo: "todo",
  in_progress: "in_progress",
  done: "done",
};

interface TicketListViewProps {
  tickets: TicketDTO[];
  tags: TagDTO[];
  members: OrgMemberDTO[];
  onTicketClick: (ticketId: string) => void;
}

export function TicketListView({
  tickets,
  tags,
  members,
  onTicketClick,
}: TicketListViewProps) {
  if (tickets.length === 0) {
    return (
      <p className="font-mono text-sm text-muted-foreground py-8 text-center">
        $ waiting_for_tickets…
      </p>
    );
  }

  return (
    <div className="border border-primary/20 rounded overflow-hidden">
      <div className="grid grid-cols-[1fr_100px_120px_auto] gap-2 px-4 py-2 bg-black-light/50 border-b border-primary/20 font-mono text-xs text-muted-foreground">
        <span>title</span>
        <span>status</span>
        <span>assignee</span>
        <span>tags</span>
      </div>
      {tickets.map((ticket, i) => {
        const assignee = members.find(
          (m) => m.clerkUserId === ticket.assigneeClerkId
        );
        const ticketTags = tags.filter((t) => ticket.tagIds.includes(t.id));

        return (
          <button
            key={ticket.id}
            onClick={() => onTicketClick(ticket.id)}
            className="grid grid-cols-[1fr_100px_120px_auto] gap-2 px-4 py-3 border-b border-primary/10 hover:bg-primary/5 transition-colors text-left w-full"
          >
            <span className="font-mono text-sm text-primary truncate">
              #{String(i + 1).padStart(2, "0")} {ticket.title}
            </span>
            <Badge variant="outline" className="w-fit">
              {STATUS_LABELS[ticket.status]}
            </Badge>
            <span className="font-mono text-xs text-muted-foreground truncate">
              {assignee?.name ?? "—"}
            </span>
            <div className="flex flex-wrap gap-1">
              {ticketTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
