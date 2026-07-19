import type { TicketStatus } from "@/lib/types";

export const TICKET_STATUSES: TicketStatus[] = ["todo", "in_progress", "done"];

export const STATUS_LABELS: Record<TicketStatus, string> = {
  todo: "todo",
  in_progress: "in_progress",
  done: "done",
};

export const STATUS_LABELS_UPPER: Record<TicketStatus, string> = {
  todo: "TO_DO",
  in_progress: "IN_PROGRESS",
  done: "DONE",
};

export const STATUS_LIST_SECTION_LABELS: Record<TicketStatus, string> = {
  todo: "todo",
  in_progress: "in_progress",
  done: "completed",
};
