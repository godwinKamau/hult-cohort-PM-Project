"use server";

import { revalidatePath } from "next/cache";
import { isOrgMember, requireOrg, requireProjectMembership } from "@/lib/auth";
import * as ticketRepo from "@/repositories/tickets";
import type { TicketDTO, TicketStatus } from "@/lib/types";

export async function createTicketAction(data: {
  projectId: string;
  title: string;
  description?: string;
  assigneeClerkId?: string;
  tagIds?: string[];
}): Promise<{ success: boolean; ticket?: TicketDTO; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    await requireProjectMembership(orgId, data.projectId, userId);

    if (data.assigneeClerkId) {
      const member = await isOrgMember(orgId, data.assigneeClerkId);
      if (!member) {
        return { success: false, error: "Assignee is not an org member" };
      }
    }

    const ticket = await ticketRepo.createTicket(orgId, userId, data);
    revalidatePath(`/projects/${data.projectId}`);
    return { success: true, ticket };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateTicketAction(
  ticketId: string,
  projectId: string,
  data: Partial<{
    title: string;
    description: string;
    assigneeClerkId: string | null;
    tagIds: string[];
  }>
): Promise<{ success: boolean; ticket?: TicketDTO; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    await requireProjectMembership(orgId, projectId, userId);

    if (data.assigneeClerkId) {
      const member = await isOrgMember(orgId, data.assigneeClerkId);
      if (!member) {
        return { success: false, error: "Assignee is not an org member" };
      }
    }

    const ticket = await ticketRepo.updateTicket(orgId, ticketId, data);
    revalidatePath(`/projects/${projectId}`);
    return { success: true, ticket: ticket ?? undefined };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function moveTicketAction(
  ticketId: string,
  projectId: string,
  status: TicketStatus,
  position: number
): Promise<{ success: boolean; ticket?: TicketDTO; error?: string }> {
  try {
    const { orgId, userId } = await requireOrg();
    await requireProjectMembership(orgId, projectId, userId);
    const ticket = await ticketRepo.moveTicket(
      orgId,
      ticketId,
      status,
      position
    );

    if (!ticket) {
      return { success: false, error: "Ticket not found" };
    }

    if (Math.abs(position % 1) < 0.001 || position < 1) {
      await ticketRepo.rebalanceColumn(orgId, projectId, status);
    }

    revalidatePath(`/projects/${projectId}`);
    return { success: true, ticket };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
