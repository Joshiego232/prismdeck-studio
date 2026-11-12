import { describe, expect, it } from "vitest";
import { createShapePresetElements, SHAPE_PRESET_COUNTS, SHAPE_PRESET_IDS, TERRAIN_PRESET_IDS, TERRAIN_TILE_SPEC } from "./ShapePresetGallery";

describe("editable illustration presets", () => {
  it("provides a large, uniquely named catalogue covering the requested subjects", () => {
    expect(SHAPE_PRESET_IDS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(SHAPE_PRESET_IDS).size).toBe(SHAPE_PRESET_IDS.length);
    expect(SHAPE_PRESET_COUNTS.Trees).toBeGreaterThanOrEqual(18);
    expect(SHAPE_PRESET_COUNTS["Grass & foliage"]).toBeGreaterThanOrEqual(6);
    expect(SHAPE_PRESET_COUNTS.Flowers).toBeGreaterThanOrEqual(10);
    expect(SHAPE_PRESET_COUNTS.Planets).toBeGreaterThanOrEqual(10);
    expect(SHAPE_PRESET_COUNTS.Buildings).toBeGreaterThanOrEqual(10);
    expect(SHAPE_PRESET_COUNTS.Terrain).toBeGreaterThanOrEqual(20);
    expect(TERRAIN_PRESET_IDS.length).toBeGreaterThanOrEqual(20);
    for (const id of ["birch-tree", "oak-tree", "cedar-tree", "pine-tree", "apple-tree", "weeping-willow", "baobab-tree", "saturn", "earth", "glass-tower", "apartment-block", "hills-green", "hills-snowy-woodland", "mountains-autumn-woodland", "plateau-spring", "plateau-autumn-woodland", "plateau-snow", "desert-plains"]) {
      expect(SHAPE_PRESET_IDS).toContain(id);
    }
  });

  it("creates grouped, editable native shape elements for every preset", () => {
    for (const id of SHAPE_PRESET_IDS) {
      const elements = createShapePresetElements(id, 1920, 1080);
      expect(elements.length, id).toBeGreaterThanOrEqual(3);
      expect(elements.every(element => element.type === "shape"), id).toBe(true);
      expect(elements.every(element => element.groupId === elements[0]?.groupId), id).toBe(true);
      expect(new Set(elements.map(element => element.id)).size, id).toBe(elements.length);
      expect(elements.every(element => element.w > 0 && element.h > 0), id).toBe(true);
    }
  });

  it("keeps botanical and architectural illustrations richly layered", () => {
    expect(createShapePresetElements("oak-tree", 1920, 1080).length).toBeGreaterThan(20);
    expect(createShapePresetElements("pine-tree", 1920, 1080).length).toBeGreaterThan(25);
    expect(createShapePresetElements("apple-tree", 1920, 1080).length).toBeGreaterThan(30);
    expect(createShapePresetElements("glass-tower", 1920, 1080).length).toBeGreaterThan(30);
    expect(createShapePresetElements("apartment-block", 1920, 1080).length).toBeGreaterThan(40);
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
    const elements = createShapePresetElements("glass-tower", 800, 600);
    expect(Math.max(...elements.map(element => element.x + element.w))).toBeLessThanOrEqual(800);
    expect(Math.max(...elements.map(element => element.y + element.h))).toBeLessThanOrEqual(600);
  });
});


describe("terrain illustration tiles", () => {
  it("provides all requested terrain families and seasonal variants", () => {
    for (const id of [
      "hills-green", "hills-snow", "hills-autumn", "hills-woodland", "hills-snowy-woodland", "hills-autumn-woodland", "hills-desert",
      "mountains-alpine", "mountains-snow", "mountains-autumn", "mountains-woodland", "mountains-snowy-woodland", "mountains-autumn-woodland",
      "plateau-spring", "plateau-spring-woodland", "plateau-autumn", "plateau-autumn-woodland", "plateau-snow", "plateau-desert",
      "desert-plains", "desert-plains-dunes", "desert-mountain-foothills",
    ]) expect(TERRAIN_PRESET_IDS).toContain(id);
  });

  it("uses the same precise tile width, height, contact line, and substrate for every terrain preset", () => {
    for (const id of TERRAIN_PRESET_IDS) {
      const elements = createShapePresetElements(id, 1920, 1080);
      const foundation = elements.find(element => element.name === "Terrain foundation");
      expect(foundation, id).toBeDefined();
      if (!foundation) continue;
      const tileLeft = foundation.x;
      const tileTop = foundation.y - TERRAIN_TILE_SPEC.baselineY;
      const tileRight = tileLeft + TERRAIN_TILE_SPEC.width;
      const tileBottom = tileTop + TERRAIN_TILE_SPEC.height;
      expect(foundation.x, id).toBeCloseTo(tileLeft);
      expect(foundation.y, id).toBeCloseTo(tileTop + TERRAIN_TILE_SPEC.baselineY);
      expect(foundation.w, id).toBeCloseTo(TERRAIN_TILE_SPEC.width);
      expect(foundation.h, id).toBeCloseTo(TERRAIN_TILE_SPEC.height - TERRAIN_TILE_SPEC.baselineY);
      expect(foundation.fill, id).toBe(TERRAIN_TILE_SPEC.substrateColor);
      expect(Math.min(...elements.map(element => element.x)), id).toBeGreaterThanOrEqual(tileLeft);
      expect(Math.max(...elements.map(element => element.x + element.w)), id).toBeLessThanOrEqual(tileRight);
      expect(Math.min(...elements.map(element => element.y)), id).toBeGreaterThanOrEqual(tileTop);
      expect(Math.max(...elements.map(element => element.y + element.h)), id).toBeLessThanOrEqual(tileBottom);
      expect(elements.every(element => element.groupId === elements[0]?.groupId), id).toBe(true);
    }
  });

  it("gives the wooded terrain variants substantially detailed, editable foliage", () => {
    for (const id of [
      "hills-woodland", "hills-snowy-woodland", "hills-autumn-woodland",
      "mountains-woodland", "mountains-snowy-woodland", "mountains-autumn-woodland",
      "plateau-spring-woodland", "plateau-autumn-woodland", "plateau-snow-woodland",
      "plateau-desert-cacti", "desert-plains-dunes",
    ]) {
      const elements = createShapePresetElements(id, 1920, 1080);
      expect(elements.length, id).toBeGreaterThanOrEqual(35);
      expect(elements.filter(element => element.groupId === elements[0]?.groupId).length, id).toBe(elements.length);
    }
  });
});
