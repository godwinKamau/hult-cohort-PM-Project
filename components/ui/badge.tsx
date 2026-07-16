import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/30 text-green-dark bg-primary/5",
        outline: "border-primary/30 text-green-dark",
        destructive: "border-destructive/30 text-destructive",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
