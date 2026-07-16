import { connectDB } from "@/lib/db";
import { serializeDoc } from "@/lib/serialize";
import type { ProjectDTO } from "@/lib/types";
import { Project } from "@/models";

export async function listProjects(
  orgId: string,
  includeArchived = false
): Promise<ProjectDTO[]> {
  await connectDB();
  const filter: Record<string, unknown> = { organizationId: orgId };
  if (!includeArchived) filter.archived = false;

  const docs = await Project.find(filter).sort({ updatedAt: -1 }).lean();
  return docs.map((d) => serializeDoc<ProjectDTO>(d)!);
}

export async function getProject(
  orgId: string,
  projectId: string
): Promise<ProjectDTO | null> {
  await connectDB();
  const doc = await Project.findOne({
    _id: projectId,
    organizationId: orgId,
  }).lean();
  return serializeDoc<ProjectDTO>(doc);
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
  });
  return serializeDoc<ProjectDTO>(doc.toObject())!;
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
  return serializeDoc<ProjectDTO>(doc);
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
  return serializeDoc<ProjectDTO>(doc);
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
  return serializeDoc<ProjectDTO>(doc);
}

export async function findProjectByRepo(
  repoFullName: string,
  branch?: string
): Promise<ProjectDTO | null> {
  await connectDB();
  const filter: Record<string, unknown> = {
    "github.repoFullName": repoFullName,
    archived: false,
  };
  if (branch) {
    filter["github.branch"] = branch;
  }
  const doc = await Project.findOne(filter).lean();
  if (!doc && branch) {
    const fallback = await Project.findOne({
      "github.repoFullName": repoFullName,
      archived: false,
    }).lean();
    return serializeDoc<ProjectDTO>(fallback);
  }
  return serializeDoc<ProjectDTO>(doc);
}
