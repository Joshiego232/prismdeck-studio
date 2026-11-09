import { describe, expect, it } from "vitest";
import { collectSnapTargets, findAxisSnap } from "./snapGuides";

describe("remembered snap guide calculations", () => {
  const object = {
    x: 300,
    y: 220,
    w: 120,
    h: 80,
    snapMemory: { x: 100, y: 60, w: 120, h: 80 },
  };

  it("includes remembered left, centre and right alignment lines when enabled", () => {
    const targets = collectSnapTargets([object], 1000, 600, true);
    expect(targets.x).toContain(100);
    expect(targets.x).toContain(160);
    expect(targets.x).toContain(220);
    expect(targets.y).toContain(60);
    expect(targets.y).toContain(100);
    expect(targets.y).toContain(140);
  });

  it("does not expose remembered-position guides when the option is disabled", () => {
    const targets = collectSnapTargets([object], 1000, 600, false);
    expect(targets.x).not.toContain(100);
    expect(targets.y).not.toContain(60);
    expect(targets.x).toContain(300);
    expect(targets.y).toContain(220);
  });

  it("snaps the nearest moving edge or centre line to a remembered guide", () => {
    const targets = collectSnapTargets([object], 1000, 600, true);
    const match = findAxisSnap([98, 158, 218], targets.x, 4);
    expect(match).toEqual({ delta: 2, guide: 100 });
  });

  it("always includes slide edges and centre lines", () => {
    const targets = collectSnapTargets([], 1000, 600);
    expect(targets.x).toEqual([0, 500, 1000]);
    expect(targets.y).toEqual([0, 300, 600]);
  });
});
