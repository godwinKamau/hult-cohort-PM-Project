import Link from "next/link";
import type { CSSProperties } from "react";
import type { ProjectDTO } from "@/lib/types";
import {
  getProjectThemeMutedColor,
  getProjectThemeRgb,
  resolveProjectThemeColor,
} from "@/lib/project-theme";

interface ProjectCardProps {
  project: ProjectDTO;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const themeColor = resolveProjectThemeColor(project.themeColor);
  const mutedColor = getProjectThemeMutedColor(themeColor);

  const cardStyle = {
    "--project-theme-rgb": getProjectThemeRgb(themeColor),
  } as CSSProperties;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="project-card bg-black-light/30 transition-all duration-300 rounded p-4 group"
      style={cardStyle}
    >
      <h3 className="font-mono mb-2" style={{ color: themeColor }}>
        {project.name}
      </h3>
      <p
        className="font-mono text-sm line-clamp-2"
        style={{ color: mutedColor }}
      >
        {project.description || "No description"}
      </p>
      {project.github.repoFullName && (
        <p className="font-mono text-xs mt-2" style={{ color: mutedColor }}>
          [{project.github.repoFullName}]
        </p>
      )}
    </Link>
  );
}
