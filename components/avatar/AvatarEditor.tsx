"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAvatarAction, saveAvatarAction } from "@/actions/avatar";
import {
  AVATAR_CELLS,
  AVATAR_GRID_SIZE,
  emptyGrid,
} from "@/lib/avatar";
import { TAG_COLORS, type PixelAvatarDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { useTerminalToast } from "@/components/ui/terminal-toast";
import { PixelAvatar } from "./PixelAvatar";
import { cn } from "@/lib/cn";

interface AvatarEditorProps {
  initialAvatar: PixelAvatarDTO | null;
}

interface EditorSnapshot {
  grid: string;
  color: string;
}

export function AvatarEditor({ initialAvatar }: AvatarEditorProps) {
  const router = useRouter();
  const { showToast } = useTerminalToast();
  const [grid, setGrid] = useState(initialAvatar?.grid ?? emptyGrid());
  const [color, setColor] = useState(
    initialAvatar?.color ?? TAG_COLORS[0]
  );
  const [history, setHistory] = useState<EditorSnapshot[]>([]);
  const [saving, setSaving] = useState(false);
  const paintModeRef = useRef<"on" | "off" | null>(null);
  const isPaintingRef = useRef(false);
  const strokeStartRef = useRef<EditorSnapshot | null>(null);
  const gridRef = useRef(grid);

  gridRef.current = grid;

  const pushHistory = useCallback((snapshot: EditorSnapshot) => {
    setHistory((current) => [...current, snapshot]);
  }, []);

  const setCell = useCallback((index: number, on: boolean) => {
    setGrid((current) => {
      const chars = current.split("");
      chars[index] = on ? "1" : "0";
      return chars.join("");
    });
  }, []);

  const handleCellPointerDown = (index: number) => {
    strokeStartRef.current = { grid, color };
    const turningOn = grid[index] !== "1";
    paintModeRef.current = turningOn ? "on" : "off";
    isPaintingRef.current = true;
    setCell(index, turningOn);
  };

  const handleCellPointerEnter = (index: number) => {
    if (!isPaintingRef.current || !paintModeRef.current) return;
    setCell(index, paintModeRef.current === "on");
  };

  const handlePointerUp = () => {
    if (isPaintingRef.current && strokeStartRef.current) {
      const start = strokeStartRef.current;
      if (gridRef.current !== start.grid) {
        pushHistory(start);
      }
    }

    isPaintingRef.current = false;
    paintModeRef.current = null;
    strokeStartRef.current = null;
  };

  const handleColorChange = (tagColor: string) => {
    if (tagColor === color) return;
    pushHistory({ grid, color });
    setColor(tagColor);
  };

  const handleUndo = () => {
    setHistory((current) => {
      if (current.length === 0) return current;
      const next = [...current];
      const previous = next.pop()!;
      setGrid(previous.grid);
      setColor(previous.color);
      return next;
    });
  };

  const handleClear = () => {
    if (grid === emptyGrid()) return;
    pushHistory({ grid, color });
    setGrid(emptyGrid());
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await saveAvatarAction(grid, color);
    setSaving(false);

    if (result.success) {
      showToast("avatar saved", "success");
      router.refresh();
    } else {
      showToast(result.error ?? "save failed", "error");
    }
  };

  const handleClearSaved = async () => {
    setSaving(true);
    const result = await clearAvatarAction();
    setSaving(false);

    if (result.success) {
      setGrid(emptyGrid());
      showToast("avatar cleared", "success");
      router.refresh();
    } else {
      showToast(result.error ?? "clear failed", "error");
    }
  };

  return (
    <div
      className="max-w-lg space-y-6"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div>
        <h1 className="font-mono text-xl text-primary mb-1">pixel_avatar</h1>
        <p className="font-mono text-xs text-muted-foreground">
          &gt; draw your 13x13 stamp — used when you like pushes
        </p>
      </div>

      <div className="space-y-2">
        <span className="font-mono text-xs text-muted-foreground">
          accent_color
        </span>
        <div className="flex gap-2">
          {TAG_COLORS.map((tagColor) => (
            <button
              key={tagColor}
              type="button"
              aria-label={`Select color ${tagColor}`}
              onClick={() => handleColorChange(tagColor)}
              className={cn(
                "w-8 h-8 rounded border-2 transition-all",
                color === tagColor
                  ? "border-primary scale-110"
                  : "border-primary/20 hover:border-primary/50"
              )}
              style={{ backgroundColor: tagColor }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="font-mono text-xs text-muted-foreground">grid</span>
        <div
          className="inline-grid gap-px p-2 bg-black-light border border-primary/20 rounded select-none touch-none"
          style={{
            gridTemplateColumns: `repeat(${AVATAR_GRID_SIZE}, 1fr)`,
          }}
        >
          {Array.from({ length: AVATAR_CELLS }, (_, index) => {
            const on = grid[index] === "1";
            return (
              <button
                key={index}
                type="button"
                aria-label={`Pixel ${index + 1}`}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleCellPointerDown(index);
                }}
                onPointerEnter={() => handleCellPointerEnter(index)}
                className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 border border-primary/10 transition-colors",
                  on ? "" : "bg-black-deep hover:bg-primary/10"
                )}
                style={on ? { backgroundColor: color } : undefined}
              />
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <span className="font-mono text-xs text-muted-foreground">preview</span>
        <div className="flex items-center gap-6">
          <div className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border border-primary/20">
            <PixelAvatar grid={grid} color={color} size={16} />
            <span className="text-muted-foreground">like_btn</span>
          </div>
          <PixelAvatar grid={grid} color={color} size={48} />
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto min-w-[140px] cyber-border"
        >
          save()
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={saving || history.length === 0}
          >
            undo()
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={saving}
          >
            clear_grid()
          </Button>
          {initialAvatar && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSaved}
              disabled={saving}
            >
              remove_saved()
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
