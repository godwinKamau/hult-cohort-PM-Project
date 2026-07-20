"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { cn } from "@/lib/cn";
import { SimBrowserChrome } from "./SimBrowserChrome";
import { Spotlight, type MeasuredRect } from "./Spotlight";
import { TourCallout } from "./TourCallout";
import { TourScreenRenderer } from "./TourScreenRenderer";
import { TourTargetProvider, useTourTargets } from "./TourTargetContext";
import { TOUR_SCREEN_URLS, TOUR_STEPS } from "./tourSteps";

interface GuidedTourProps {
  open: boolean;
  onClose: () => void;
}

export function GuidedTour({ open, onClose }: GuidedTourProps) {
  if (!open) return null;

  return (
    <TourTargetProvider>
      <GuidedTourContent open={open} onClose={onClose} />
    </TourTargetProvider>
  );
}

function GuidedTourContent({ open, onClose }: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<MeasuredRect | null>(null);
  const [cursorTargetRect, setCursorTargetRect] =
    useState<MeasuredRect | null>(null);
  const [calloutPlacementRect, setCalloutPlacementRect] =
    useState<MeasuredRect | null>(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const { getTarget, version } = useTourTargets();
  const step = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === TOUR_STEPS.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onClose();
      return;
    }
    setStepIndex((index) => Math.min(index + 1, TOUR_STEPS.length - 1));
  }, [isLast, onClose]);

  const goPrev = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const measureTarget = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !step) {
      setTargetRect(null);
      setCursorTargetRect(null);
      setCalloutPlacementRect(null);
      return;
    }

    const target = getTarget(step.targetId);
    const calloutAnchor = getTarget(step.calloutAnchorId ?? step.targetId);
    if (!target || !calloutAnchor) {
      setTargetRect(null);
      setCursorTargetRect(null);
      setCalloutPlacementRect(null);
      return;
    }

    target.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "auto",
    });
    calloutAnchor.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "auto",
    });

    requestAnimationFrame(() => {
      const currentViewport = viewportRef.current;
      const currentStage = stageRef.current;
      if (!currentViewport) return;

      const viewportBounds = currentViewport.getBoundingClientRect();
      const targetBounds = target.getBoundingClientRect();
      const anchorBounds = calloutAnchor.getBoundingClientRect();
      const measuredTarget = {
        top: targetBounds.top - viewportBounds.top,
        left: targetBounds.left - viewportBounds.left,
        width: targetBounds.width,
        height: targetBounds.height,
      };

      setTargetRect(measuredTarget);

      if (currentStage) {
        const stageBounds = currentStage.getBoundingClientRect();
        setStageSize({
          width: currentStage.clientWidth,
          height: currentStage.clientHeight,
        });
        setCursorTargetRect({
          top: targetBounds.top - stageBounds.top,
          left: targetBounds.left - stageBounds.left,
          width: targetBounds.width,
          height: targetBounds.height,
        });
        setCalloutPlacementRect({
          top: anchorBounds.top - stageBounds.top,
          left: anchorBounds.left - stageBounds.left,
          width: anchorBounds.width,
          height: anchorBounds.height,
        });
      } else {
        setCursorTargetRect(measuredTarget);
        setCalloutPlacementRect(measuredTarget);
      }
    });
  }, [getTarget, step]);

  useEffect(() => {
    if (!open) {
      setStepIndex(0);
      setTargetRect(null);
      setCursorTargetRect(null);
      setCalloutPlacementRect(null);
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft" && !isFirst) goPrev();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose, goNext, goPrev, isFirst]);

  useEffect(() => {
    if (!open || !step) return;

    const timer = window.setTimeout(measureTarget, 80);
    return () => window.clearTimeout(timer);
  }, [open, step, stepIndex, version, measureTarget]);

  useViewportObservers(stageRef, viewportRef, measureTarget, open);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open, stepIndex]);

  if (!step) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-callout-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black-deep/90 backdrop-blur-sm"
        aria-label="Close tour"
        onClick={onClose}
      />

      <div
        ref={dialogRef}
        tabIndex={-1}
        className={cn(
          "relative z-10 flex w-full max-w-4xl flex-col overflow-visible outline-none",
          "cyber-border rounded-lg border border-primary/30 bg-black-light/95",
          "shadow-[0_0_40px_rgba(0,255,65,0.15)]"
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-primary/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="ml-1 font-mono text-xs text-muted-foreground">
              guided_tour.sh — simulated spotlight walkthrough
            </span>
          </div>
        </div>

        <div ref={stageRef} className="relative overflow-visible p-4">
          <SimBrowserChrome
            url={TOUR_SCREEN_URLS[step.screenId]}
            viewportRef={viewportRef}
            overlay={<Spotlight rect={targetRect} />}
          >
            <TourScreenRenderer
              key={`${step.screenId}-${stepIndex}`}
              screenId={step.screenId}
              screenProps={step.screenProps}
            />
          </SimBrowserChrome>

          <div className="pointer-events-none absolute inset-0 z-50">
            <TourCallout
              title={step.title}
              lines={step.lines}
              stepIndex={stepIndex}
              stepCount={TOUR_STEPS.length}
              cursorTargetRect={cursorTargetRect}
              placementRect={calloutPlacementRect}
              calloutSide={step.calloutSide ?? "auto"}
              viewportWidth={stageSize.width}
              viewportHeight={stageSize.height}
              isFirst={isFirst}
              isLast={isLast}
              onPrev={goPrev}
              onNext={goNext}
              onSkip={onClose}
              onClose={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function useViewportObservers(
  stageRef: RefObject<HTMLDivElement | null>,
  viewportRef: RefObject<HTMLDivElement | null>,
  measureTarget: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;

    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport) return;

    const handleResize = () => measureTarget();
    window.addEventListener("resize", handleResize);
    viewport.addEventListener("scroll", handleResize, { passive: true });

    const observer = new ResizeObserver(handleResize);
    observer.observe(viewport);
    if (stage) observer.observe(stage);

    return () => {
      window.removeEventListener("resize", handleResize);
      viewport.removeEventListener("scroll", handleResize);
      observer.disconnect();
    };
  }, [enabled, measureTarget, stageRef, viewportRef]);
}
