import { useEffect } from "react";
import { FONTS, isLightColor } from "./ccUtils";

const DARK = {
  "--cc-bg": "#121212",
  "--cc-surface": "#1a1a1a",
  "--cc-rail": "#161616",
  "--cc-sidebar": "#1a1a1a",
  "--cc-hover": "#222222",
  "--cc-text": "#ffffff",
  "--cc-muted": "#a0a0a0",
  "--cc-border": "#2a2a2a",
  "--cc-input": "#1e1e1e",
};
const LIGHT = {
  "--cc-bg": "#f7f7f8",
  "--cc-surface": "#ffffff",
  "--cc-rail": "#ececee",
  "--cc-sidebar": "#ffffff",
  "--cc-hover": "#f0f0f2",
  "--cc-text": "#0a0a0a",
  "--cc-muted": "#6b7280",
  "--cc-border": "#e5e5e7",
  "--cc-input": "#f2f2f4",
};

function resolvedMode(mode) {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return mode === "light" ? "light" : "dark";
}

export function useAppearance(profile) {
  const mode = profile?.theme_mode || "dark";
  const accent = profile?.accent_color || "#CCFF00";
  const fontId = profile?.font_family || "jakarta";

  useEffect(() => {
    const root = document.documentElement;
    const font = FONTS.find((f) => f.id === fontId) || FONTS[0];

    const apply = () => {
      const resolved = resolvedMode(mode);
      const vars = resolved === "light" ? LIGHT : DARK;
      Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
      root.setAttribute("data-cc-mode", resolved);
    };

    apply();
    root.style.setProperty("--cc-accent", accent);
    root.style.setProperty("--cc-accent-fg", isLightColor(accent) ? "#0a0a0a" : "#ffffff");
    root.style.setProperty("--cc-font", font.stack);

    if (mode !== "system") return undefined;
    // Follow the OS theme while "system" is selected
    const mql = window.matchMedia("(prefers-color-scheme: light)");
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, [mode, accent, fontId]);
}