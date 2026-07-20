"use client";

import { AVATAR_CELLS, AVATAR_GRID_SIZE } from "@/lib/avatar";
import { TAG_COLORS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PixelAvatar } from "@/components/avatar/PixelAvatar";
import { cn } from "@/lib/cn";
import { SimHeader } from "../SimHeader";
import { useTourTarget } from "../TourTargetContext";

const PREVIEW_GRID =
  "0000000000000" +
  "0000000000000" +
  "0000111111100" +
  "0011000000010" +
  "0101000000100" +
  "0100000000100" +
  "0100000000100" +
  "0100000000100" +
  "0011000000010" +
  "0000111111100" +
  "0000000000000" +
  "0000000000000" +
  "0000000000000";

export function AvatarScreen() {
  const avatarEditorRef = useTourTarget("avatar-editor");
  const selectedColor = TAG_COLORS[0];

  return (
    <div className="min-h-[320px]">
      <SimHeader activeNav="avatar" />
      <div className="px-4 py-6">
        <div className="max-w-lg space-y-5">
          <div>
            <h1 className="mb-1 font-mono text-lg text-primary">pixel_avatar</h1>
            <p className="font-mono text-xs text-muted-foreground">
              &gt; draw your 13x13 stamp — used when you like pushes
            </p>
          </div>

          <div
            ref={avatarEditorRef}
            className="space-y-4 rounded border border-primary/20 bg-black-light/20 p-4"
          >
            <div className="space-y-2">
              <span className="font-mono text-xs text-muted-foreground">
                accent_color
              </span>
              <div className="flex gap-2">
                {TAG_COLORS.slice(0, 6).map((tagColor) => (
                  <div
                    key={tagColor}
                    className={cn(
                      "h-8 w-8 rounded border-2",
                      tagColor === selectedColor
                        ? "scale-110 border-primary"
                        : "border-primary/20"
                    )}
                    style={{ backgroundColor: tagColor }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs text-muted-foreground">grid</span>
              <div
                className="inline-grid gap-px rounded border border-primary/20 bg-black-light p-2"
                style={{
                  gridTemplateColumns: `repeat(${AVATAR_GRID_SIZE}, 1fr)`,
                }}
              >
                {Array.from({ length: AVATAR_CELLS }, (_, index) => {
                  const on = PREVIEW_GRID[index] === "1";
                  return (
                    <div
                      key={index}
                      className={cn(
                        "h-3 w-3 border border-primary/10 sm:h-4 sm:w-4",
                        !on && "bg-black-deep"
                      )}
                      style={
                        on ? { backgroundColor: selectedColor } : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs text-muted-foreground">
                preview
              </span>
              <div className="flex items-center gap-6">
                <div className="inline-flex items-center gap-1 rounded border border-primary/20 px-2 py-0.5 font-mono text-xs">
                  <PixelAvatar
                    grid={PREVIEW_GRID}
                    color={selectedColor}
                    size={16}
                  />
                  <span className="text-muted-foreground">like_btn</span>
                </div>
                <PixelAvatar
                  grid={PREVIEW_GRID}
                  color={selectedColor}
                  size={48}
                />
              </div>
            </div>

            <Button
              size="lg"
              className="pointer-events-none min-w-[140px] cyber-border font-mono"
              tabIndex={-1}
            >
              save()
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
