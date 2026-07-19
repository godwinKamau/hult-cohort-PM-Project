import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUserFromClerk } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Organization, User } from "@/models";
import type { PixelAvatarDTO } from "@/lib/types";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/");
  if (!orgId) redirect("/select-org");

  await syncUserFromClerk(userId);

  let orgSlug = "workspace";
  let myAvatar: PixelAvatarDTO | null = null;
  try {
    await connectDB();
    const org = await Organization.findOne({ clerkOrgId: orgId }).lean();
    if (org?.slug) orgSlug = org.slug;

    const user = await User.findOne({ clerkUserId: userId }).lean();
    if (user?.avatarGrid && user?.avatarColor) {
      myAvatar = { grid: user.avatarGrid, color: user.avatarColor };
    }
  } catch {
    // Mongo may be unavailable during cold start; shell still renders
  }

  return <AppShell orgSlug={orgSlug} myAvatar={myAvatar}>{children}</AppShell>;
}
