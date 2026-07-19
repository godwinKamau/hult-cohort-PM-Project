import { TAG_COLORS } from "@/lib/types";

export const AVATAR_GRID_SIZE = 13;
export const AVATAR_CELLS = AVATAR_GRID_SIZE * AVATAR_GRID_SIZE;

const GRID_PATTERN = /^[01]{169}$/;

export function emptyGrid(): string {
  return "0".repeat(AVATAR_CELLS);
}

export function isValidAvatarGrid(grid: string): boolean {
  return GRID_PATTERN.test(grid);
}

export function isValidAvatarColor(color: string): boolean {
  return (TAG_COLORS as readonly string[]).includes(color);
}

export function gridHasPixels(grid: string): boolean {
  return grid.includes("1");
}
