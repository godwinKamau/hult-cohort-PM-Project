import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/auth";
import { getGithubAccessToken } from "@/lib/github";
import { pollOrgGithubEvents } from "@/lib/githubPoll";
import { checkRateLimit } from "@/lib/ratelimit";

export async function GET() {
  try {
    const { orgId, userId } = await requireOrg();

    const allowed = await checkRateLimit(`poll:${userId}`);
    if (!allowed) {
      return NextResponse.json({ ok: true, skipped: "rate_limited" });
    }

    const token = await getGithubAccessToken(userId);
    if (!token) {
      return NextResponse.json({ ok: true, skipped: "no_token" });
    }

    await pollOrgGithubEvents({ orgId, token });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("GitHub poll route failed:", err);
    return NextResponse.json({ ok: true, skipped: "error" });
  }
}
