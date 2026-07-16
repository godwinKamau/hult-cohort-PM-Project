"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { TicketDTO, TagDTO, OrgMemberDTO, TicketStatus } from "@/lib/types";
import { TicketCard } from "./TicketCard";
import { cn } from "@/lib/cn";

const STATUS_LABELS: Record<TicketStatus, string> = {
  todo: "TO_DO",
  in_progress: "IN_PROGRESS",
  done: "DONE",
};

interface BoardColumnProps {
  status: TicketStatus;
  tickets: TicketDTO[];
  tags: TagDTO[];
  members: OrgMemberDTO[];
  onTicketClick: (ticketId: string) => void;
}

export function BoardColumn({
  status,
  tickets,
  tags,
  members,
  onTicketClick,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col min-h-[400px] rounded border border-primary/20 bg-black-light/20 p-3",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="mb-3 inline-block cyber-border bg-black-light/50 rounded px-3 py-1 self-start">
        <h3 className="font-mono text-xs text-primary">{STATUS_LABELS[status]}</h3>
      </div>
      <SortableContext
        items={tickets.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 flex-1">
          {tickets.map((ticket, i) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              index={i}
              tags={tags}
              members={members}
              onClick={() => onTicketClick(ticket.id)}
            />
          ))}
          {tickets.length === 0 && (
            <p className="font-mono text-xs text-muted-foreground text-center py-8">
              $ waiting_for_tickets…
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
