import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import * as notificationRepo from "@/repositories/notifications";
import * as inviteRepo from "@/repositories/projectInvites";

export async function GET() {
  const { userId } = await requireOrg();
  const [items, invites] = await Promise.all([
    notificationRepo.getPersonalNotifications(userId),
    inviteRepo.listPendingInvitesForUser(userId),
  ]);
  return NextResponse.json({ items, invites });
}
