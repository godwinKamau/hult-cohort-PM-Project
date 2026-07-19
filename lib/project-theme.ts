import { TAG_COLORS } from "@/lib/types";

export const DEFAULT_PROJECT_THEME_COLOR = TAG_COLORS[0];

const PROJECT_THEME_CSS_VARS = [
  "--primary",
  "--foreground",
  "--border",
  "--ring",
  "--green-matrix",
  "--card-foreground",
  "--popover-foreground",
  "--secondary-foreground",
  "--sidebar-foreground",
  "--sidebar-primary",
  "--sidebar-accent-foreground",
  "--sidebar-border",
  "--sidebar-ring",
  "--accent-foreground",
  "--muted-foreground",
  "--green-dark",
  "--green-darker",
  "--switch-background",
  "--accent",
] as const;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) =>
      Math.max(0, Math.min(255, Math.round(channel)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function darken(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

function accentTint(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex(r * 0.08, g * 0.08, b * 0.08);
}

export function resolveProjectThemeColor(color?: string): string {
  return color ?? DEFAULT_PROJECT_THEME_COLOR;
}

export function getProjectThemeRgb(color: string): string {
  const { r, g, b } = hexToRgb(color);
  return `${r}, ${g}, ${b}`;
}

export function getProjectThemeMutedColor(color: string): string {
  return darken(color, 0.8);
}

export function getProjectThemeCssVars(color: string): Record<string, string> {
  return {
    "--primary": color,
    "--foreground": color,
    "--border": color,
    "--ring": color,
    "--green-matrix": color,
    "--card-foreground": color,
    "--popover-foreground": color,
    "--secondary-foreground": color,
    "--sidebar-foreground": color,
    "--sidebar-primary": color,
    "--sidebar-accent-foreground": color,
    "--sidebar-border": color,
    "--sidebar-ring": color,
    "--accent-foreground": color,
    "--muted-foreground": darken(color, 0.8),
    "--green-dark": darken(color, 0.8),
    "--green-darker": darken(color, 0.6),
    "--switch-background": darken(color, 0.8),
    "--accent": accentTint(color),
  };
}

export function applyProjectTheme(color: string): () => void {
  const root = document.documentElement;
  const vars = getProjectThemeCssVars(color);
  const previous = new Map<string, string>();

  for (const key of PROJECT_THEME_CSS_VARS) {
    previous.set(key, root.style.getPropertyValue(key));
    root.style.setProperty(key, vars[key]);
  }

  return () => {
    for (const key of PROJECT_THEME_CSS_VARS) {
      const prev = previous.get(key);
      if (prev) {
        root.style.setProperty(key, prev);
      } else {
        root.style.removeProperty(key);
      }
    }
  };
}
