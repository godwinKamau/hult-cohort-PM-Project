import { requireOrg } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import type { PixelAvatarDTO } from "@/lib/types";
import { AvatarEditor } from "@/components/avatar/AvatarEditor";

export default async function AvatarPage() {
  const { userId } = await requireOrg();

  await connectDB();
  const user = await User.findOne({ clerkUserId: userId }).lean();

  let initialAvatar: PixelAvatarDTO | null = null;
  if (user?.avatarGrid && user?.avatarColor) {
    initialAvatar = { grid: user.avatarGrid, color: user.avatarColor };
  }

  return <AvatarEditor initialAvatar={initialAvatar} />;
}
