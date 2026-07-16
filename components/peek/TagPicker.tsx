"use client";

import { useState } from "react";
import type { TagDTO } from "@/lib/types";
import { TAG_COLORS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagBadge } from "@/components/board/TagBadge";
import { createTagAction } from "@/actions/tags";

interface TagPickerProps {
  tags: TagDTO[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ tags, selectedTagIds, onChange }: TagPickerProps) {
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState<string>(TAG_COLORS[0]);
  const [localTags, setLocalTags] = useState(tags);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const result = await createTagAction({
      name: newTagName.trim(),
      color: newTagColor,
    });
    if (result.success && result.tag) {
      setLocalTags((prev) => [...prev, result.tag!]);
      onChange([...selectedTagIds, result.tag.id]);
      setNewTagName("");
    }
  };

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-muted-foreground">--tags</p>
      <div className="flex flex-wrap gap-2">
        {localTags.map((tag) => (
          <button key={tag.id} onClick={() => toggleTag(tag.id)}>
            <TagBadge
              tag={tag}
              className={
                selectedTagIds.includes(tag.id)
                  ? "ring-1 ring-primary"
                  : "opacity-50"
              }
            />
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="new_tag"
          className="flex-1"
        />
        <div className="flex gap-1">
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setNewTagColor(color)}
              className="w-5 h-5 rounded border border-primary/30"
              style={{
                backgroundColor: color,
                outline: newTagColor === color ? "2px solid #00ff41" : "none",
              }}
            />
          ))}
        </div>
        <Button size="sm" onClick={handleCreateTag}>
          add
        </Button>
      </div>
    </div>
  );
}
