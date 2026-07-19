import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireUser } from "@/lib/auth";
import * as notificationRepo from "@/repositories/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const userId = await requireUser();
  const { orgId } = await auth();

  const personalDeleted = await notificationRepo.deletePersonalNotification(
    id,
    userId
  );
  if (personalDeleted) {
    return NextResponse.json({ success: true });
  }

  if (orgId) {
    const bannerDeleted = await notificationRepo.dismissOrgNotification(
      orgId,
      id
    );
    if (bannerDeleted) {
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
