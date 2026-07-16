import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationList } from "@clerk/nextjs";
import { TerminalPanel } from "@/components/states/TerminalPanel";

export default async function SelectOrgPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/");
  if (orgId) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 matrix-bg">
      <div className="max-w-lg w-full space-y-6">
        <TerminalPanel
          title="org.select"
          lines={[
            "> error: no_active_org",
            "> $ join_or_create_org",
            "> invite_members_via_email…",
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
  );
}
