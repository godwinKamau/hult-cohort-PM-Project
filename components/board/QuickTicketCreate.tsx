"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

interface QuickTicketCreateProps {
  onCreate: (title: string) => Promise<boolean>;
  label?: string;
  compact?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When false, only the open form is rendered (for external triggers). */
  showTrigger?: boolean;
  className?: string;
}

export function QuickTicketCreate({
  onCreate,
  label = "Add ticket",
  compact = false,
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
  className,
}: QuickTicketCreateProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const formId = useId();
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(nextOpen);
    } else {
      setUncontrolledOpen(nextOpen);
    }
  };

  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [hasError, setHasError] = useState(false);

  const close = () => {
    setTitle("");
    setHasError(false);
    setOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);
    setHasError(false);
    const success = await onCreate(title.trim());
    setIsCreating(false);

    if (success) {
      close();
    } else {
      setHasError(true);
    }
  };

  if (isOpen) {
    return (
      <form
        id={formId}
        onSubmit={handleSubmit}
        className={cn("space-y-2", compact ? "w-full basis-full" : "mt-2")}
      >
        <Input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
          placeholder="What needs to be done?"
          aria-label="Ticket title"
          aria-invalid={hasError}
          disabled={isCreating}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={!title.trim() || isCreating}>
            {isCreating ? "adding…" : "add_ticket"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={close}>
            cancel
          </Button>
          {hasError && (
            <span role="alert" className="font-mono text-xs text-destructive">
              unable_to_add
            </span>
          )}
        </div>
      </form>
    );
  }

  if (!showTrigger) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      aria-expanded={false}
      aria-controls={formId}
      className={cn(
        "justify-start border border-dashed border-primary/30 text-muted-foreground hover:border-primary/60 hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring",
        compact
          ? "h-7 shrink-0 gap-0.5 whitespace-nowrap px-1.5 text-[10px] min-h-7"
          : "mt-2 w-full min-h-10",
        className
      )}
      onClick={() => setOpen(true)}
    >
      <Plus
        className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")}
        aria-hidden="true"
      />
      <span>{compact ? "add_ticket" : label}</span>
    </Button>
  );
}
