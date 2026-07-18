"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { NotificationDTO, ProjectInviteInboxDTO } from "@/lib/types";
import { respondToInviteAction } from "@/actions/invites";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function InboxDropdown() {
  const router = useRouter();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const { data, mutate } = useSWR<{
    items: NotificationDTO[];
    invites: ProjectInviteInboxDTO[];
  }>("/api/inbox", fetcher, {
    refreshInterval: 10000,
    refreshWhenHidden: false,
  });

  const items = data?.items ?? [];
  const invites = data?.invites ?? [];
  const unreadCount = items.length + invites.length;

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setRespondingId(inviteId);
    const result = await respondToInviteAction(inviteId, accept);
    if (result.success) {
      await mutate();
      router.refresh();
    }
    setRespondingId(null);
  };

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
      <DropdownMenuContent align="end" className="w-80">
        {invites.length > 0 && (
          <>
            <DropdownMenuLabel className="font-mono text-xs text-primary">
              project_invites
            </DropdownMenuLabel>
            {invites.map((invite) => (
              <DropdownMenuItem
                key={invite.id}
                className="flex flex-col items-start gap-2 focus:bg-transparent"
                onSelect={(e) => e.preventDefault()}
              >
                <div>
                  <span className="text-xs text-primary block">
                    {invite.inviterName} invited you to {invite.projectName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(invite.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    className="h-7 flex-1"
                    disabled={respondingId === invite.id}
                    onClick={() => handleRespond(invite.id, true)}
                  >
                    accept()
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 flex-1"
                    disabled={respondingId === invite.id}
                    onClick={() => handleRespond(invite.id, false)}
                  >
                    reject()
                  </Button>
                </div>
              </DropdownMenuItem>
            ))}
            {items.length > 0 && <DropdownMenuSeparator />}
          </>
        )}

        {items.length > 0 && (
          <DropdownMenuLabel className="font-mono text-xs text-primary">
            reactions
          </DropdownMenuLabel>
        )}

        {items.length === 0 && invites.length === 0 ? (
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
