"use client";

import { useLayoutEffect, useRef, useState } from "react";
import useSWR from "swr";
import type { BannerItemDTO } from "@/lib/types";
import { BannerItem } from "./BannerItem";
import { OnlineMembersDropdown } from "./OnlineMembersDropdown";
import { cn } from "@/lib/cn";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/** ~45px/s keeps long commit messages readable; floor scales with item count. */
const PX_PER_SECOND = 45;
const SECONDS_PER_ITEM = 8;
const MIN_DURATION_SEC = 24;

export function NotificationBanner() {
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollDuration, setScrollDuration] = useState(MIN_DURATION_SEC);
  const [shouldScroll, setShouldScroll] = useState(false);

  useSWR("/api/poll/github", fetcher, {
    refreshInterval: 20000,
    refreshWhenHidden: false,
    dedupingInterval: 15000,
  });

  const { data, mutate } = useSWR<{ items: BannerItemDTO[] }>(
    "/api/banner",
    fetcher,
    {
      refreshInterval: 15000,
      refreshWhenHidden: false,
      dedupingInterval: 4000,
    }
  );

  const items = data?.items ?? [];
  const itemSignature = items.map((item) => item.id).join("|");

  useLayoutEffect(() => {
    const track = trackRef.current;
    const viewport = viewportRef.current;
    if (!track || !viewport || items.length === 0) {
      setShouldScroll(false);
      return;
    }

    const updateScroll = () => {
      const contentWidth = track.scrollWidth;
      const needsScroll = contentWidth > viewport.clientWidth + 4;

      setShouldScroll(needsScroll);

      if (needsScroll) {
        const setWidth =
          track.children.length > items.length ? contentWidth / 2 : contentWidth;
        const duration = Math.max(
          items.length * SECONDS_PER_ITEM,
          MIN_DURATION_SEC,
          setWidth / PX_PER_SECOND
        );
        setScrollDuration(duration);
      }
    };

    updateScroll();

    const observer = new ResizeObserver(updateScroll);
    observer.observe(track);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, [itemSignature, items.length, shouldScroll]);

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

  const displayItems = shouldScroll ? [...items, ...items] : items;

  return (
    <div className="fixed top-[57px] left-0 right-0 z-40 bg-black-deep/90 border-b border-primary/20 overflow-hidden">
      <div className="flex items-center h-8">
        <OnlineMembersDropdown />
        <div ref={viewportRef} className="flex-1 overflow-hidden relative">
          {items.length === 0 ? (
            <span className="font-mono text-xs text-muted-foreground px-4">
              &gt; waiting_for_github_events…
            </span>
          ) : (
            <div
              ref={trackRef}
              className={cn(
                "flex whitespace-nowrap",
                shouldScroll ? "banner-scroll" : "banner-scroll-static"
              )}
              style={
                shouldScroll
                  ? ({
                      "--banner-scroll-duration": `${scrollDuration}s`,
                    } as React.CSSProperties)
                  : undefined
              }
              aria-live="polite"
              aria-label="Recent GitHub activity"
            >
              {displayItems.map((item, i) => (
                <BannerItem
                  key={`${item.id}-${i}`}
                  item={item}
                  onReact={handleReact}
                  ariaHidden={shouldScroll && i >= items.length}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
