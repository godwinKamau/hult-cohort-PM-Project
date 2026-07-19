import { connectDB } from "@/lib/db";
import { serializeDoc } from "@/lib/serialize";
import type { ProjectInviteDTO, ProjectInviteInboxDTO } from "@/lib/types";
import { Organization, Project, ProjectInvite, User } from "@/models";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function serializeInvite(
  doc: Parameters<typeof serializeDoc>[0]
): ProjectInviteDTO | null {
  return serializeDoc<ProjectInviteDTO>(doc);
}

export async function createInvite(data: {
  orgId: string;
  projectId: string;
  inviterClerkId: string;
  inviteeClerkId?: string;
  inviteeEmail?: string;
  clerkInvitationId?: string;
}): Promise<ProjectInviteDTO> {
  await connectDB();
  try {
    const doc = await ProjectInvite.create({
      organizationId: data.orgId,
      projectId: data.projectId,
      inviterClerkId: data.inviterClerkId,
      inviteeClerkId: data.inviteeClerkId,
      inviteeEmail: data.inviteeEmail
        ? normalizeEmail(data.inviteeEmail)
        : undefined,
      clerkInvitationId: data.clerkInvitationId,
      status: "pending",
    });
    return serializeInvite(doc.toObject())!;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new Error("An invite is already pending for this user");
    }
    throw error;
  }
}

export async function createOrRefreshInvite(data: {
  orgId: string;
  projectId: string;
  inviterClerkId: string;
  inviteeClerkId?: string;
  inviteeEmail?: string;
  clerkInvitationId?: string;
}): Promise<ProjectInviteDTO> {
  await connectDB();

  const filters: Record<string, unknown>[] = [];
  if (data.inviteeClerkId) {
    filters.push({ inviteeClerkId: data.inviteeClerkId });
  }
  if (data.inviteeEmail) {
    filters.push({ inviteeEmail: normalizeEmail(data.inviteeEmail) });
  }

  if (filters.length > 0) {
    const existing = await ProjectInvite.findOne({
      projectId: data.projectId,
      $or: filters,
    }).lean();

    if (existing) {
      if (existing.status === "pending") {
        throw new Error("An invite is already pending for this user");
      }

      const doc = await ProjectInvite.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            status: "pending",
            inviterClerkId: data.inviterClerkId,
            inviteeClerkId: data.inviteeClerkId ?? existing.inviteeClerkId,
            inviteeEmail: data.inviteeEmail
              ? normalizeEmail(data.inviteeEmail)
              : existing.inviteeEmail,
            clerkInvitationId: data.clerkInvitationId,
          },
        },
        { returnDocument: "after" }
      ).lean();
      return serializeInvite(doc)!;
    }
  }

  return createInvite(data);
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
  options: { inviteeClerkId?: string; inviteeEmail?: string }
): Promise<ProjectInviteDTO | null> {
  await connectDB();
  const filters: Record<string, unknown>[] = [];
  if (options.inviteeClerkId) {
    filters.push({ inviteeClerkId: options.inviteeClerkId });
  }
  if (options.inviteeEmail) {
    filters.push({ inviteeEmail: normalizeEmail(options.inviteeEmail) });
  }
  if (filters.length === 0) return null;

  const doc = await ProjectInvite.findOne({
    projectId,
    status: "pending",
    $or: filters,
  }).lean();
  return serializeInvite(doc);
}

async function enrichInvites(
  invites: ProjectInviteDTO[]
): Promise<ProjectInviteInboxDTO[]> {
  if (invites.length === 0) return [];

  const projectIds = [...new Set(invites.map((invite) => invite.projectId))];
  const orgIds = [...new Set(invites.map((invite) => invite.organizationId))];
  const inviterIds = [...new Set(invites.map((invite) => invite.inviterClerkId))];

  const [projects, organizations, users] = await Promise.all([
    Project.find({ _id: { $in: projectIds } })
      .select("name")
      .lean(),
    Organization.find({ clerkOrgId: { $in: orgIds } })
      .select("clerkOrgId name")
      .lean(),
    User.find({ clerkUserId: { $in: inviterIds } })
      .select("clerkUserId name")
      .lean(),
  ]);

  const projectNameById = new Map(
    projects.map((project) => [project._id.toString(), project.name])
  );
  const orgNameById = new Map(
    organizations.map((org) => [org.clerkOrgId, org.name])
  );
  const inviterNameById = new Map(
    users.map((user) => [user.clerkUserId, user.name])
  );

  return invites.map((invite) => ({
    ...invite,
    projectName: projectNameById.get(invite.projectId) ?? "Unknown project",
    organizationName:
      orgNameById.get(invite.organizationId) ?? "Unknown organization",
    inviterName: inviterNameById.get(invite.inviterClerkId) ?? "Unknown user",
  }));
}

export async function listPendingInvitesForUser(
  inviteeClerkId: string,
  inviteeEmail?: string | null
): Promise<ProjectInviteInboxDTO[]> {
  await connectDB();
  const filters: Record<string, unknown>[] = [{ inviteeClerkId }];
  if (inviteeEmail) {
    filters.push({ inviteeEmail: normalizeEmail(inviteeEmail) });
  }

  const docs = await ProjectInvite.find({
    status: "pending",
    $or: filters,
  })
    .sort({ createdAt: -1 })
    .lean();

  const invites = docs
    .map((doc) => serializeInvite(doc))
    .filter(Boolean) as ProjectInviteDTO[];

  return enrichInvites(invites);
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

export async function attachInviteeClerkId(
  inviteId: string,
  inviteeClerkId: string
): Promise<void> {
  await connectDB();
  await ProjectInvite.findByIdAndUpdate(inviteId, {
    $set: { inviteeClerkId },
  });
}

export async function setClerkInvitationId(
  inviteId: string,
  clerkInvitationId: string
): Promise<void> {
  await connectDB();
  await ProjectInvite.findByIdAndUpdate(inviteId, {
    $set: { clerkInvitationId },
  });
}
