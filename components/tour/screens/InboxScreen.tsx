"use client";

import { useEffect, useState } from "react";
import { PixelAvatar } from "@/components/avatar/PixelAvatar";
import { cn } from "@/lib/cn";
import { SimHeader } from "../SimHeader";
import { useTourTarget } from "../TourTargetContext";

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

export function InboxScreen() {
  const inboxReactionRef = useTourTarget("inbox-reaction");
  const [phase, setPhase] = useState<"dropdown" | "floating">("dropdown");

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase("floating"), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-[320px] overflow-hidden">
      <SimHeader activeNav="dashboard" showInboxBadge />

      <div className="absolute right-3 top-12 z-10 w-72 rounded border border-primary/25 bg-black-light/95 shadow-[0_0_24px_rgba(0,255,65,0.12)]">
        <div className="border-b border-primary/15 px-3 py-2">
          <span className="font-mono text-xs text-primary">reactions</span>
        </div>
        <button
          ref={inboxReactionRef}
          type="button"
          tabIndex={-1}
          className={cn(
            "pointer-events-none flex w-full flex-col items-start gap-1 px-3 py-3 text-left transition-opacity",
            phase === "floating" && "opacity-50"
          )}
        >
          <span className="text-xs text-primary">Nova liked your push</span>
          <span className="text-[10px] text-muted-foreground">
            just now
          </span>
        </button>
      </div>

      <div className="px-4 py-8">
        <div className="rounded border border-primary/20 bg-black-light/20 p-6">
          <h2 className="font-mono text-lg text-primary">./projects</h2>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            &gt; open the inbox bell to see who liked your push
          </p>
        </div>
      </div>

      {phase === "floating" && (
        <div
          className="floating-avatar pointer-events-none absolute bottom-8 left-1/2 z-20 -translate-x-1/2 opacity-60"
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
    </div>
  );
}
