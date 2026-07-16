import { connectDB } from "@/lib/db";
import { serializeDoc } from "@/lib/serialize";
import type { TicketDTO, TicketStatus } from "@/lib/types";
import { Ticket } from "@/models";

export async function listTickets(
  orgId: string,
  projectId: string,
  filters?: { status?: TicketStatus; assigneeClerkId?: string }
): Promise<TicketDTO[]> {
  await connectDB();
  const filter: Record<string, unknown> = {
    organizationId: orgId,
    projectId,
  };
  if (filters?.status) filter.status = filters.status;
  if (filters?.assigneeClerkId) filter.assigneeClerkId = filters.assigneeClerkId;

  const docs = await Ticket.find(filter)
    .sort({ status: 1, position: 1 })
    .lean();
  return docs.map((d) => serializeDoc<TicketDTO>(d)!);
}

export async function getTicket(
  orgId: string,
  ticketId: string
): Promise<TicketDTO | null> {
  await connectDB();
  const doc = await Ticket.findOne({
    _id: ticketId,
    organizationId: orgId,
  }).lean();
  return serializeDoc<TicketDTO>(doc);
}

export async function getMaxPosition(
  orgId: string,
  projectId: string,
  status: TicketStatus
): Promise<number> {
  await connectDB();
  const last = await Ticket.findOne({
    organizationId: orgId,
    projectId,
    status,
  })
    .sort({ position: -1 })
    .lean();
  return last?.position ?? 0;
}

export async function createTicket(
  orgId: string,
  userId: string,
  data: {
    projectId: string;
    title: string;
    description?: string;
    status?: TicketStatus;
    assigneeClerkId?: string;
    tagIds?: string[];
  }
): Promise<TicketDTO> {
  await connectDB();
  const status = data.status ?? "todo";
  const maxPos = await getMaxPosition(orgId, data.projectId, status);

  const doc = await Ticket.create({
    organizationId: orgId,
    projectId: data.projectId,
    title: data.title,
    description: data.description ?? "",
    status,
    position: maxPos + 1000,
    assigneeClerkId: data.assigneeClerkId,
    tagIds: data.tagIds ?? [],
    createdBy: userId,
  });
  return serializeDoc<TicketDTO>(doc.toObject())!;
}

export async function updateTicket(
  orgId: string,
  ticketId: string,
  data: Partial<{
    title: string;
    description: string;
    status: TicketStatus;
    position: number;
    assigneeClerkId: string | null;
    tagIds: string[];
  }>
): Promise<TicketDTO | null> {
  await connectDB();
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) update[key] = value;
  }

  const doc = await Ticket.findOneAndUpdate(
    { _id: ticketId, organizationId: orgId },
    { $set: update },
    { new: true }
  ).lean();
  return serializeDoc<TicketDTO>(doc);
}

export async function moveTicket(
  orgId: string,
  ticketId: string,
  status: TicketStatus,
  position: number
): Promise<TicketDTO | null> {
  return updateTicket(orgId, ticketId, { status, position });
}

export async function rebalanceColumn(
  orgId: string,
  projectId: string,
  status: TicketStatus
): Promise<void> {
  await connectDB();
  const tickets = await Ticket.find({
    organizationId: orgId,
    projectId,
    status,
  }).sort({ position: 1 });

  let pos = 1000;
  for (const ticket of tickets) {
    ticket.position = pos;
    await ticket.save();
    pos += 1000;
  }
}
