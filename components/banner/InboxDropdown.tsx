"use client";

import useSWR from "swr";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { NotificationDTO } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function InboxDropdown() {
  const { data } = useSWR<{ items: NotificationDTO[] }>(
    "/api/inbox",
    fetcher,
    {
      refreshInterval: 10000,
      refreshWhenHidden: false,
    }
  );

  const items = data?.items ?? [];
  const unreadCount = items.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-black text-[10px] font-mono flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {items.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted-foreground">
            &gt; inbox_empty
          </DropdownMenuItem>
        ) : (
          items.map((item) => (
            <DropdownMenuItem key={item.id} className="flex flex-col items-start">
              <span className="text-xs text-primary">{item.title}</span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
