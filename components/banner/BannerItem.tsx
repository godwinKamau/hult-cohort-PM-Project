"use client";

import type { BannerItemDTO } from "@/lib/types";
import { ReactionButton } from "./ReactionButton";
import { cn } from "@/lib/cn";

interface BannerItemProps {
  item: BannerItemDTO;
  onReact: (id: string, reacted: boolean) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  ariaHidden?: boolean;
}

export function BannerItem({
  item,
  onReact,
  onDismiss,
  ariaHidden = false,
}: BannerItemProps) {
  const icon = item.type === "push" ? "git_push" : "git_pr";

  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className={cn(
        "inline-flex items-center gap-3 px-4 py-1 border-r border-primary/10 shrink-0"
      )}
    >
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="inline-flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
      >
        <span className="font-mono text-xs text-muted-foreground">
          [{icon}]
        </span>
        <span className="font-mono text-xs text-primary whitespace-nowrap">
          {item.title}
        </span>
        {item.meta.actorGithubLogin && (
          <span className="font-mono text-xs text-green-dark">
            @{item.meta.actorGithubLogin}
          </span>
        )}
      </button>
      <ReactionButton notification={item} onToggle={onReact} />
    </div>
  );
}
