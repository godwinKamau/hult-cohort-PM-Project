export type TicketStatus = "todo" | "in_progress" | "done";

export type NotificationType = "push" | "pull_request" | "reaction";

export type ProjectInviteStatus = "pending" | "accepted" | "rejected";

export const TAG_COLORS = [
  "#00ff41",
  "#00ccff",
  "#ffaa00",
  "#ff0040",
  "#aa66ff",
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

export interface UserDTO {
  id: string;
  clerkUserId: string;
  email: string;
  name: string;
  imageUrl?: string;
  githubUsername?: string;
}

export interface OrganizationDTO {
  id: string;
  clerkOrgId: string;
  name: string;
  slug: string;
}

export interface ProjectGithubDTO {
  repoFullName?: string;
  branch?: string;
  webhookConfiguredAt?: string;
}

export interface ProjectDTO {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  archived: boolean;
  github: ProjectGithubDTO;
  createdBy: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInviteDTO {
  id: string;
  organizationId: string;
  projectId: string;
  inviterClerkId: string;
  inviteeClerkId: string;
  status: ProjectInviteStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectInviteInboxDTO extends ProjectInviteDTO {
  projectName: string;
  inviterName: string;
}

export interface TagDTO {
  id: string;
  organizationId: string;
  name: string;
  color: string;
}

export interface TicketDTO {
  id: string;
  organizationId: string;
  projectId: string;
  title: string;
  description: string;
  status: TicketStatus;
  position: number;
  assigneeClerkId?: string;
  tagIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteDTO {
  id: string;
  organizationId: string;
  ticketId: string;
  authorClerkId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationMetaDTO {
  repo?: string;
  branch?: string;
  actorGithubLogin?: string;
  commitCount?: number;
  commitMessage?: string;
  prNumber?: number;
  prAction?: string;
  url?: string;
  reactorClerkId?: string;
  reactorName?: string;
  originalNotificationId?: string;
}

export interface NotificationDTO {
  id: string;
  organizationId: string;
  projectId?: string;
  type: NotificationType;
  title: string;
  meta: NotificationMetaDTO;
  pusherClerkId?: string;
  recipientClerkId?: string;
  deliveryId?: string;
  likeCount: number;
  createdAt: string;
}

export interface BannerItemDTO extends NotificationDTO {
  reacted: boolean;
}

export interface OrgMemberDTO {
  clerkUserId: string;
  email: string;
  name: string;
  imageUrl?: string;
}

export interface PresenceMemberDTO {
  clerkUserId: string;
  name: string;
  imageUrl?: string;
  githubUsername?: string;
}
