import type { Deck } from "./types";

export interface PresentationTheme {
  id: string;
  name: string;
  background: string;
  foreground: string;
  accent: string;
  secondary: string;
  muted: string;
  fontHeading: string;
  fontBody: string;
}

export const PRESENTATION_THEMES: PresentationTheme[] = [
  { id: "midnight", name: "Midnight", background: "#111827", foreground: "#f8fafc", accent: "#38bdf8", secondary: "#818cf8", muted: "#94a3b8", fontHeading: "Space Grotesk", fontBody: "IBM Plex Sans" },
  { id: "ocean", name: "Ocean", background: "#082f49", foreground: "#ecfeff", accent: "#22d3ee", secondary: "#2dd4bf", muted: "#a5f3fc", fontHeading: "Space Grotesk", fontBody: "IBM Plex Sans" },
  { id: "paper", name: "Paper", background: "#fffdf7", foreground: "#20242c", accent: "#2563eb", secondary: "#f97316", muted: "#64748b", fontHeading: "Space Grotesk", fontBody: "IBM Plex Sans" },
  { id: "forest", name: "Forest", background: "#10251d", foreground: "#f0fdf4", accent: "#4ade80", secondary: "#facc15", muted: "#a7f3d0", fontHeading: "Space Grotesk", fontBody: "IBM Plex Sans" },
  { id: "sunset", name: "Sunset", background: "#2a1728", foreground: "#fff7ed", accent: "#fb7185", secondary: "#fbbf24", muted: "#fbcfe8", fontHeading: "Space Grotesk", fontBody: "IBM Plex Sans" },
  { id: "studio", name: "Studio", background: "#f3f4f6", foreground: "#18181b", accent: "#7c3aed", secondary: "#0891b2", muted: "#71717a", fontHeading: "Space Grotesk", fontBody: "IBM Plex Sans" },
];

export function getPresentationTheme(themeId?: string): PresentationTheme {
  return PRESENTATION_THEMES.find(theme => theme.id === themeId) ?? PRESENTATION_THEMES[0]!;
}

export function applyPresentationTheme(deck: Deck, themeId: string): Deck {
  const theme = getPresentationTheme(themeId);
  return {
    ...deck,
    themeId: theme.id,
    masters: (deck.masters ?? []).map(master => ({
      ...master,
      backgroundColor: theme.background,
      accentColor: theme.accent,
      titleColor: theme.foreground,
    })),
  };
}
