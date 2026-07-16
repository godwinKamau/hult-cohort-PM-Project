import { NextResponse } from "next/server";
import { pingDB } from "@/lib/db";

export async function GET() {
  const mongoOk = await pingDB();
  return NextResponse.json({
    ok: mongoOk,
    mongo: mongoOk ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
}
