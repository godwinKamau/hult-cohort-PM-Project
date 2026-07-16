import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUserFromClerk } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Organization } from "@/models";
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
  try {
    await connectDB();
    const org = await Organization.findOne({ clerkOrgId: orgId }).lean();
    if (org?.slug) orgSlug = org.slug;
  } catch {
    // Mongo may be unavailable during cold start; shell still renders
  }

  return <AppShell orgSlug={orgSlug}>{children}</AppShell>;
}
