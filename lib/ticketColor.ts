import type { CSSProperties } from "react";
import { getProjectThemeCssVars } from "@/lib/project-theme";

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export interface TicketColorStyles {
  borderColor: string;
  hoverBorderColor: string;
  textColor: string;
  badgeBackground: string;
}

export function getTicketColorStyles(color?: string): TicketColorStyles | null {
  if (!color?.trim()) return null;

  const { r, g, b } = hexToRgb(color);
  return {
    borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
    hoverBorderColor: `rgba(${r}, ${g}, ${b}, 0.55)`,
    textColor: color,
    badgeBackground: `rgba(${r}, ${g}, ${b}, 0.12)`,
  };
}

export function getTicketPeekAccentStyle(color?: string): CSSProperties | undefined {
  const styles = getTicketColorStyles(color);
  if (!styles) return undefined;

  return {
    color: styles.textColor,
    borderColor: styles.borderColor,
    boxShadow: `0 0 16px ${styles.badgeBackground}`,
  };
}

export function getTicketColorScopeStyle(color?: string): CSSProperties | undefined {
  if (!color?.trim()) return undefined;
  return getProjectThemeCssVars(color) as CSSProperties;
}

export function getContrastTextColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#0a0a0a" : "#fafafa";
}
