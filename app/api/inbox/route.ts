import { NextResponse } from "next/server";
import {
  cleanupStaleOrgInvitations,
  getPendingOrgInvitationsForUser,
  getUserEmail,
  requireUser,
} from "@/lib/auth";
import * as notificationRepo from "@/repositories/notifications";
import * as inviteRepo from "@/repositories/projectInvites";

export async function GET() {
  const userId = await requireUser();
  const userEmail = await getUserEmail(userId);
  await cleanupStaleOrgInvitations(userId).catch(() => {});
  const [items, invites, orgInvites] = await Promise.all([
    notificationRepo.getPersonalNotifications(userId),
    inviteRepo.listPendingInvitesForUser(userId, userEmail),
    getPendingOrgInvitationsForUser(userId),
  ]);
  return NextResponse.json({ items, invites, orgInvites });
}
