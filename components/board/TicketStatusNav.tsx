"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TicketStatus } from "@/lib/types";
import { TICKET_STATUSES } from "@/lib/ticketStatus";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface TicketStatusNavProps {
  value: TicketStatus;
  disabled?: boolean;
  compact?: boolean;
  side?: "prev" | "next" | "both";
  className?: string;
  onChange: (status: TicketStatus) => void;
}

function stopInteraction(event: React.SyntheticEvent) {
  event.stopPropagation();
}

function getAdjacentStatus(
  current: TicketStatus,
  direction: "prev" | "next"
): TicketStatus | null {
  const index = TICKET_STATUSES.indexOf(current);
  if (index < 0) return null;

  const nextIndex = direction === "prev" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= TICKET_STATUSES.length) {
    return null;
  }

  return TICKET_STATUSES[nextIndex] ?? null;
}

export function TicketStatusNav({
  value,
  disabled = false,
  compact = false,
  side = "both",
  className,
  onChange,
}: TicketStatusNavProps) {
  const prevStatus = getAdjacentStatus(value, "prev");
  const nextStatus = getAdjacentStatus(value, "next");
  const showPrev = side === "prev" || side === "both";
  const showNext = side === "next" || side === "both";

  const buttonClass = cn(
    "shrink-0 border border-primary/30 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
    compact ? "h-6 w-6" : "h-8 w-8"
  );

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      onPointerDown={stopInteraction}
      onClick={stopInteraction}
      onKeyDown={stopInteraction}
    >
      {showPrev && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={buttonClass}
          aria-label="Move ticket to previous status"
          disabled={disabled || !prevStatus}
          onClick={() => {
            if (prevStatus) onChange(prevStatus);
          }}
        >
          <ChevronLeft
            className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
            aria-hidden
          />
        </Button>
      )}
      {showNext && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={buttonClass}
          aria-label="Move ticket to next status"
          disabled={disabled || !nextStatus}
          onClick={() => {
            if (nextStatus) onChange(nextStatus);
          }}
        >
          <ChevronRight
            className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
            aria-hidden
          />
        </Button>
      )}
    </div>
  );
}
