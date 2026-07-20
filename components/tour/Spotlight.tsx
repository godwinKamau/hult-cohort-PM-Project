"use client";

import { cn } from "@/lib/cn";

export interface MeasuredRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SpotlightProps {
  rect: MeasuredRect | null;
  padding?: number;
}

export function Spotlight({ rect, padding = 6 }: SpotlightProps) {
  if (!rect) return null;

  const top = rect.top - padding;
  const left = rect.left - padding;
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-20"
        aria-hidden
      >
        <div
          className="absolute rounded tour-spotlight-cutout"
          style={{
            top,
            left,
            width,
            height,
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.72)",
          }}
        />
      </div>
      <div
        className={cn(
          "pointer-events-none absolute z-[21] rounded border-2 border-primary tour-spotlight-ring",
          "shadow-[0_0_20px_rgba(0,255,65,0.35)]"
        )}
        style={{ top, left, width, height }}
        aria-hidden
      />
    </>
  );
}
