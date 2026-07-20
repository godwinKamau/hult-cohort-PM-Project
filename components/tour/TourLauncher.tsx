"use client";

import { useState } from "react";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { GuidedTour } from "./GuidedTour";

export function TourLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setOpen(true)}
        className={cn("font-mono tour-pulse-button")}
      >
        <Compass className="w-4 h-4" />
        take_the_tour()
      </Button>
      <GuidedTour open={open} onClose={() => setOpen(false)} />
    </>
  );
}
