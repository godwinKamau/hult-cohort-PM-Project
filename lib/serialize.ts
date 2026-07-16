import type { Document, Types } from "mongoose";

export function toId(value: Types.ObjectId | string | undefined): string {
  if (!value) return "";
  return typeof value === "string" ? value : value.toString();
}

export function toISO(value: Date | string | undefined): string {
  if (!value) return new Date().toISOString();
  return typeof value === "string" ? value : value.toISOString();
}

export function serializeDoc<T>(
  doc: Document | Record<string, unknown> | null
): T | null {
  if (!doc) return null;
  const obj = "toObject" in doc && typeof doc.toObject === "function"
    ? doc.toObject()
    : { ...doc };

  const serialized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "_id") {
      serialized.id = toId(value as Types.ObjectId);
      continue;
    }
    if (key === "__v") continue;
    if (value instanceof Date) {
      serialized[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      serialized[key] = value.map((item) =>
        item && typeof item === "object" && "_bsontype" in item
          ? toId(item as Types.ObjectId)
          : item instanceof Date
            ? item.toISOString()
            : item
      );
    } else if (value && typeof value === "object" && "_bsontype" in value) {
      serialized[key] = toId(value as Types.ObjectId);
    } else {
      serialized[key] = value;
    }
  }
  return serialized as T;
}
