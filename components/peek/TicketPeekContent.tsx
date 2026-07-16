"use client";

import { useState } from "react";
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
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type {
  TicketDTO,
  TagDTO,
  NoteDTO,
  OrgMemberDTO,
  ProjectDTO,
} from "@/lib/types";
import { updateTicketAction } from "@/actions/tickets";
import { TagPicker } from "./TagPicker";
import { NotesThread } from "./NotesThread";
import { ProjectSettings } from "./ProjectSettings";

interface TicketPeekContentProps {
  ticket: TicketDTO;
  tags: TagDTO[];
  notes: NoteDTO[];
  members: OrgMemberDTO[];
  project: ProjectDTO;
}

export function TicketPeekContent({
  ticket,
  tags,
  notes,
  members,
  project,
}: TicketPeekContentProps) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description);
  const [assignee, setAssignee] = useState(ticket.assigneeClerkId ?? "");
  const [selectedTags, setSelectedTags] = useState(ticket.tagIds);

  const saveField = async (data: Parameters<typeof updateTicketAction>[2]) => {
    await updateTicketAction(ticket.id, project.id, data);
  };

  const handleTitleBlur = () => {
    if (title !== ticket.title) {
      saveField({ title });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== ticket.description) {
      saveField({ description });
    }
  };

  const handleAssigneeChange = (value: string) => {
    setAssignee(value);
    saveField({ assigneeClerkId: value === "unassigned" ? null : value });
  };

  const handleTagsChange = (tagIds: string[]) => {
    setSelectedTags(tagIds);
    saveField({ tagIds });
  };

  const ticketNotes = notes.filter((n) => n.ticketId === ticket.id);

  return (
    <>
      <SheetHeader>
        <SheetTitle>ticket.peek()</SheetTitle>
        <SheetDescription>
          #{ticket.id.slice(-6)} · {ticket.status}
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-4 mt-4">
        <div>
          <Label htmlFor="title">--title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
          />
        </div>
        <div>
          <Label htmlFor="description">--description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            className="min-h-[100px]"
          />
        </div>
        <div>
          <Label>--assignee</Label>
          <Select
            value={assignee || "unassigned"}
            onValueChange={handleAssigneeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Unassigned" />
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
        <TagPicker
          tags={tags}
          selectedTagIds={selectedTags}
          onChange={handleTagsChange}
        />
        <NotesThread
          notes={ticketNotes}
          members={members}
          ticketId={ticket.id}
          projectId={project.id}
        />
        <ProjectSettings
          projectId={project.id}
          repoFullName={project.github.repoFullName}
          branch={project.github.branch}
        />
      </div>
    </>
  );
}
