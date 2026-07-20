export type TourScreenId =
  | "select-org"
  | "dashboard"
  | "avatar"
  | "project-settings"
  | "banner"
  | "inbox";

export interface TourStep {
  id: string;
  screenId: TourScreenId;
  targetId: string;
  title: string;
  lines: string[];
  screenProps?: Record<string, unknown>;
  /** Optional anchor for callout placement (defaults to targetId) */
  calloutAnchorId?: string;
  /** Preferred callout side relative to anchor */
  calloutSide?: "left" | "right" | "below" | "above" | "auto";
}

export const TOUR_SCREEN_URLS: Record<TourScreenId, string> = {
  "select-org": "pm-platform.app/select-org",
  dashboard: "pm-platform.app/dashboard",
  avatar: "pm-platform.app/avatar",
  "project-settings": "pm-platform.app/projects/demo-project?settings=1",
  banner: "pm-platform.app/dashboard",
  inbox: "pm-platform.app/dashboard",
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "org",
    screenId: "select-org",
    targetId: "org-panel",
    title: "create_or_join_org()",
    lines: [
      "> sign up with GitHub via Clerk",
      "> create a new organization or select one to join",
      "> each org gets its own projects, members, and activity feed",
    ],
  },
  {
    id: "org-switcher",
    screenId: "dashboard",
    targetId: "org-switcher",
    title: "switch_orgs()",
    lines: [
      "> after your first org, use the org switcher in the header",
      "> switch between workspaces without signing out",
      "> all projects and banner activity are scoped to the active org",
    ],
  },
  {
    id: "nav-avatar",
    screenId: "dashboard",
    targetId: "nav-avatar",
    title: "open_avatar_page()",
    lines: [
      "> click avatar in the header nav to open /avatar",
      "> paint your 13×13 pixel stamp before liking pushes",
      "> your avatar replaces 👍 on banner reactions",
    ],
  },
  {
    id: "avatar-editor",
    screenId: "avatar",
    targetId: "avatar-editor",
    title: "create_avatar()",
    lines: [
      "> pick an accent color from the palette",
      "> paint pixels on the 13×13 grid",
      "> save() — preview shows how it appears on the like button",
    ],
  },
  {
    id: "new-project",
    screenId: "dashboard",
    targetId: "new-project-btn",
    title: "new_project()",
    lines: [
      "> open ./dashboard inside your org",
      "> click new_project() in the top-right corner",
      "> each project gets its own Kanban board and settings",
    ],
  },
  {
    id: "create-form",
    screenId: "dashboard",
    targetId: "create-project-form",
    title: "create_project()",
    lines: [
      "> enter a project name and optional description",
      "> submit create_project() to open the Kanban board",
      "> your GitHub username is locked from your OAuth account",
    ],
    screenProps: { showCreateForm: true },
  },
  {
    id: "link-repo",
    screenId: "project-settings",
    targetId: "link-repo-btn",
    title: "link_repo()",
    lines: [
      "> open project → settings() → github.config",
      "> enter owner/repo, verify_repo(), pick a branch",
      "> link_repo() to start receiving push events in the banner",
    ],
    screenProps: { highlightGithub: true, highlightMembers: false },
    calloutAnchorId: "settings-panel",
    calloutSide: "left",
  },
  {
    id: "invite",
    screenId: "project-settings",
    targetId: "invite-btn",
    title: "invite_teammates()",
    lines: [
      "> in members.config, choose From org or By email",
      "> select a teammate and click invite()",
      "> pending invites appear in their inbox bell",
    ],
    screenProps: { highlightGithub: false, highlightMembers: true },
    calloutAnchorId: "settings-panel",
    calloutSide: "left",
  },
  {
    id: "push-banner",
    screenId: "banner",
    targetId: "banner-push",
    title: "push_to_banner()",
    lines: [
      "> push commits to your linked branch",
      "> events appear in the activity banner within ~20–60s",
      "> teammates see pushes scroll across the top bar",
    ],
  },
  {
    id: "inbox-like",
    screenId: "inbox",
    targetId: "inbox-bell",
    title: "like_to_avatar()",
    lines: [
      "> when someone likes your push, check the inbox bell",
      "> open reactions and dismiss the notification",
      "> their pixel avatar floats across your screen",
    ],
  },
];
