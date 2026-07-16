"use client";

import { useState } from "react";
import type { BannerItemDTO } from "@/lib/types";
import { cn } from "@/lib/cn";

interface ReactionButtonProps {
  notification: BannerItemDTO;
  onToggle: (id: string, reacted: boolean) => Promise<void>;
}

export function ReactionButton({ notification, onToggle }: ReactionButtonProps) {
  const [count, setCount] = useState(notification.likeCount);
  const [reacted, setReacted] = useState(notification.reacted);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    const prevCount = count;
    const prevReacted = reacted;
    const newReacted = !reacted;

    setLoading(true);
    setReacted(newReacted);
    setCount((c) => (newReacted ? c + 1 : Math.max(0, c - 1)));

    try {
      await onToggle(notification.id, newReacted);
    } catch {
      setReacted(prevReacted);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded border transition-all duration-200",
        reacted
          ? "border-primary bg-primary/10 text-primary"
          : "border-primary/20 text-muted-foreground hover:border-primary/50"
      )}
    >
      👍 {count}
    </button>
  );
}
