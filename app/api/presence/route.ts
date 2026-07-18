import { NextResponse } from "next/server";
import { getOrgMembers, requireOrg } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";
import type { PresenceMemberDTO } from "@/lib/types";
import { User } from "@/models";
import * as presenceRepo from "@/repositories/presence";

export async function GET() {
  const { orgId, userId } = await requireOrg();

  const allowed = await checkRateLimit(`presence-read:${userId}`);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const { available, userIds } = await presenceRepo.listOnlineUserIds(orgId);

  if (!available) {
    return NextResponse.json({
      online: [],
      currentUserId: userId,
      available: false,
    });
  }

  const orgMembers = await getOrgMembers(orgId);
  const memberIds = new Set(orgMembers.map((member) => member.clerkUserId));
  const onlineIds = userIds.filter((id) => memberIds.has(id));

  if (onlineIds.length === 0) {
    return NextResponse.json({
      online: [],
      currentUserId: userId,
      available: true,
    });
  }

  await connectDB();
  const users = await User.find({ clerkUserId: { $in: onlineIds } }).lean();

  const online: PresenceMemberDTO[] = users.map((user) => ({
    clerkUserId: user.clerkUserId,
    name: user.name,
    imageUrl: user.imageUrl ?? undefined,
    githubUsername: user.githubUsername ?? undefined,
  }));

  return NextResponse.json({
    online,
    currentUserId: userId,
    available: true,
  });
}
