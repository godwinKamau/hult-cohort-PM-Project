"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { SimHeader } from "../SimHeader";
import { useTourTarget } from "../TourTargetContext";

export function BannerScreen() {
  const bannerPushRef = useTourTarget("banner-push");
  const [showPush, setShowPush] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowPush(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[320px]">
      <SimHeader activeNav="dashboard" />
      <div
        ref={bannerPushRef}
        className="border-b border-primary/20 bg-black-deep/90"
      >
        <div className="flex h-8 items-center">
          <span className="shrink-0 px-3 font-mono text-xs text-muted-foreground">
            [online]
          </span>
          <div className="relative flex h-full flex-1 items-center overflow-hidden">
            {!showPush ? (
              <span className="px-2 font-mono text-xs text-muted-foreground">
                &gt; waiting_for_github_events…
              </span>
            ) : (
              <div className={cn("inline-flex items-center gap-3 px-3 tour-push-in")}>
                <span className="font-mono text-xs text-muted-foreground">
                  [git_push]
                </span>
                <span className="whitespace-nowrap font-mono text-xs text-primary">
                  feat: add kanban board
                </span>
                <span className="font-mono text-xs text-green-dark">@you</span>
                <span className="inline-flex items-center gap-1 rounded border border-primary/20 px-2 py-0.5 font-mono text-xs text-muted-foreground">
                  👍 0
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-8">
        <div className="rounded border border-primary/20 bg-black-light/20 p-6">
          <h2 className="font-mono text-lg text-primary">./projects</h2>
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            &gt; push events from linked repos scroll across the banner above
          </p>
          <div className="mt-4 h-24 rounded border border-primary/15 bg-black-deep/40" />
        </div>
      </div>
    </div>
  );
}
