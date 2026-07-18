"use client";

import { useCallback, useEffect, useRef } from "react";
import useSWR from "swr";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PresenceMemberDTO } from "@/lib/types";

const TAB_ID_STORAGE_KEY = "pm-presence-tab-id";
const PRESENCE_HEARTBEAT_MS = 30_000;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getOrCreateTabId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const existing = sessionStorage.getItem(TAB_ID_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const tabId = crypto.randomUUID();
  sessionStorage.setItem(TAB_ID_STORAGE_KEY, tabId);
  return tabId;
}

export function OnlineMembersDropdown() {
  const tabIdRef = useRef<string>("");

  const { data } = useSWR<{
    online: PresenceMemberDTO[];
    currentUserId: string;
    available: boolean;
  }>("/api/presence", fetcher, {
    refreshInterval: PRESENCE_HEARTBEAT_MS,
    refreshWhenHidden: false,
  });

  const sendHeartbeat = useCallback(async () => {
    if (document.visibilityState !== "visible") {
      return;
    }

    const tabId = tabIdRef.current || getOrCreateTabId();
    tabIdRef.current = tabId;

    if (!tabId) {
      return;
    }

    try {
      await fetch("/api/presence/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabId }),
      });
    } catch {
      // Heartbeat failures should not block the UI.
    }
  }, []);

  useEffect(() => {
    tabIdRef.current = getOrCreateTabId();
    void sendHeartbeat();

    const intervalId = window.setInterval(() => {
      void sendHeartbeat();
    }, PRESENCE_HEARTBEAT_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [sendHeartbeat]);

  const available = data?.available ?? true;
  const currentUserId = data?.currentUserId ?? "";
  const othersOnline =
    data?.online.filter((member) => member.clerkUserId !== currentUserId) ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="shrink-0 px-4 font-mono text-xs text-primary border-r border-primary/20 flex items-center gap-2 h-8 hover:bg-primary/5 outline-none focus-visible:ring-1 focus-visible:ring-primary/40 cursor-pointer"
          aria-label="View online organization members"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="terminal-cursor">status: online</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0 p-0.5 text-[10px]"
      >
        <DropdownMenuItem
          disabled
          className="text-muted-foreground text-[10px] py-1 px-2"
        >
          &gt; online_members
        </DropdownMenuItem>
        {!available ? (
          <DropdownMenuItem
            disabled
            className="text-muted-foreground text-[10px] py-1 px-2 leading-tight"
          >
            &gt; presence_unavailable
          </DropdownMenuItem>
        ) : othersOnline.length === 0 ? (
          <DropdownMenuItem
            disabled
            className="text-muted-foreground text-[10px] py-1 px-2 leading-tight"
          >
            &gt; no_one_else_online
          </DropdownMenuItem>
        ) : (
          othersOnline.map((member) => (
            <DropdownMenuItem
              key={member.clerkUserId}
              className="flex items-center gap-1.5 py-1 px-2 text-[10px] leading-tight"
            >
              {member.imageUrl ? (
                <img
                  src={member.imageUrl}
                  alt=""
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              )}
              <span className="flex flex-col items-start min-w-0 flex-1">
                <span className="text-[10px] text-primary truncate w-full">
                  {member.name}
                </span>
                {member.githubUsername && (
                  <span className="text-[9px] text-green-dark truncate w-full">
                    @{member.githubUsername}
                  </span>
                )}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
