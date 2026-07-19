"use client";

import type { TicketStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/ticketStatus";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";

interface TicketStatusSelectProps {
  value: TicketStatus;
  onChange: (status: TicketStatus) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}

function stopInteraction(event: React.SyntheticEvent) {
  event.stopPropagation();
}

export function TicketStatusSelect({
  value,
  onChange,
  disabled = false,
  compact = false,
  className,
}: TicketStatusSelectProps) {
  return (
    <div
      className={className}
      onPointerDown={stopInteraction}
      onClick={stopInteraction}
      onKeyDown={stopInteraction}
    >
      <Select
        value={value}
        disabled={disabled}
        onValueChange={(next) => onChange(next as TicketStatus)}
      >
        <SelectTrigger
          className={cn(
            "font-mono",
            compact ? "h-6 w-[108px] px-2 text-[10px]" : "h-8"
          )}
          aria-label="Ticket status"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todo">{STATUS_LABELS.todo}</SelectItem>
          <SelectItem value="in_progress">{STATUS_LABELS.in_progress}</SelectItem>
          <SelectItem value="done">{STATUS_LABELS.done}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
