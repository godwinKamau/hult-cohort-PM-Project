import { connectDB } from "@/lib/db";
import { isLegacyDefaultTag } from "@/lib/tagDefaults";
import { serializeDoc } from "@/lib/serialize";
import type { TagDTO } from "@/lib/types";
import { Tag, Ticket } from "@/models";

export async function listTags(orgId: string): Promise<TagDTO[]> {
  await connectDB();
  const docs = await Tag.find({ organizationId: orgId })
    .sort({ name: 1 })
    .lean();

  const legacyIds = docs
    .filter((doc) => isLegacyDefaultTag(String(doc.name)))
    .map((doc) => doc._id);

  if (legacyIds.length > 0) {
    await Tag.deleteMany({ _id: { $in: legacyIds } });
    await Ticket.updateMany(
      { organizationId: orgId },
      { $pull: { tagIds: { $in: legacyIds } } }
    );
  }

  return docs
    .filter((doc) => !isLegacyDefaultTag(String(doc.name)))
    .map((d) => serializeDoc<TagDTO>(d)!);
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

export async function deleteTag(
  orgId: string,
  tagId: string
): Promise<boolean> {
  await connectDB();
  const result = await Tag.findOneAndDelete({
    _id: tagId,
    organizationId: orgId,
  });

  if (!result) {
    return false;
  }

  await Ticket.updateMany(
    { organizationId: orgId, tagIds: tagId },
    { $pull: { tagIds: tagId } }
  );

  return true;
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
