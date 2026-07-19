import { AVATAR_GRID_SIZE } from "@/lib/avatar";
import { cn } from "@/lib/cn";

interface PixelAvatarProps {
  grid: string;
  color: string;
  size?: number;
  className?: string;
}

export function PixelAvatar({
  grid,
  color,
  size = 16,
  className,
}: PixelAvatarProps) {
  const cells: React.ReactNode[] = [];

  for (let i = 0; i < grid.length && i < AVATAR_GRID_SIZE * AVATAR_GRID_SIZE; i++) {
    if (grid[i] !== "1") continue;
    const x = i % AVATAR_GRID_SIZE;
    const y = Math.floor(i / AVATAR_GRID_SIZE);
    cells.push(
      <rect
        key={i}
        x={x}
        y={y}
        width={1}
        height={1}
        fill={color}
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${AVATAR_GRID_SIZE} ${AVATAR_GRID_SIZE}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      {cells}
    </svg>
  );
}
