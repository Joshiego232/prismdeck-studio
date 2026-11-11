import { describe, expect, it } from "vitest";
import { parseChartData, serializeChartData } from "./charts";
import { createDiagramElements, DIAGRAM_PRESETS } from "./diagrams";
import { createSlideMaster } from "./masters";
import { makeDeck } from "./factory";
import { applyPresentationTheme, PRESENTATION_THEMES } from "./themes";

describe("creative presentation systems", () => {
  it("imports comma-separated and tab-separated chart values", () => {
    expect(parseChartData("Label,Value\nNorth,42\nSouth,58")).toEqual([
      { label: "North", value: 42 },
      { label: "South", value: 58 },
    ]);
    expect(parseChartData("West\t12\nEast\t18")).toEqual([
      { label: "West", value: 12 },
      { label: "East", value: 18 },
    ]);
    expect(parseChartData(serializeChartData([{ label: "A", value: 4 }, { label: "B", value: 9 }]))).toHaveLength(2);
  });

  it("generates editable grouped diagrams for every preset", () => {
    for (const preset of DIAGRAM_PRESETS) {
      const elements = createDiagramElements(preset.id, ["One", "Two", "Three", "Four"], 1920, 1080);
      expect(elements.length).toBeGreaterThan(3);
      expect(elements.every(element => element.type === "shape")).toBe(true);
      const groupIds = new Set(elements.map(element => element.groupId));
      expect(groupIds.size).toBe(1);
      expect([...groupIds][0]).toBeTruthy();
      expect(elements.every(element => element.x >= -5 && element.y >= -5 && element.x + element.w <= 1925 && element.y + element.h <= 1085)).toBe(true);
    }
  });

  it("creates reusable master presets and applies theme palettes to them", () => {
    const deck = makeDeck("Theme test");
    const master = createSlideMaster("title");
    deck.masters = [master];
    const theme = PRESENTATION_THEMES.find(item => item.id === "ocean")!;
    const updated = applyPresentationTheme(deck, theme.id);
    expect(updated.themeId).toBe(theme.id);
    expect(updated.masters?.[0]?.backgroundColor).toBe(theme.background);
    expect(updated.masters?.[0]?.accentColor).toBe(theme.accent);
    expect(updated.masters?.[0]?.titleColor).toBe(theme.foreground);
  });
});
