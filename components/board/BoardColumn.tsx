"use client";

import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { TicketDTO, TagDTO, OrgMemberDTO, TicketStatus } from "@/lib/types";
import { STATUS_LABELS_UPPER } from "@/lib/ticketStatus";
import { TicketCard } from "./TicketCard";
import { QuickTicketCreate } from "./QuickTicketCreate";
import { cn } from "@/lib/cn";

const STATUS_LABELS = STATUS_LABELS_UPPER;

interface BoardColumnProps {
  status: TicketStatus;
  tickets: TicketDTO[];
  tags: TagDTO[];
  members: OrgMemberDTO[];
  notesCountByTicketId: Map<string, number>;
  filtersActive?: boolean;
  onTicketClick: (ticketId: string) => void;
  onCreateTicket: (status: TicketStatus, title: string) => Promise<boolean>;
  onStatusChange?: (ticketId: string, status: TicketStatus) => Promise<boolean>;
  statusChangingId?: string | null;
}

export function BoardColumn({
  status,
  tickets,
  tags,
  members,
  notesCountByTicketId,
  filtersActive = false,
  onTicketClick,
  onCreateTicket,
  onStatusChange,
  statusChangingId = null,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const [createOpen, setCreateOpen] = useState(false);
  const isEmpty = tickets.length === 0;

  const handleCreate = (title: string) => onCreateTicket(status, title);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/column flex flex-col min-h-[400px] rounded border border-primary/20 bg-black-light/20 p-3",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <div className="cyber-border flex h-7 min-w-0 flex-1 items-center gap-1 rounded bg-black-light/50 px-1.5">
          <h3 className="min-w-0 truncate font-mono text-[10px] leading-none text-primary">
            {STATUS_LABELS[status]}
          </h3>
          <span className="shrink-0 font-mono text-[10px] leading-none tabular-nums text-muted-foreground">
            ({tickets.length})
          </span>
        </div>
        {!createOpen && (
          <QuickTicketCreate
            label="Add ticket"
            compact
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreate={handleCreate}
            className="shrink-0"
          />
        )}
      </div>
      <SortableContext
        id={status}
        items={tickets.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 flex-1">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              tags={tags}
              members={members}
              notesCount={notesCountByTicketId.get(ticket.id) ?? 0}
              onClick={() => onTicketClick(ticket.id)}
              onStatusChange={onStatusChange}
              statusChanging={statusChangingId === ticket.id}
            />
          ))}
          {isEmpty && !createOpen && filtersActive && (
            <div
              className={cn(
                "w-full rounded border border-dashed border-primary/20 bg-black-light/20 px-4 py-8",
                "font-mono text-xs text-muted-foreground text-center"
              )}
            >
              $ tickets_hidden_by_filters
            </div>
          )}
          {isEmpty && !createOpen && !filtersActive && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label={`Create first ticket in ${STATUS_LABELS[status]}`}
              className={cn(
                "w-full rounded border border-dashed border-primary/30 bg-black-light/20 px-4 py-8",
                "font-mono text-xs text-muted-foreground text-center",
                "transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
            >
              $ no_tickets_yet — create_first_ticket
            </button>
          )}
          {createOpen && (
            <QuickTicketCreate
              open={createOpen}
              onOpenChange={setCreateOpen}
              showTrigger={false}
              compact={!isEmpty}
              onCreate={handleCreate}
            />
          )}
        </div>
      </SortableContext>
    </div>
  );
}
