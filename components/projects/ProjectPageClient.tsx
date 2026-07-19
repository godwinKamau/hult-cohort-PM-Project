"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ProjectDTO,
  TicketDTO,
  TagDTO,
  NoteDTO,
  OrgMemberDTO,
  ProjectInviteDTO,
  TicketStatus,
} from "@/lib/types";
import { ticketMatchesQuery } from "@/lib/fuzzySearch";
import { TICKET_STATUSES } from "@/lib/ticketStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { TicketListView } from "@/components/board/TicketListView";
import { TicketPeek } from "@/components/peek/TicketPeek";
import { ProjectSettings } from "@/components/peek/ProjectSettings";
import {
  changeTicketStatusAction,
  createTicketAction,
} from "@/actions/tickets";
import { ForbiddenState } from "@/components/states/ForbiddenState";
import { useTerminalToast } from "@/components/ui/terminal-toast";
import { useSetHeaderProjectName } from "@/components/shell/HeaderPathContext";

interface ProjectPageClientProps {
  project: ProjectDTO | null;
  tickets: TicketDTO[];
  tags: TagDTO[];
  notes: NoteDTO[];
  members: OrgMemberDTO[];
  pendingInvites: ProjectInviteDTO[];
  currentUserId: string;
  githubUsername?: string;
}

function parseView(value: string | null): "board" | "list" {
  return value === "list" ? "list" : "board";
}

function parseStatusFilter(value: string | null): TicketStatus | "all" {
  if (!value || value === "all") return "all";
  return TICKET_STATUSES.includes(value as TicketStatus)
    ? (value as TicketStatus)
    : "all";
}

function parseAssigneeFilter(
  value: string | null,
  members: OrgMemberDTO[]
): string {
  if (!value || value === "all") return "all";
  return members.some((member) => member.clerkUserId === value) ? value : "all";
}

function applyBoardParams(
  params: URLSearchParams,
  updates: {
    view?: "board" | "list";
    q?: string;
    status?: TicketStatus | "all";
    assignee?: string;
  }
) {
  if ("view" in updates) {
    if (updates.view === "list") {
      params.set("view", "list");
    } else {
      params.delete("view");
    }
  }

  if ("q" in updates) {
    const query = updates.q?.trim() ?? "";
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
  }

  if ("status" in updates) {
    if (updates.status && updates.status !== "all") {
      params.set("status", updates.status);
    } else {
      params.delete("status");
    }
  }

  if ("assignee" in updates) {
    if (updates.assignee && updates.assignee !== "all") {
      params.set("assignee", updates.assignee);
    } else {
      params.delete("assignee");
    }
  }
}

