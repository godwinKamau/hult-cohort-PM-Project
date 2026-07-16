import { Badge } from "@/components/ui/badge";
import type { TagDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

interface TagBadgeProps {
  tag: TagDTO;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-mono border-primary/30", className)}
      style={{ color: tag.color, borderColor: `${tag.color}50` }}
    >
      {tag.name}
    </Badge>
  );
}
