"use client";

import useSWR from "swr";
import type { BannerItemDTO } from "@/lib/types";
import { BannerItem } from "./BannerItem";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function NotificationBanner() {
  const { data, mutate } = useSWR<{ items: BannerItemDTO[] }>(
    "/api/banner",
    fetcher,
    {
      refreshInterval: 5000,
      refreshWhenHidden: false,
      dedupingInterval: 4000,
    }
  );

  const items = data?.items ?? [];

  const handleReact = async (id: string, reacted: boolean) => {
    const method = reacted ? "POST" : "DELETE";
    const res = await fetch(`/api/notifications/${id}/react`, { method });
    if (!res.ok) throw new Error("Reaction failed");

    const result = await res.json();
    mutate(
      (current) => {
        if (!current) return current;
        return {
          items: current.items.map((item) =>
            item.id === id
              ? { ...item, likeCount: result.count, reacted: result.reacted }
              : item
          ),
        };
      },
      { revalidate: false }
    );
  };

  return (
    <div className="fixed top-[57px] left-0 right-0 z-40 bg-black-deep/90 border-b border-primary/20 overflow-hidden">
      <div className="flex items-center h-8">
        <div className="shrink-0 px-4 font-mono text-xs text-primary border-r border-primary/20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="terminal-cursor">status: online</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
          {items.length === 0 ? (
            <span className="font-mono text-xs text-muted-foreground px-4">
              &gt; waiting_for_github_events…
            </span>
          ) : (
            <div className="flex banner-scroll whitespace-nowrap">
              {[...items, ...items].map((item, i) => (
                <BannerItem
                  key={`${item.id}-${i}`}
                  item={item}
                  onReact={handleReact}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
