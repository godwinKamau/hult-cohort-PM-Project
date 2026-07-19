import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUserFromClerk } from "@/lib/auth";
import { AppHeader } from "@/components/shell/AppHeader";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/");

  await syncUserFromClerk(userId);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader orgSlug="invites" />
      <main className="flex-1 pt-28 pb-8 px-4 container mx-auto">{children}</main>
    </div>
  );
}
