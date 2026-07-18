import { Suspense } from "react";
import { requireOrg, getOrgMembers, getUserGithubUsername } from "@/lib/auth";
import * as projectRepo from "@/repositories/projects";
import * as ticketRepo from "@/repositories/tickets";
import * as tagRepo from "@/repositories/tags";
import * as noteRepo from "@/repositories/notes";
import { ProjectPageClient } from "@/components/projects/ProjectPageClient";
import { LoadingLine } from "@/components/states/LoadingLine";

interface ProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const { orgId, userId } = await requireOrg();

  const [project, tickets, tags, members, githubUsername] = await Promise.all([
    projectRepo.getProject(orgId, projectId),
    ticketRepo.listTickets(orgId, projectId),
    tagRepo.listTags(orgId),
    getOrgMembers(orgId),
    getUserGithubUsername(userId),
  ]);

  const notes = await Promise.all(
    tickets.map((t) => noteRepo.listNotes(orgId, t.id))
  ).then((arrays) => arrays.flat());

  return (
    <Suspense fallback={<LoadingLine message="$ loading_project…" />}>
      <ProjectPageClient
        project={project}
        tickets={tickets}
        tags={tags}
        notes={notes}
        members={members}
        githubUsername={githubUsername ?? ""}
      />
    </Suspense>
  );
}
