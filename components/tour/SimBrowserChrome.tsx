"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SimBrowserChromeProps {
  url: string;
  children: ReactNode;
  viewportRef?: React.RefObject<HTMLDivElement | null>;
  overlay?: ReactNode;
  className?: string;
}

export function SimBrowserChrome({
  url,
  children,
  viewportRef,
  overlay,
  className,
}: SimBrowserChromeProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded border border-primary/25 bg-black-deep/95",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-primary/20 bg-black-light/40 px-3 py-2">
        <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
        </div>
        <div className="min-w-0 flex-1 rounded border border-primary/15 bg-black-deep/80 px-3 py-1">
          <span className="block truncate font-mono text-[11px] text-muted-foreground">
            {url}
          </span>
        </div>
      </div>
      <div className="relative">
        <div
          ref={viewportRef}
          className="relative max-h-[min(52vh,420px)] min-h-[280px] overflow-auto bg-black-deep/50"
        >
          {children}
        </div>
      {overlay && (
        <div className="pointer-events-none absolute inset-0 top-0 z-10">
          {overlay}
        </div>
      )}
      </div>
    </div>
  );
}
