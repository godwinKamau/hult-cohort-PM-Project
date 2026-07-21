import { Badge } from "@/components/ui/badge";
import type { TagDTO } from "@/lib/types";
import { getContrastTextColor } from "@/lib/ticketColor";
import { cn } from "@/lib/cn";

interface TagBadgeProps {
  tag: TagDTO;
  className?: string;
}

export function TagBadge({ tag, className }: TagBadgeProps) {
  const textColor = getContrastTextColor(tag.color);

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent text-xs font-mono font-medium", className)}
      style={{
        backgroundColor: tag.color,
        color: textColor,
        borderColor: tag.color,
      }}
    >
      {tag.name}
    </Badge>
  );
}
