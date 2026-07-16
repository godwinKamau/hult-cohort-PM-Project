import { requireOrg } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import * as projectRepo from "@/repositories/projects";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const { userId, orgId } = await requireOrg();
  const projects = await projectRepo.listProjects(orgId);

  await connectDB();
  const user = await User.findOne({ clerkUserId: userId }).lean();

  return (
    <DashboardClient
      projects={projects}
      githubUsername={user?.githubUsername ?? ""}
    />
  );
}
