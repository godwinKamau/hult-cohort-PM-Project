export const LEGACY_DEFAULT_TAG_NAMES = new Set(["bug", "bugs"]);

export function isLegacyDefaultTag(name: string): boolean {
  return LEGACY_DEFAULT_TAG_NAMES.has(name.trim().toLowerCase());
}
