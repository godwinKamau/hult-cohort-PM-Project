"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

export function PushBannerDemo() {
  const [showPush, setShowPush] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowPush(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="rounded border border-primary/20 bg-black-deep/90 overflow-hidden">
      <div className="flex items-center h-8 border-b border-primary/10">
        <span className="font-mono text-xs text-muted-foreground px-3 shrink-0">
          [online]
        </span>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          {!showPush ? (
            <span className="font-mono text-xs text-muted-foreground px-2">
              &gt; waiting_for_github_events…
            </span>
          ) : (
            <div className={cn("inline-flex items-center gap-3 px-3 tour-push-in")}>
              <span className="font-mono text-xs text-muted-foreground">
                [git_push]
              </span>
              <span className="font-mono text-xs text-primary whitespace-nowrap">
                feat: add kanban board
              </span>
              <span className="font-mono text-xs text-green-dark">
                @you
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border border-primary/20 text-muted-foreground">
                👍 0
              </span>
            </div>
          )}
        </div>
      </div>
      <p className="font-mono text-xs text-green-dark px-3 py-2">
        {showPush
          ? "> push detected → banner updated (~20s poll)"
          : "> polling linked repo…"}
      </p>
    </div>
  );
}
