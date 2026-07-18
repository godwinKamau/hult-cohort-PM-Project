import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import * as presenceRepo from "@/repositories/presence";

const TAB_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  try {
    const { orgId, userId } = await requireOrg();

    const allowed = await checkRateLimit(`presence-heartbeat:${userId}`);
    if (!allowed) {
      return NextResponse.json({ ok: true, skipped: "rate_limited" });
    }

    const body = (await req.json()) as { tabId?: unknown };
    const tabId = body.tabId;

    if (typeof tabId !== "string" || tabId.length > 36 || !TAB_ID_REGEX.test(tabId)) {
      return NextResponse.json({ ok: false, error: "invalid_tab_id" }, { status: 400 });
    }

    await presenceRepo.recordPresence(orgId, userId, tabId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Presence heartbeat failed:", err);
    return NextResponse.json({ ok: true, skipped: "error" });
  }
}
