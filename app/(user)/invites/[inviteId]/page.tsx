import { InviteAcceptClient } from "@/components/invites/InviteAcceptClient";

interface InvitePageProps {
  params: Promise<{ inviteId: string }>;
  searchParams: Promise<{ accept?: string }>;
}

export default async function InvitePage({
  params,
  searchParams,
}: InvitePageProps) {
  const { inviteId } = await params;
  const { accept } = await searchParams;

  return (
    <InviteAcceptClient
      inviteId={inviteId}
      autoAccept={accept === "1"}
    />
  );
}
