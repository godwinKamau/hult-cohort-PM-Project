"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type {
  TicketDTO,
  TagDTO,
  OrgMemberDTO,
  TicketStatus,
} from "@/lib/types";
import { BoardColumn } from "./BoardColumn";
import { TicketCard } from "./TicketCard";
import { changeTicketStatusAction, moveTicketAction } from "@/actions/tickets";
import { useTerminalToast } from "@/components/ui/terminal-toast";

const COLUMNS: TicketStatus[] = ["todo", "in_progress", "done"];

interface KanbanBoardProps {
  projectId: string;
  initialTickets: TicketDTO[];
  tags: TagDTO[];
  members: OrgMemberDTO[];
  notesCountByTicketId: Map<string, number>;
  filtersActive?: boolean;
  onTicketClick: (ticketId: string) => void;
  onCreateTicket: (status: TicketStatus, title: string) => Promise<boolean>;
  onStatusChange?: (ticketId: string, status: TicketStatus) => Promise<boolean>;
}

function getColumnTickets(tickets: TicketDTO[], status: TicketStatus) {
  return tickets
    .filter((t) => t.status === status)
    .sort((a, b) => a.position - b.position);
}

function computePosition(
  columnTickets: TicketDTO[],
  overIndex: number
): number {
  if (columnTickets.length === 0) return 1000;
  if (overIndex <= 0) return columnTickets[0].position / 2;
  if (overIndex >= columnTickets.length) {
    return columnTickets[columnTickets.length - 1].position + 1000;
  }
  const before = columnTickets[overIndex - 1].position;
  const after = columnTickets[overIndex].position;
  return (before + after) / 2;
}

export function KanbanBoard({
  projectId,
  initialTickets,
  tags,
  members,
  notesCountByTicketId,
  filtersActive = false,
  onTicketClick,
  onCreateTicket,
  onStatusChange,
}: KanbanBoardProps) {
  const { showToast } = useTerminalToast();
  const [tickets, setTickets] = useState(initialTickets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);

  const ticketKey = useMemo(
    () =>
      initialTickets
        .map((t) => `${t.id}:${t.number}:${t.status}:${t.position}:${t.color ?? ""}`)
        .join("|"),
    [initialTickets]
  );

  const [syncKey, setSyncKey] = useState(ticketKey);
  if (syncKey !== ticketKey) {
    setSyncKey(ticketKey);
    setTickets(initialTickets);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeTicket = useMemo(
    () => tickets.find((t) => t.id === activeId),
    [tickets, activeId]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over) return;

      const ticketId = active.id as string;
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket) return;

      const overId = over.id as string;
      let newStatus: TicketStatus = ticket.status;
      let overIndex = 0;

      if (COLUMNS.includes(overId as TicketStatus)) {
        newStatus = overId as TicketStatus;
        const columnTickets = getColumnTickets(tickets, newStatus).filter(
          (t) => t.id !== ticketId
        );
        overIndex = columnTickets.length;
      } else {
        const overTicket = tickets.find((t) => t.id === overId);
        if (overTicket) {
          newStatus = overTicket.status;
          const columnTickets = getColumnTickets(tickets, newStatus).filter(
            (t) => t.id !== ticketId
          );
          overIndex = columnTickets.findIndex((t) => t.id === overId);
          if (overIndex < 0) overIndex = columnTickets.length;
        }
      }

      const columnTickets = getColumnTickets(tickets, newStatus).filter(
        (t) => t.id !== ticketId
      );
      const newPosition = computePosition(columnTickets, overIndex);

      const snapshot = [...tickets];
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: newStatus, position: newPosition }
            : t
        )
      );

      const result = await moveTicketAction(
        ticketId,
        projectId,
        newStatus,
        newPosition
      );

      if (!result.success) {
        setTickets(snapshot);
        showToast("move_failed: reverting", "error");
      }
    },
    [tickets, projectId, showToast]
  );

  const handleStatusChange = useCallback(
    async (ticketId: string, status: TicketStatus) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket || ticket.status === status) {
        return true;
      }

      const snapshot = [...tickets];
      const maxPos =
        getColumnTickets(tickets, status).reduce(
          (max, current) => Math.max(max, current.position),
          0
        ) + 1000;

      setStatusChangingId(ticketId);
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status, position: maxPos } : t
        )
      );

      let success = false;
      if (onStatusChange) {
        success = await onStatusChange(ticketId, status);
      } else {
        const result = await changeTicketStatusAction(
          ticketId,
          projectId,
          status
        );
        success = result.success;
        if (!result.success) {
          showToast("move_failed: reverting", "error");
        }
      }

      setStatusChangingId(null);

      if (!success) {
        setTickets(snapshot);
      }

      return success;
    },
    [onStatusChange, projectId, showToast, tickets]
  );

  return (
    <DndContext
      id={`kanban-${projectId}`}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tickets={getColumnTickets(tickets, status)}
            tags={tags}
            members={members}
            notesCountByTicketId={notesCountByTicketId}
            filtersActive={filtersActive}
            onTicketClick={onTicketClick}
            onCreateTicket={onCreateTicket}
            onStatusChange={handleStatusChange}
            statusChangingId={statusChangingId}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket && (
          <TicketCard
            ticket={activeTicket}
            tags={tags}
            members={members}
            notesCount={notesCountByTicketId.get(activeTicket.id) ?? 0}
            onClick={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
