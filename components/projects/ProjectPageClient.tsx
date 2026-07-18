"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ProjectDTO,
  TicketDTO,
  TagDTO,
  NoteDTO,
  OrgMemberDTO,
  TicketStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { TicketListView } from "@/components/board/TicketListView";
import { TicketPeek } from "@/components/peek/TicketPeek";
import { ProjectSettings } from "@/components/peek/ProjectSettings";
import { createTicketAction } from "@/actions/tickets";
import { ForbiddenState } from "@/components/states/ForbiddenState";

interface ProjectPageClientProps {
  project: ProjectDTO | null;
  tickets: TicketDTO[];
  tags: TagDTO[];
  notes: NoteDTO[];
  members: OrgMemberDTO[];
  githubUsername?: string;
}

export function ProjectPageClient({
  project,
  tickets,
  tags,
  notes,
  members,
  githubUsername = "",
}: ProjectPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"board" | "list">("board");
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [creating, setCreating] = useState(false);

  if (!project) {
    return <ForbiddenState />;
  }

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (assigneeFilter !== "all" && t.assigneeClerkId !== assigneeFilter)
      return false;
    return true;
  });

  const handleTicketClick = (ticketId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ticket", ticketId);
    router.push(`/projects/${project.id}?${params.toString()}`, {
      scroll: false,
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    await createTicketAction({
      projectId: project.id,
      title: title.trim(),
      description: description.trim(),
      assigneeClerkId: assignee || undefined,
    });
    setTitle("");
    setDescription("");
    setAssignee("");
    setShowForm(false);
    setCreating(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-mono text-xl text-primary">{project.name}</h1>
          {project.description && (
            <p className="font-mono text-sm text-muted-foreground mt-1">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={view === "board" ? "default" : "outline"}
            onClick={() => setView("board")}
          >
            board
          </Button>
          <Button
            size="sm"
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
          >
            list
          </Button>
          <Button
            size="sm"
            variant={showSettings ? "default" : "outline"}
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? "close_settings()" : "settings()"}
          </Button>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "cancel()" : "new_ticket()"}
          </Button>
        </div>
      </div>

      {showSettings && (
        <ProjectSettings
          projectId={project.id}
          githubUsername={githubUsername}
          repoFullName={project.github.repoFullName}
          branch={project.github.branch}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as TicketStatus | "all")}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all_status</SelectItem>
            <SelectItem value="todo">todo</SelectItem>
            <SelectItem value="in_progress">in_progress</SelectItem>
            <SelectItem value="done">done</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">all_assignees</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.clerkUserId} value={m.clerkUserId}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="cyber-border bg-black-light/30 rounded p-4 space-y-3"
        >
          <div>
            <Label htmlFor="ticket-title">--title</Label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="ticket-desc">--description</Label>
            <Textarea
              id="ticket-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label>--assignee</Label>
            <Select value={assignee || "unassigned"} onValueChange={(v) => setAssignee(v === "unassigned" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.clerkUserId} value={m.clerkUserId}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={creating}>
            {creating ? "creating…" : "create_ticket()"}
          </Button>
        </form>
      )}

      {view === "board" ? (
        <KanbanBoard
          projectId={project.id}
          initialTickets={filteredTickets}
          tags={tags}
          members={members}
          onTicketClick={handleTicketClick}
        />
      ) : (
        <TicketListView
          tickets={filteredTickets}
          tags={tags}
          members={members}
          onTicketClick={handleTicketClick}
        />
      )}

      <TicketPeek
        tickets={tickets}
        tags={tags}
        notes={notes}
        members={members}
        project={project}
      />
    </div>
  );
}
