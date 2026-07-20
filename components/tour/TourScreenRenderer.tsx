"use client";

import type { TourScreenId } from "./tourSteps";
import { AvatarScreen } from "./screens/AvatarScreen";
import { BannerScreen } from "./screens/BannerScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { ProjectSettingsScreen } from "./screens/ProjectSettingsScreen";
import { SelectOrgScreen } from "./screens/SelectOrgScreen";

interface TourScreenRendererProps {
  screenId: TourScreenId;
  screenProps?: Record<string, unknown>;
}

export function TourScreenRenderer({
  screenId,
  screenProps = {},
}: TourScreenRendererProps) {
  switch (screenId) {
    case "select-org":
      return <SelectOrgScreen />;
    case "avatar":
      return <AvatarScreen />;
    case "dashboard":
      return (
        <DashboardScreen
          showCreateForm={Boolean(screenProps.showCreateForm)}
        />
      );
    case "project-settings":
      return (
        <ProjectSettingsScreen
          highlightGithub={screenProps.highlightGithub !== false}
          highlightMembers={Boolean(screenProps.highlightMembers)}
        />
      );
    case "banner":
      return <BannerScreen />;
    case "inbox":
      return <InboxScreen />;
    default:
      return null;
  }
}
