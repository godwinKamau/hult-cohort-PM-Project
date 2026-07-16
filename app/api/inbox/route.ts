import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import * as notificationRepo from "@/repositories/notifications";

export async function GET() {
  const { userId } = await requireOrg();
  const items = await notificationRepo.getPersonalNotifications(userId);
  return NextResponse.json({ items });
}
