import { ALL_BRANCHES } from "@/lib/github";
import { connectDB } from "@/lib/db";
import { serializeDoc } from "@/lib/serialize";
import type { ProjectDTO } from "@/lib/types";
import { DEFAULT_PROJECT_THEME_COLOR } from "@/lib/project-theme";
import {
  Note,
  Notification,
  Project,
  ProjectInvite,
  Ticket,
} from "@/models";

function serializeProject(
  doc: Parameters<typeof serializeDoc>[0]
): ProjectDTO | null {
  const project = serializeDoc<ProjectDTO>(doc);
  if (!project) return null;
  if (!project.github || typeof project.github !== "object") {
    project.github = {};
  }
  if (!Array.isArray(project.members)) {
    project.members = [];
  }
  if (!project.themeColor) {
    project.themeColor = DEFAULT_PROJECT_THEME_COLOR;
  }
  return project;
}

function membershipFilter(userId: string) {
  return {
    $or: [{ createdBy: userId }, { members: userId }],
  };
}

export async function listProjects(
  orgId: string,
  userId: string,
  includeArchived = false
): Promise<ProjectDTO[]> {
  await connectDB();
  const filter: Record<string, unknown> = {
    organizationId: orgId,
    ...membershipFilter(userId),
  };
  if (!includeArchived) filter.archived = false;

  const docs = await Project.find(filter).sort({ updatedAt: -1 }).lean();
  return docs.map((d) => serializeProject(d)!);
}

export async function listOrgProjects(
  orgId: string,
  includeArchived = false
): Promise<ProjectDTO[]> {
  await connectDB();
  const filter: Record<string, unknown> = { organizationId: orgId };
  if (!includeArchived) filter.archived = false;

  const docs = await Project.find(filter).sort({ updatedAt: -1 }).lean();
  return docs.map((d) => serializeProject(d)!);
}

export async function getProject(
  orgId: string,
  projectId: string,
  userId: string
): Promise<ProjectDTO | null> {
  await connectDB();
  const doc = await Project.findOne({
    _id: projectId,
    organizationId: orgId,
    ...membershipFilter(userId),
  }).lean();
  return serializeProject(doc);
}

export async function createProject(
  orgId: string,
  userId: string,
  data: { name: string; description?: string }
): Promise<ProjectDTO> {
  await connectDB();
  const doc = await Project.create({
    organizationId: orgId,
    name: data.name,
    description: data.description ?? "",
    createdBy: userId,
    members: [userId],
  });
  return serializeProject(doc.toObject())!;
}

export async function updateProject(
  orgId: string,
  projectId: string,
  data: { name?: string; description?: string }
): Promise<ProjectDTO | null> {
  await connectDB();
  const doc = await Project.findOneAndUpdate(
    { _id: projectId, organizationId: orgId },
    { $set: data },
    { returnDocument: "after" }
  ).lean();
  return serializeProject(doc);
}

export async function archiveProject(
  orgId: string,
  projectId: string
): Promise<ProjectDTO | null> {
  await connectDB();
  const doc = await Project.findOneAndUpdate(
    { _id: projectId, organizationId: orgId },
    { $set: { archived: true } },
    { returnDocument: "after" }
  ).lean();
  return serializeProject(doc);
}

export async function setProjectGithub(
  orgId: string,
  projectId: string,
  github: { repoFullName?: string; branch?: string }
): Promise<ProjectDTO | null> {
  await connectDB();
  const doc = await Project.findOneAndUpdate(
    { _id: projectId, organizationId: orgId },
    {
      $set: {
        "github.repoFullName": github.repoFullName ?? "",
        "github.branch": github.branch ?? "",
        "github.webhookConfiguredAt": new Date(),
      },
    },
    { returnDocument: "after" }
  ).lean();
  return serializeProject(doc);
}

export async function setProjectThemeColor(
  orgId: string,
  projectId: string,
  themeColor: string
): Promise<ProjectDTO | null> {
  await connectDB();
  const doc = await Project.findOneAndUpdate(
    { _id: projectId, organizationId: orgId },
    { $set: { themeColor } },
    { returnDocument: "after" }
  ).lean();
  return serializeProject(doc);
}

export async function addProjectMember(
  orgId: string,
  projectId: string,
  clerkUserId: string
): Promise<ProjectDTO | null> {
  await connectDB();
  const doc = await Project.findOneAndUpdate(
    { _id: projectId, organizationId: orgId },
    { $addToSet: { members: clerkUserId } },
    { returnDocument: "after" }
  ).lean();
  return serializeProject(doc);
}

export async function deleteProject(
  orgId: string,
  projectId: string,
  userId: string
): Promise<boolean> {
  await connectDB();

  const project = await Project.findOne({
    _id: projectId,
    organizationId: orgId,
    createdBy: userId,
  }).lean();

  if (!project) {
    return false;
  }

  const ticketIds = await Ticket.find({
    organizationId: orgId,
    projectId,
  }).distinct("_id");

  const deletions: Promise<unknown>[] = [
    Ticket.deleteMany({ organizationId: orgId, projectId }),
    ProjectInvite.deleteMany({ organizationId: orgId, projectId }),
    Notification.deleteMany({ organizationId: orgId, projectId }),
    Project.findOneAndDelete({ _id: projectId, organizationId: orgId }),
  ];

  if (ticketIds.length > 0) {
    deletions.unshift(
      Note.deleteMany({
        organizationId: orgId,
        ticketId: { $in: ticketIds },
      })
    );
  }

  await Promise.all(deletions);
  return true;
}

export async function findProjectByRepo(
  repoFullName: string,
  eventBranch?: string
): Promise<ProjectDTO | null> {
  await connectDB();
  const baseFilter = {
    "github.repoFullName": repoFullName,
    archived: false,
  };

  if (!eventBranch) {
    const doc = await Project.findOne(baseFilter).lean();
    return serializeProject(doc);
  }

  const exactMatch = await Project.findOne({
    ...baseFilter,
    "github.branch": eventBranch,
  }).lean();
  if (exactMatch) {
    return serializeProject(exactMatch);
  }

  const allBranchesMatch = await Project.findOne({
    ...baseFilter,
    "github.branch": ALL_BRANCHES,
  }).lean();
  return serializeProject(allBranchesMatch);
}
