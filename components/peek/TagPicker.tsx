"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import type { TagDTO } from "@/lib/types";
import { TAG_COLORS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagBadge } from "@/components/board/TagBadge";
import { createTagAction, deleteTagAction } from "@/actions/tags";
import { cn } from "@/lib/cn";

interface TagPickerProps {
  tags: TagDTO[];
  selectedTagIds: string[];
  projectId: string;
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({
  tags,
  selectedTagIds,
  projectId,
  onChange,
}: TagPickerProps) {
  const router = useRouter();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[0]);
  const [localTags, setLocalTags] = useState(tags);
  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  useEffect(() => {
    setLocalTags(tags);
  }, [tags]);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const closeCreate = () => {
    setShowCreate(false);
    setNewTagName("");
    setNewTagColor(TAG_COLORS[0]);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || isCreating) return;

    setIsCreating(true);
    const result = await createTagAction({
      name: newTagName.trim(),
      color: newTagColor,
    });
    setIsCreating(false);

    if (result.success && result.tag) {
      setLocalTags((prev) => [...prev, result.tag!]);
      onChange([...selectedTagIds, result.tag.id]);
      closeCreate();
    }
  };

  const handleDeleteTag = async (tag: TagDTO) => {
    if (deletingTagId) return;

    setDeletingTagId(tag.id);
    const result = await deleteTagAction(tag.id, projectId);
    setDeletingTagId(null);

    if (result.success) {
      setLocalTags((prev) => prev.filter((item) => item.id !== tag.id));
      onChange(selectedTagIds.filter((id) => id !== tag.id));
      router.refresh();
    }
  };

  return (
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2">
      <Label className="w-24 shrink-0 pt-1.5">--tags</Label>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {localTags.map((tag) => (
          <span key={tag.id} className="group/tag inline-flex items-center">
            <button type="button" onClick={() => toggleTag(tag.id)}>
              <TagBadge
                tag={tag}
                className={
                  selectedTagIds.includes(tag.id)
                    ? "ring-1 ring-primary"
                    : "opacity-50"
                }
              />
            </button>
            <button
              type="button"
              aria-label={`Delete tag ${tag.name}`}
              disabled={deletingTagId === tag.id}
              onClick={() => void handleDeleteTag(tag)}
              className={cn(
                "ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded",
                "text-muted-foreground opacity-0 transition-opacity hover:text-destructive",
                "group-hover/tag:opacity-100 focus-visible:opacity-100"
              )}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}
        {localTags.length === 0 && (
          <span className="font-mono text-xs text-muted-foreground">none</span>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={showCreate}
          className="h-7 shrink-0 px-2 font-mono text-[10px]"
          onClick={() => setShowCreate((open) => !open)}
        >
          {showCreate ? "cancel" : "new_tag()"}
        </Button>
      </div>

      {showCreate && (
        <>
          <span className="sr-only">Create tag</span>
          <div className="col-start-2 flex min-w-0 flex-wrap items-center gap-2">
            <Input
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleCreateTag();
                }
                if (event.key === "Escape") closeCreate();
              }}
              placeholder="Tag name"
              aria-label="New tag name"
              className="h-8 min-w-[120px] flex-1"
              autoFocus
              disabled={isCreating}
            />
            <div className="flex shrink-0 gap-1" role="group" aria-label="Tag color">
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Color ${color}`}
                  aria-pressed={newTagColor === color}
                  onClick={() => setNewTagColor(color)}
                  className={cn(
                    "h-5 w-5 rounded border border-primary/30",
                    newTagColor === color && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button
              size="sm"
              className="h-8 shrink-0"
              disabled={!newTagName.trim() || isCreating}
              onClick={() => void handleCreateTag()}
            >
              {isCreating ? "adding…" : "add"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
