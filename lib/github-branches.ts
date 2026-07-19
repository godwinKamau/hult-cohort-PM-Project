export const ALL_BRANCHES = "*";

export function isAllBranches(branch?: string | null): boolean {
  const normalized = branch?.trim();
  return !normalized || normalized === ALL_BRANCHES;
}

export function branchLabel(branch?: string | null): string {
  return isAllBranches(branch) ? "All branches" : branch!.trim();
}
