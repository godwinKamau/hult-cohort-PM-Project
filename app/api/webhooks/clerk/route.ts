import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { getGithubLoginFromExternalAccounts } from "@/lib/auth";
import { User, Organization } from "@/models";

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svixId = headerPayload.get("svix-id");
  const svixTimestamp = headerPayload.get("svix-timestamp");
  const svixSignature = headerPayload.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const payload = await req.text();
  const wh = new Webhook(webhookSecret);

  let evt: {
    type: string;
    data: Record<string, unknown>;
  };

  try {
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof evt;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const data = evt.data;
      const clerkUserId = data.id as string;
      const emailAddresses = data.email_addresses as
        | { email_address: string }[]
        | undefined;
      const email = emailAddresses?.[0]?.email_address ?? "";
      const firstName = data.first_name as string | undefined;
      const lastName = data.last_name as string | undefined;
      const imageUrl = data.image_url as string | undefined;
      const externalAccounts = data.external_accounts as
        | { provider?: string; username?: string | null }[]
        | undefined;
      const githubUsername =
        getGithubLoginFromExternalAccounts(externalAccounts);

      await User.findOneAndUpdate(
        { clerkUserId },
        {
          clerkUserId,
          email,
          name:
            `${firstName ?? ""} ${lastName ?? ""}`.trim() ||
            (data.username as string) ||
            "User",
          imageUrl,
          ...(githubUsername ? { githubUsername } : {}),
        },
        { upsert: true }
      );
      break;
    }
    case "organization.created":
    case "organization.updated": {
      const data = evt.data;
      const clerkOrgId = data.id as string;
      const name = data.name as string;
      const slug = (data.slug as string) ?? name.toLowerCase().replace(/\s+/g, "-");

      await Organization.findOneAndUpdate(
        { clerkOrgId },
        { clerkOrgId, name, slug },
        { upsert: true }
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}
