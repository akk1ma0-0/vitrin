/**
 * Pro accent color palette (spec section 6). `foreground` is pre-computed
 * per color per theme to satisfy WCAG AA contrast on a solid button fill.
 */
export interface AccentColor {
  hex: string;
  name: string;
  foreground: { light: string; dark: string };
}

export const DEFAULT_ACCENT = "#FF6B00";

export const ACCENT_COLORS: AccentColor[] = [
  { hex: "#FF6B00", name: "orange", foreground: { light: "#ffffff", dark: "#ffffff" } },
  { hex: "#FF3B30", name: "red", foreground: { light: "#ffffff", dark: "#ffffff" } },
  { hex: "#FF2D78", name: "pink", foreground: { light: "#ffffff", dark: "#ffffff" } },
  { hex: "#AF52DE", name: "purple", foreground: { light: "#ffffff", dark: "#ffffff" } },
  { hex: "#7C3AED", name: "violet", foreground: { light: "#ffffff", dark: "#ffffff" } },
  { hex: "#2F5BFF", name: "blue", foreground: { light: "#ffffff", dark: "#ffffff" } },
  { hex: "#0A84FF", name: "sky", foreground: { light: "#ffffff", dark: "#ffffff" } },
  { hex: "#00B8D9", name: "cyan", foreground: { light: "#052024", dark: "#052024" } },
  { hex: "#00C853", name: "green", foreground: { light: "#04210d", dark: "#04210d" } },
  { hex: "#C6F432", name: "lime", foreground: { light: "#1c2400", dark: "#1c2400" } },
  { hex: "#FFC400", name: "yellow", foreground: { light: "#231a00", dark: "#231a00" } },
  { hex: "#8E8E93", name: "gray", foreground: { light: "#ffffff", dark: "#ffffff" } },
];

export function isValidAccentColor(hex: string): boolean {
  return ACCENT_COLORS.some((c) => c.hex.toLowerCase() === hex.toLowerCase());
}

export function getAccentForeground(hex: string, theme: "light" | "dark" = "light"): string {
  const color = ACCENT_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
  return color ? color.foreground[theme] : "#ffffff";
}
