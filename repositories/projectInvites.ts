import { connectDB } from "@/lib/db";
import { serializeDoc } from "@/lib/serialize";
import type { ProjectInviteDTO, ProjectInviteInboxDTO } from "@/lib/types";
import { Project, ProjectInvite, User } from "@/models";

function serializeInvite(
  doc: Parameters<typeof serializeDoc>[0]
): ProjectInviteDTO | null {
  return serializeDoc<ProjectInviteDTO>(doc);
}

export async function createInvite(
  orgId: string,
  projectId: string,
  inviterClerkId: string,
  inviteeClerkId: string
): Promise<ProjectInviteDTO> {
  await connectDB();
  const doc = await ProjectInvite.create({
    organizationId: orgId,
    projectId,
    inviterClerkId,
    inviteeClerkId,
    status: "pending",
  });
  return serializeInvite(doc.toObject())!;
}

export async function getInvite(
  inviteId: string
): Promise<ProjectInviteDTO | null> {
  await connectDB();
  const doc = await ProjectInvite.findById(inviteId).lean();
  return serializeInvite(doc);
}

export async function getPendingInviteForProjectUser(
  projectId: string,
  inviteeClerkId: string
): Promise<ProjectInviteDTO | null> {
  await connectDB();
  const doc = await ProjectInvite.findOne({
    projectId,
    inviteeClerkId,
    status: "pending",
  }).lean();
  return serializeInvite(doc);
}

export async function listPendingInvitesForUser(
  inviteeClerkId: string
): Promise<ProjectInviteInboxDTO[]> {
  await connectDB();
  const docs = await ProjectInvite.find({
    inviteeClerkId,
    status: "pending",
  })
    .sort({ createdAt: -1 })
    .lean();

  const invites = docs
    .map((doc) => serializeInvite(doc))
    .filter(Boolean) as ProjectInviteDTO[];

  if (invites.length === 0) return [];

  const projectIds = [...new Set(invites.map((invite) => invite.projectId))];
  const inviterIds = [...new Set(invites.map((invite) => invite.inviterClerkId))];

  const [projects, users] = await Promise.all([
    Project.find({ _id: { $in: projectIds } })
      .select("name")
      .lean(),
    User.find({ clerkUserId: { $in: inviterIds } })
      .select("clerkUserId name")
      .lean(),
  ]);

  const projectNameById = new Map(
    projects.map((project) => [project._id.toString(), project.name])
  );
  const inviterNameById = new Map(
    users.map((user) => [user.clerkUserId, user.name])
  );

  return invites.map((invite) => ({
    ...invite,
    projectName: projectNameById.get(invite.projectId) ?? "Unknown project",
    inviterName: inviterNameById.get(invite.inviterClerkId) ?? "Unknown user",
  }));
}

export async function listInvitesForProject(
  orgId: string,
  projectId: string
): Promise<ProjectInviteDTO[]> {
  await connectDB();
  const docs = await ProjectInvite.find({
    organizationId: orgId,
    projectId,
    status: "pending",
  })
    .sort({ createdAt: -1 })
    .lean();
  return docs.map((doc) => serializeInvite(doc)!).filter(Boolean);
}

export async function setInviteStatus(
  inviteId: string,
  status: ProjectInviteDTO["status"]
): Promise<ProjectInviteDTO | null> {
  await connectDB();
  const doc = await ProjectInvite.findByIdAndUpdate(
    inviteId,
    { $set: { status } },
    { returnDocument: "after" }
  ).lean();
  return serializeInvite(doc);
}
