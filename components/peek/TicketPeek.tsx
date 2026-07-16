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
  const ticket = tickets.find((t) => t.id === ticketId);

  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ticket");
    const qs = params.toString();
    router.push(`/projects/${project.id}${qs ? `?${qs}` : ""}`, {
      scroll: false,
    });
  }, [router, searchParams, project.id]);

  return (
    <Sheet open={!!ticket} onOpenChange={(open) => !open && close()}>
      <SheetContent side="right" className="overflow-y-auto">
        {ticket ? (
          <TicketPeekContent
            key={ticket.id}
            ticket={ticket}
            tags={tags}
            notes={notes}
            members={members}
            project={project}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
