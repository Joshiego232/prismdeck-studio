// Ribbon layout model (tabs → groups → tools). Tool ids map to the action registry.
export type RibbonTab = "home" | "insert" | "design" | "transitions" | "animations" | "media" | "review" | "view";
export interface RibbonGroup { id: string; label: string; hidden: boolean; tools: { id: string; hidden: boolean }[] }
export interface RibbonLayout { position: "top" | "left" | "bottom"; tabs: Record<RibbonTab, RibbonGroup[]> }

const g = (id: string, label: string, tools: string[]): RibbonGroup => ({ id, label, hidden: false, tools: tools.map((t) => ({ id: t, hidden: false })) });

export const DEFAULT_RIBBON: RibbonLayout = {
  position: "top",
  tabs: {
    home: [g("slides", "Slides", ["slide.new", "slide.duplicate", "slide.delete"]), g("history", "History", ["edit.undo", "edit.redo"])],
    insert: [g("text", "Text", ["insert.text", "insert.heading"]), g("shapes", "Shapes", ["insert.rect", "insert.ellipse", "insert.arrow"])],
    design: [g("size", "Slide size", ["design.169", "design.43"])],
    transitions: [g("gallery", "Gallery", ["transition.fade", "transition.push"])],
    animations: [g("entrance", "Entrance", ["anim.fadeIn"])],
    media: [g("media", "Media", ["insert.image", "insert.video"])],
    review: [g("notes", "Notes", ["review.notes"])],
    view: [g("canvas", "Canvas", ["view.grid", "view.fit"])],
  },
};