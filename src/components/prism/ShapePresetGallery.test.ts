import { describe, expect, it } from "vitest";
import { createShapePresetElements, SHAPE_PRESET_IDS } from "./ShapePresetGallery";

describe("editable illustration presets", () => {
  it("provides a uniquely named catalogue with a broad set of illustrations", () => {
    expect(SHAPE_PRESET_IDS.length).toBeGreaterThanOrEqual(18);
    expect(new Set(SHAPE_PRESET_IDS).size).toBe(SHAPE_PRESET_IDS.length);
    expect(SHAPE_PRESET_IDS).toContain("pine-tree");
    expect(SHAPE_PRESET_IDS).toContain("saturn");
    expect(SHAPE_PRESET_IDS).toContain("city-skyline");
  });

  it("creates grouped, editable native shape elements for every preset", () => {
    for (const id of SHAPE_PRESET_IDS) {
      const elements = createShapePresetElements(id, 1920, 1080);
      expect(elements.length, id).toBeGreaterThanOrEqual(2);
      expect(elements.every(element => element.type === "shape"), id).toBe(true);
      expect(elements.every(element => element.groupId === elements[0]?.groupId), id).toBe(true);
      expect(new Set(elements.map(element => element.id)).size, id).toBe(elements.length);
      expect(elements.every(element => element.w > 0 && element.h > 0), id).toBe(true);
    }
  });

  it("centres a preset within the slide and safely rejects unknown ids", () => {
    const elements = createShapePresetElements("saturn", 1920, 1080);
    const left = Math.min(...elements.map(element => element.x));
    const top = Math.min(...elements.map(element => element.y));
    expect(left).toBeGreaterThan(0);
    expect(top).toBeGreaterThan(0);
    expect(createShapePresetElements("not-a-preset", 1920, 1080)).toEqual([]);
  });

  it("scales illustrations down to fit smaller slide formats", () => {
    const elements = createShapePresetElements("city-skyline", 800, 600);
    expect(Math.max(...elements.map(element => element.x + element.w))).toBeLessThanOrEqual(800);
    expect(Math.max(...elements.map(element => element.y + element.h))).toBeLessThanOrEqual(600);
  });
});
