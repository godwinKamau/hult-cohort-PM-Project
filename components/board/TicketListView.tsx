"use client";

import { useMemo, useState } from "react";
import { AlignLeft, MessageSquare } from "lucide-react";
import type { TicketDTO, TagDTO, OrgMemberDTO, TicketStatus } from "@/lib/types";
import { formatTicketNumber } from "@/lib/ticketNumber";
import {
  STATUS_LABELS,
  STATUS_LIST_SECTION_LABELS,
  TICKET_STATUSES,
} from "@/lib/ticketStatus";
import { TagBadge } from "./TagBadge";
import { QuickTicketCreate } from "./QuickTicketCreate";
import { TicketStatusSelect } from "./TicketStatusSelect";
import { TicketStatusNav } from "./TicketStatusNav";
import { MemberAvatar } from "./MemberAvatar";
import { cn } from "@/lib/cn";

const LIST_GRID =
  "grid grid-cols-[minmax(0,1fr)_120px_120px_minmax(100px,160px)] gap-x-3 px-4";

interface TicketListViewProps {
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

function groupTicketsByStatus(tickets: TicketDTO[]) {
  const groups: Record<TicketStatus, TicketDTO[]> = {
    todo: [],
    in_progress: [],
    done: [],
  };

  for (const ticket of tickets) {
    groups[ticket.status].push(ticket);
  }

  for (const status of TICKET_STATUSES) {
    groups[status].sort((left, right) => left.position - right.position);
  }

  return groups;
}

export function TicketListView({
  tickets,
  tags,
  members,
  notesCountByTicketId,
  filtersActive = false,
  onTicketClick,
  onCreateTicket,
  onStatusChange,
  statusChangingId = null,
}: TicketListViewProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const isEmpty = tickets.length === 0;
  const ticketsByStatus = useMemo(() => groupTicketsByStatus(tickets), [tickets]);

  return (
    <div>
      <div className="border border-primary/20 rounded overflow-hidden">
        <div className={LIST_GRID}>
          <div
            className={cn(
              "col-span-4 grid grid-cols-subgrid items-center gap-x-3 py-2",
              "bg-black-light/50 border-b border-primary/20 font-mono text-xs text-muted-foreground"
            )}
          >
            <span>title</span>
            <span>status</span>
            <span>assignee</span>
            <span>tags</span>
          </div>

          {isEmpty && !createOpen && filtersActive && (
            <div className="col-span-4 w-full px-4 py-8 font-mono text-sm text-muted-foreground text-center">
              $ tickets_hidden_by_filters
            </div>
          )}

          {isEmpty && !createOpen && !filtersActive && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              aria-label="Create first ticket"
              className={cn(
                "col-span-4 w-full px-4 py-8 font-mono text-sm text-muted-foreground text-center",
                "transition-colors hover:bg-primary/5 hover:text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              )}
            >
              $ no_tickets_yet — create_first_ticket
            </button>
          )}

          {TICKET_STATUSES.map((status) => {
            const sectionTickets = ticketsByStatus[status];

            return (
              <section key={status} className="contents">
                <div
                  className={cn(
                    "col-span-4 flex items-center gap-2",
                    "border-b-2 border-primary/45 shadow-[0_1px_0_0_rgba(0,255,65,0.15)]",
                    "bg-black-light/30 px-4 py-2 font-mono text-xs text-primary"
                  )}
                >
                  <span className="cyber-border rounded bg-black-light/50 px-2 py-0.5">
                    {STATUS_LIST_SECTION_LABELS[status]}
                  </span>
                  <span className="text-muted-foreground">
                    ({sectionTickets.length})
                  </span>
                </div>

                {sectionTickets.map((ticket) => {
                  const assignee = members.find(
                    (member) => member.clerkUserId === ticket.assigneeClerkId
                  );
                  const ticketTags = tags.filter((tag) =>
                    ticket.tagIds.includes(tag.id)
                  );
                  const notesCount = notesCountByTicketId.get(ticket.id) ?? 0;
                  const hasDescription = ticket.description.trim().length > 0;

                  return (
                    <div
                      key={ticket.id}
                      className={cn(
                        "col-span-4 grid grid-cols-subgrid items-center gap-x-3 py-3",
                        "border-b border-primary/10 hover:bg-primary/5 transition-colors"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onTicketClick(ticket.id)}
                        className="min-w-0 font-mono text-sm text-primary text-left"
                      >
                        <span className="block truncate">
                          {formatTicketNumber(ticket.number)} {ticket.title}
                        </span>
                        {(hasDescription || notesCount > 0) && (
                          <span className="mt-0.5 flex items-center gap-2 text-muted-foreground">
                            {hasDescription && (
                              <span title="Has description">
                                <AlignLeft className="h-3 w-3" aria-hidden />
                              </span>
                            )}
                            {notesCount > 0 && (
                              <span className="inline-flex items-center gap-0.5 font-mono text-[10px]">
                                <MessageSquare className="h-3 w-3" aria-hidden />
                                {notesCount}
                              </span>
                            )}
                          </span>
                        )}
                      </button>

                      <div className="min-w-0 justify-self-start flex items-center gap-0.5">
                        {onStatusChange ? (
                          <>
                            <TicketStatusNav
                              compact
                              side="prev"
                              value={ticket.status}
                              disabled={statusChangingId === ticket.id}
                              onChange={(nextStatus) => {
                                if (nextStatus !== ticket.status) {
                                  void onStatusChange(ticket.id, nextStatus);
                                }
                              }}
                            />
                            <TicketStatusSelect
                              compact
                              value={ticket.status}
                              disabled={statusChangingId === ticket.id}
                              onChange={(nextStatus) => {
                                if (nextStatus !== ticket.status) {
                                  void onStatusChange(ticket.id, nextStatus);
                                }
                              }}
                            />
                            <TicketStatusNav
                              compact
                              side="next"
                              value={ticket.status}
                              disabled={statusChangingId === ticket.id}
                              onChange={(nextStatus) => {
                                if (nextStatus !== ticket.status) {
                                  void onStatusChange(ticket.id, nextStatus);
                                }
                              }}
                            />
                          </>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            {STATUS_LABELS[ticket.status]}
                          </span>
                        )}
                      </div>

                      <span className="min-w-0 justify-self-start">
                        {assignee ? (
                          <MemberAvatar member={assignee} size="sm" />
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </span>

                      <div className="min-w-0 justify-self-start flex flex-wrap gap-1">
                        {ticketTags.map((tag) => (
                          <TagBadge key={tag.id} tag={tag} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </div>
      {createOpen ? (
        <QuickTicketCreate
          open={createOpen}
          onOpenChange={setCreateOpen}
          showTrigger={false}
          onCreate={(title) => onCreateTicket("todo", title)}
        />
      ) : (
        <QuickTicketCreate
          label="Add ticket"
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreate={(title) => onCreateTicket("todo", title)}
        />
      )}
    </div>
  );
}
