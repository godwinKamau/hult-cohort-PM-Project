import type { OrgMemberDTO } from "@/lib/types";
import { getInitials } from "@/lib/memberDisplay";
import { cn } from "@/lib/cn";

interface MemberAvatarProps {
  member: OrgMemberDTO;
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: "h-5 w-5 text-[9px]",
  md: "h-6 w-6 text-[10px]",
};

export function MemberAvatar({
  member,
  size = "sm",
  className,
}: MemberAvatarProps) {
  const sizeClass = sizeClasses[size];

  return (
    <span
      title={member.name}
      aria-label={member.name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/30 bg-black-light/60 font-mono font-medium text-muted-foreground",
        sizeClass,
        className
      )}
    >
      {member.imageUrl ? (
        <img
          src={member.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(member.name)
      )}
    </span>
  );
}
