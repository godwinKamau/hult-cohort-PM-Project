import { connectDB } from "@/lib/db";
import { serializeDoc } from "@/lib/serialize";
import type { TagDTO } from "@/lib/types";
import { Tag } from "@/models";

export async function listTags(orgId: string): Promise<TagDTO[]> {
  await connectDB();
  const docs = await Tag.find({ organizationId: orgId })
    .sort({ name: 1 })
    .lean();
  return docs.map((d) => serializeDoc<TagDTO>(d)!);
}

export async function createTag(
  orgId: string,
  data: { name: string; color: string }
): Promise<TagDTO> {
  await connectDB();
  const doc = await Tag.create({
    organizationId: orgId,
    name: data.name,
    color: data.color,
  });
  return serializeDoc<TagDTO>(doc.toObject())!;
}

export async function getTagsByIds(
  orgId: string,
  tagIds: string[]
): Promise<TagDTO[]> {
  await connectDB();
  const docs = await Tag.find({
    organizationId: orgId,
    _id: { $in: tagIds },
  }).lean();
  return docs.map((d) => serializeDoc<TagDTO>(d)!);
}
