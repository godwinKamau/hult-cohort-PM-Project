import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationList } from "@clerk/nextjs";
import { Terminal } from "lucide-react";
import { syncUserFromClerk } from "@/lib/auth";
import { InboxDropdown } from "@/components/banner/InboxDropdown";
import { TerminalPanel } from "@/components/states/TerminalPanel";

export default async function SelectOrgPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/");
  if (orgId) redirect("/dashboard");

  await syncUserFromClerk(userId);

  return (
    <div className="min-h-screen flex flex-col matrix-bg">
      <header className="border-b border-primary/20 bg-black-deep/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-primary" />
            <span className="font-mono text-primary">root@pending_org</span>
          </div>
          <InboxDropdown />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full space-y-6">
          <TerminalPanel
            title="org.select"
            lines={[
              "> error: no_active_org",
              "> $ join_or_create_org",
              "> check_notifications_for_pending_invites",
            ]}
          />
          <div className="cyber-border bg-black-light/30 rounded p-6">
            <OrganizationList
              hidePersonal
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
