"use client";

import { useEffect, useState } from "react";
import { MousePointer2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { MeasuredRect } from "./Spotlight";

interface TourCalloutProps {
  title: string;
  lines: string[];
  stepIndex: number;
  stepCount: number;
  cursorTargetRect: MeasuredRect | null;
  placementRect: MeasuredRect | null;
  calloutSide?: "left" | "right" | "below" | "above" | "auto";
  viewportWidth: number;
  viewportHeight: number;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onClose: () => void;
}

const CALLOUT_WIDTH = 300;
const CALLOUT_HEIGHT = 220;
const CALLOUT_GAP = 16;

export function TourCallout({
  title,
  lines,
  stepIndex,
  stepCount,
  cursorTargetRect,
  placementRect,
  calloutSide = "auto",
  viewportWidth,
  viewportHeight,
  isFirst,
  isLast,
  onPrev,
  onNext,
  onSkip,
  onClose,
}: TourCalloutProps) {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorClick, setCursorClick] = useState(false);

  useEffect(() => {
    if (!cursorTargetRect) {
      setCursorVisible(false);
      return;
    }

    const targetX = cursorTargetRect.left + cursorTargetRect.width * 0.7;
    const targetY = cursorTargetRect.top + cursorTargetRect.height * 0.55;

    setCursorVisible(false);
    setCursorClick(false);
    setCursorPos({
      x: Math.max(12, targetX - 48),
      y: Math.max(12, targetY - 48),
    });

    const showTimer = window.setTimeout(() => {
      setCursorVisible(true);
      setCursorPos({ x: targetX, y: targetY });
    }, 180);

    const clickTimer = window.setTimeout(() => {
      setCursorClick(true);
    }, 680);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(clickTimer);
    };
  }, [cursorTargetRect, stepIndex]);

  const placement = getCalloutPlacement(
    placementRect,
    viewportWidth,
    viewportHeight,
    calloutSide
  );

  return (
    <>
      {cursorTargetRect && cursorVisible && (
        <MousePointer2
          className={cn(
            "pointer-events-none absolute z-[55] h-5 w-5 text-primary drop-shadow-[0_0_8px_rgba(0,255,65,0.8)] transition-all duration-500 ease-out",
            cursorClick && "tour-cursor-click"
          )}
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
          }}
          aria-hidden
        />
      )}

      <div
        className={cn(
          "pointer-events-auto absolute z-[60] w-[min(300px,calc(100%-24px))] cyber-border rounded border border-primary/40 bg-black-light shadow-[0_0_40px_rgba(0,255,65,0.25)]",
          placement.docked && "left-3 right-3 bottom-3 w-auto"
        )}
        style={
          placement.docked
            ? undefined
            : {
                top: placement.top,
                left: placement.left,
              }
        }
        role="region"
        aria-labelledby="tour-callout-title"
      >
        {!placement.docked && placement.arrowSide && (
          <div
            className={cn(
              "absolute h-3 w-3 rotate-45 border border-primary/30 bg-black-light/95",
              placement.arrowSide === "top" &&
                "-top-1.5 left-1/2 -translate-x-1/2 border-b-0 border-r-0",
              placement.arrowSide === "bottom" &&
                "-bottom-1.5 left-1/2 -translate-x-1/2 border-l-0 border-t-0",
              placement.arrowSide === "left" &&
                "-left-1.5 top-8 border-r-0 border-t-0",
              placement.arrowSide === "right" &&
                "-right-1.5 top-8 border-b-0 border-l-0"
            )}
            aria-hidden
          />
        )}

        <div className="flex items-center justify-between border-b border-primary/20 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="ml-1 font-mono text-[10px] text-muted-foreground">
              step {stepIndex + 1}/{stepCount}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground transition-colors hover:text-primary"
            aria-label="Close tour"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-2 px-4 py-3">
          <h3
            id="tour-callout-title"
            className="font-mono text-sm text-primary"
          >
            {title}
          </h3>
          <div className="space-y-1">
            {lines.map((line, index) => (
              <p
                key={index}
                className="font-mono text-xs leading-relaxed text-green-dark"
              >
                {line}
              </p>
            ))}
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            {Array.from({ length: stepCount }, (_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === stepIndex
                    ? "w-5 bg-primary"
                    : "w-1.5 bg-primary/25"
                )}
                aria-hidden
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-primary/20 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="font-mono text-xs"
          >
            skip_tour()
          </Button>
          <div className="flex gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
                className="font-mono text-xs"
              >
                prev()
              </Button>
            )}
            <Button size="sm" onClick={onNext} className="font-mono text-xs">
              {isLast ? "finish()" : "next()"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function getCalloutPlacement(
  placementRect: MeasuredRect | null,
  viewportWidth: number,
  viewportHeight: number,
  calloutSide: "left" | "right" | "below" | "above" | "auto" = "auto"
) {
  if (!placementRect || viewportWidth < 480) {
    return { docked: true as const };
  }

  if (calloutSide === "left") {
    const left =
      placementRect.left - CALLOUT_WIDTH - CALLOUT_GAP;
    if (left >= 12) {
      return {
        docked: false as const,
        top: clamp(
          placementRect.top + 12,
          12,
          viewportHeight - CALLOUT_HEIGHT
        ),
        left,
        arrowSide: "right" as const,
      };
    }
  }

  if (calloutSide === "right") {
    const left = placementRect.left + placementRect.width + CALLOUT_GAP;
    if (left + CALLOUT_WIDTH <= viewportWidth - 12) {
      return {
        docked: false as const,
        top: clamp(
          placementRect.top + 12,
          12,
          viewportHeight - CALLOUT_HEIGHT
        ),
        left,
        arrowSide: "left" as const,
      };
    }
  }

  const spaceBelow =
    viewportHeight - (placementRect.top + placementRect.height + CALLOUT_GAP);
  const spaceAbove = placementRect.top - CALLOUT_GAP;
  const spaceRight =
    viewportWidth - (placementRect.left + placementRect.width + CALLOUT_GAP);

  if (calloutSide === "below" || (calloutSide === "auto" && spaceBelow >= 180)) {
    return {
      docked: false as const,
      top: placementRect.top + placementRect.height + CALLOUT_GAP,
      left: clamp(
        placementRect.left + placementRect.width / 2 - CALLOUT_WIDTH / 2,
        12,
        viewportWidth - CALLOUT_WIDTH - 12
      ),
      arrowSide: "top" as const,
    };
  }

  if (calloutSide === "above" || (calloutSide === "auto" && spaceAbove >= 180)) {
    return {
      docked: false as const,
      top: Math.max(12, placementRect.top - 190),
      left: clamp(
        placementRect.left + placementRect.width / 2 - CALLOUT_WIDTH / 2,
        12,
        viewportWidth - CALLOUT_WIDTH - 12
      ),
      arrowSide: "bottom" as const,
    };
  }

  if (calloutSide === "auto" && spaceRight >= CALLOUT_WIDTH + 12) {
    return {
      docked: false as const,
      top: clamp(placementRect.top - 8, 12, viewportHeight - 200),
      left: placementRect.left + placementRect.width + CALLOUT_GAP,
      arrowSide: "left" as const,
    };
  }

  if (calloutSide === "auto" && spaceBelow >= 120) {
    return {
      docked: false as const,
      top: placementRect.top + placementRect.height + CALLOUT_GAP,
      left: clamp(
        placementRect.left + placementRect.width / 2 - CALLOUT_WIDTH / 2,
        12,
        viewportWidth - CALLOUT_WIDTH - 12
      ),
      arrowSide: "top" as const,
    };
  }

  return { docked: true as const };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
