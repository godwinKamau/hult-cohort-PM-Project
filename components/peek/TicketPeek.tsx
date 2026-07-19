"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type {
  TicketDTO,
  TagDTO,
  NoteDTO,
  OrgMemberDTO,
  ProjectDTO,
} from "@/lib/types";
import { TicketPeekContent } from "./TicketPeekContent";

interface TicketPeekProps {
  tickets: TicketDTO[];
  tags: TagDTO[];
  notes: NoteDTO[];
  members: OrgMemberDTO[];
  project: ProjectDTO;
}

export function TicketPeek({
  tickets,
  tags,
  notes,
  members,
  project,
}: TicketPeekProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get("ticket");
  const ticket = ticketId ? tickets.find((t) => t.id === ticketId) : undefined;
  const isOpen = Boolean(ticketId);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ticket");
    const qs = params.toString();
    router.push(`/projects/${project.id}${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  }, [router, searchParams, project.id]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="overflow-hidden text-foreground">
        {ticket ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <TicketPeekContent
            key={ticket.id}
            ticket={ticket}
            tags={tags}
            notes={notes}
            members={members}
            project={project}
            />
          </div>
        ) : (
          <div className="space-y-2 pt-8">
            <p className="font-mono text-primary">ticket.peek()</p>
            <p className="font-mono text-sm text-muted-foreground">
              &gt; error: ticket_not_found
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