export function ProjectPageClient({
  project,
  tickets,
  tags,
  notes,
  members,
  pendingInvites,
  currentUserId,
  githubUsername = "",
}: ProjectPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useTerminalToast();
  useSetHeaderProjectName(project?.name);
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);
  const [settingsRequested, setSettingsRequested] = useState(false);

  const view = parseView(searchParams.get("view"));
  const statusFilter = parseStatusFilter(searchParams.get("status"));
  const assigneeFilter = parseAssigneeFilter(
    searchParams.get("assignee"),
    members
  );

  // Search text is kept in local state so typing is never blocked by the
  // async URL/DB round-trip; the URL (and therefore filtering + the
  // shareable link) is synced via a debounce once typing pauses.
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("q") ?? ""
  );
  const lastPushedQRef = useRef(searchParams.get("q") ?? "");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const searchQuery = searchInput;

  // Sync local input from the URL when "q" changes for a reason other than
  // our own debounced push (e.g. browser back/forward, clear_filters).
  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";
    if (urlQ !== lastPushedQRef.current) {
      lastPushedQRef.current = urlQ;
      setSearchInput(urlQ);
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const ticketId = searchParams.get("ticket");
  const isPeekOpen = Boolean(ticketId);
  const showSettings = settingsRequested && !isPeekOpen;

  const memberNameById = useMemo(
    () => new Map(members.map((member) => [member.clerkUserId, member.name])),
    [members]
  );

  const tagNameById = useMemo(
    () => new Map(tags.map((tag) => [tag.id, tag.name])),
    [tags]
  );

  const notesCountByTicketId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      counts.set(note.ticketId, (counts.get(note.ticketId) ?? 0) + 1);
    }
    return counts;
  }, [notes]);

  const replaceProjectUrl = useCallback(
    (params: URLSearchParams) => {
      if (!project) return;
      const qs = params.toString();
      router.replace(`/projects/${project.id}${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [project, router]
  );

  const pushProjectUrl = useCallback(
    (params: URLSearchParams) => {
      if (!project) return;
      const qs = params.toString();
      router.push(`/projects/${project.id}${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [project, router]
  );

  const updateBoardParams = useCallback(
    (updates: {
      view?: "board" | "list";
      q?: string;
      status?: TicketStatus | "all";
      assignee?: string;
    }) => {
      const params = new URLSearchParams(searchParams.toString());
      applyBoardParams(params, updates);
      replaceProjectUrl(params);
    },
    [replaceProjectUrl, searchParams]
  );

  const handleSearchInputChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        lastPushedQRef.current = value.trim();
        updateBoardParams({ q: value });
      }, 350);
    },
    [updateBoardParams]
  );

  const clearFilters = useCallback(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    lastPushedQRef.current = "";
    setSearchInput("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("status");
    params.delete("assignee");
    replaceProjectUrl(params);
  }, [replaceProjectUrl, searchParams]);

  if (!project) {
    return <ForbiddenState />;
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (
      assigneeFilter !== "all" &&
      ticket.assigneeClerkId !== assigneeFilter
    ) {
      return false;
    }

    const assigneeName = ticket.assigneeClerkId
      ? memberNameById.get(ticket.assigneeClerkId) ?? ""
      : "";
    const tagNames = ticket.tagIds
      .map((tagId) => tagNameById.get(tagId) ?? "")
      .filter(Boolean);

    return ticketMatchesQuery(searchQuery, [
      String(ticket.number),
      ticket.title,
      ticket.description,
      ticket.status.replace("_", " "),
      assigneeName,
      tagNames.join(" "),
    ]);
  });

  const hiddenCount = tickets.length - filteredTickets.length;
  const hasActiveFilters =
    statusFilter !== "all" ||
    assigneeFilter !== "all" ||
    searchQuery.trim().length > 0;

  const handleTicketClick = (nextTicketId: string) => {
    setSettingsRequested(false);
    const params = new URLSearchParams(searchParams.toString());
    params.set("ticket", nextTicketId);
    pushProjectUrl(params);
  };

  const handleCreate = async (status: TicketStatus, title: string) => {
    const result = await createTicketAction({
      projectId: project.id,
      title,
      status,
    });

    if (result.success) {
      router.refresh();
    }

    return result.success;
  };

  const handleStatusChange = async (
    nextTicketId: string,
    status: TicketStatus
  ) => {
    setStatusChangingId(nextTicketId);
    const result = await changeTicketStatusAction(
      nextTicketId,
      project.id,
      status
    );
    setStatusChangingId(null);

    if (result.success) {
      router.refresh();
      return true;
    }

    showToast("move_failed: reverting", "error");
    return false;
  };

  const openSettings = () => {
    if (showSettings) {
      setSettingsRequested(false);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("ticket");
    pushProjectUrl(params);
    setSettingsRequested(true);
  };

  const handleSettingsOpenChange = (open: boolean) => {
    setSettingsRequested(open);
    if (!open) return;

    const params = new URLSearchParams(searchParams.toString());
    if (params.has("ticket")) {
      params.delete("ticket");
      pushProjectUrl(params);
    }
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
            variant={showSettings ? "default" : "outline"}
            onClick={openSettings}
          >
            {showSettings ? "close_settings()" : "settings()"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="min-w-[180px] flex-1">
          <Label htmlFor="ticket-search" className="sr-only">
            Search tickets
          </Label>
          <Input
            id="ticket-search"
            value={searchInput}
            onChange={(event) => handleSearchInputChange(event.target.value)}
            placeholder="fuzzy_search_tickets…"
            className="h-8"
          />
        </div>

        <div className="flex gap-2">
          <Label htmlFor="status-filter" className="sr-only">
            Filter by status
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              updateBoardParams({
                status: value as TicketStatus | "all",
              })
            }
          >
            <SelectTrigger id="status-filter" className="h-8 w-[118px] px-2">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all_status</SelectItem>
              <SelectItem value="todo">todo</SelectItem>
              <SelectItem value="in_progress">in_progress</SelectItem>
              <SelectItem value="done">done</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor="assignee-filter" className="sr-only">
            Filter by assignee
          </Label>
          <Select
            value={assigneeFilter}
            onValueChange={(value) => updateBoardParams({ assignee: value })}
          >
            <SelectTrigger id="assignee-filter" className="h-8 w-[142px] px-2">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all_assignees</SelectItem>
              {members.map((member) => (
                <SelectItem key={member.clerkUserId} value={member.clerkUserId}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <fieldset className="flex shrink-0 gap-1 rounded border border-primary/30 bg-primary/10 p-0.5 sm:ml-auto">
          <legend className="sr-only">Display options</legend>
          <Button
            size="sm"
            variant={view === "board" ? "default" : "ghost"}
            aria-pressed={view === "board"}
            onClick={() => updateBoardParams({ view: "board" })}
          >
            board
          </Button>
          <Button
            size="sm"
            variant={view === "list" ? "default" : "ghost"}
            aria-pressed={view === "list"}
            onClick={() => updateBoardParams({ view: "list" })}
          >
            list
          </Button>
        </fieldset>
      </div>

      {hiddenCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>
            {hiddenCount} ticket{hiddenCount === 1 ? "" : "s"} hidden by filters
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 font-mono text-xs"
            onClick={clearFilters}
          >
            clear_filters()
          </Button>
        </div>
      )}

      {view === "board" ? (
        <KanbanBoard
          projectId={project.id}
          initialTickets={filteredTickets}
          tags={tags}
          members={members}
          notesCountByTicketId={notesCountByTicketId}
          filtersActive={hasActiveFilters}
          onTicketClick={handleTicketClick}
          onCreateTicket={handleCreate}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <TicketListView
          tickets={filteredTickets}
          tags={tags}
          members={members}
          notesCountByTicketId={notesCountByTicketId}
          filtersActive={hasActiveFilters}
          onTicketClick={handleTicketClick}
          onCreateTicket={handleCreate}
          onStatusChange={handleStatusChange}
          statusChangingId={statusChangingId}
        />
      )}

      <TicketPeek
        tickets={tickets}
        tags={tags}
        notes={notes}
        members={members}
        project={project}
      />

      <Sheet open={showSettings} onOpenChange={handleSettingsOpenChange}>
        <SheetContent side="right" className="overflow-y-auto text-foreground">
          <SheetHeader>
            <SheetTitle>settings()</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ProjectSettings
              projectId={project.id}
              projectName={project.name}
              githubUsername={githubUsername}
              repoFullName={project.github.repoFullName}
              branch={project.github.branch}
              members={members}
              projectMembers={project.members}
              projectCreatorId={project.createdBy}
              pendingInvites={pendingInvites}
              currentUserId={currentUserId}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
