import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("animate-pulse rounded bg-primary/10", className)}
      {...props}
    />
  );
}

export { Skeleton };
