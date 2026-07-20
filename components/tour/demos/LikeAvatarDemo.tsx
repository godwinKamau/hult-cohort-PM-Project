"use client";

import { useEffect, useState } from "react";
import { PixelAvatar } from "@/components/avatar/PixelAvatar";
import { cn } from "@/lib/cn";

/** Preset 13×13 pixel grid — simple smiley face */
const DEMO_AVATAR_GRID =
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

const DEMO_AVATAR_COLOR = "#ff6b6b";

export function LikeAvatarDemo() {
  const [phase, setPhase] = useState<"inbox" | "floating">("inbox");

  useEffect(() => {
    const timer = setTimeout(() => setPhase("floating"), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative rounded border border-primary/20 bg-black-deep/90 overflow-hidden min-h-[140px]">
      <div className="px-4 py-3 border-b border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-xs text-primary">inbox()</span>
          <span className="font-mono text-xs text-muted-foreground">
            — 1 new
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded border transition-all duration-500",
            phase === "inbox"
              ? "border-primary/40 bg-primary/10"
              : "border-primary/10 opacity-50"
          )}
        >
          <PixelAvatar
            grid={DEMO_AVATAR_GRID}
            color={DEMO_AVATAR_COLOR}
            size={20}
          />
          <span className="font-mono text-xs text-primary">
            Nova liked your push
          </span>
        </div>
      </div>

      {phase === "floating" && (
        <div
          className="absolute left-1/2 bottom-4 -translate-x-1/2 floating-avatar opacity-60"
          style={
            {
              "--drift-x": "24px",
              "--drift-y": "-80px",
              "--drift-rotate": "8deg",
              "--float-duration": "8s",
            } as React.CSSProperties
          }
        >
          <div className="avatar-speech-bubble" aria-hidden>
            <span>🔥</span>
          </div>
          <PixelAvatar
            grid={DEMO_AVATAR_GRID}
            color={DEMO_AVATAR_COLOR}
            size={48}
          />
        </div>
      )}

      <p className="font-mono text-xs text-green-dark px-4 py-2">
        {phase === "inbox"
          ? "> notification received in inbox bell…"
          : "> dismiss inbox → avatar floats across your screen"}
      </p>
    </div>
  );
}
