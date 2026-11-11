import type { SlideMaster, MasterLayout } from "./types";
import { uid } from "./factory";

export const MASTER_LAYOUTS: Array<{ id: MasterLayout; name: string; description: string }> = [
  { id: "title", name: "Title", description: "Large opening title with a strong accent rule." },
  { id: "title-content", name: "Title and content", description: "A clean header and spacious content area." },
  { id: "section", name: "Section divider", description: "A bold divider for new chapters." },
  { id: "minimal", name: "Minimal", description: "Quiet framing with no heavy decoration." },
  { id: "two-column", name: "Two columns", description: "Balanced framing for side-by-side content." },
];

const MASTER_COLORS: Record<MasterLayout, { backgroundColor: string; accentColor: string; titleColor: string }> = {
  title: { backgroundColor: "#111827", accentColor: "#38bdf8", titleColor: "#f8fafc" },
  "title-content": { backgroundColor: "#172033", accentColor: "#818cf8", titleColor: "#f8fafc" },
  section: { backgroundColor: "#172033", accentColor: "#f59e0b", titleColor: "#fff7ed" },
  minimal: { backgroundColor: "#fffdf7", accentColor: "#2563eb", titleColor: "#20242c" },
  "two-column": { backgroundColor: "#10251d", accentColor: "#4ade80", titleColor: "#f0fdf4" },
};

export function createSlideMaster(layout: MasterLayout = "title-content", name?: string): SlideMaster {
  const colors = MASTER_COLORS[layout];
  return {
    id: uid("master_"),
    name: name?.trim() || MASTER_LAYOUTS.find(item => item.id === layout)?.name || "New master",
    layout,
    backgroundColor: colors.backgroundColor,
    accentColor: colors.accentColor,
    titleColor: colors.titleColor,
    footerText: "",
    showAccentRule: layout !== "minimal",
    showSlideNumber: false,
    showTitlePlaceholder: layout === "title" || layout === "section",
  };
}

export function cloneSlideMaster(master: SlideMaster): SlideMaster {
  return { ...master, id: uid("master_"), name: `${master.name} copy` };
}
