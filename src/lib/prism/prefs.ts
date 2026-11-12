// User preferences + UI layout, persisted locally.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomFontMeta } from "./fonts";
import { DEFAULT_RIBBON, type RibbonLayout } from "./ribbon";

export type ThemeMode = "dark" | "light" | "system";
export type Accent = "indigo" | "cyan" | "emerald" | "amber" | "rose";

export interface Prefs {
  theme: ThemeMode; accent: Accent; uiScale: number;
  showGrid: boolean; snap: boolean; gridSnap: boolean; magnetism: boolean; gridSize: number; polarTracking: boolean; polarIncrement: number; showGuides: boolean;
  showNavigator: boolean; showInspector: boolean; showTimeline: boolean; timelineHeight: number;
  autosave: boolean; autosaveDelay: number;
  reducedMotion: "system" | "on" | "off"; autoHideControls: boolean; loopShow: boolean;
  spellcheck: boolean;
  ribbon: RibbonLayout;
  favoriteFonts: string[]; recentFonts: string[]; customFonts: CustomFontMeta[]; systemFonts: string[];
  seenWelcome: boolean;
  set: (p: Partial<Prefs>) => void;
  pushRecentFont: (f: string) => void;
}

export const usePrefs = create<Prefs>()(persist((set, get) => ({
  theme: "dark", accent: "indigo", uiScale: 1,
  showGrid: false, snap: true, gridSnap: false, magnetism: true, gridSize: 40, polarTracking: false, polarIncrement: 15, showGuides: true,
  showNavigator: true, showInspector: true, showTimeline: false, timelineHeight: 200,
  autosave: true, autosaveDelay: 700,
  reducedMotion: "system", autoHideControls: true, loopShow: false, spellcheck: true,
  ribbon: DEFAULT_RIBBON,
  favoriteFonts: [], recentFonts: [], customFonts: [], systemFonts: [], seenWelcome: false,
  set: (p) => set(p),
  pushRecentFont: (f) => set({ recentFonts: [f, ...get().recentFonts.filter((x) => x !== f)].slice(0, 8) }),
}), { name: "prismdeck:prefs", version: 1, partialize: ({ set: _s, pushRecentFont: _p, ...rest }) => rest }));

export function reducedMotionActive(p: Pick<Prefs, "reducedMotion">) {
  if (p.reducedMotion === "on") return true;
  if (p.reducedMotion === "off") return false;
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}