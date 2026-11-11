import { describe, expect, it } from "vitest";
import { TRANSITIONS, transitionFrames } from "./effects";
import type { Transition } from "./types";

const makeTransition = (type: string): Transition => ({
  type,
  duration: 700,
  easing: "cubic-bezier(.4,0,.2,1)",
  direction: "left",
});

describe("slide transition gallery", () => {
  it("uses unique, categorized presets with preview descriptions", () => {
    const ids = TRANSITIONS.map(preset => preset.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("morph");
    expect(ids).toContain("dissolve");
    expect(ids).toContain("cut");
    expect(TRANSITIONS.every(preset => preset.description.trim().length > 10)).toBe(true);
    expect(new Set(TRANSITIONS.map(preset => preset.category))).toEqual(new Set(["Subtle", "Dynamic", "Dramatic"]));
  });

  it("keeps None and Cut instantaneous while retaining an incoming frame", () => {
    for (const type of ["none", "cut"]) {
      const frames = transitionFrames(makeTransition(type));
      expect(frames.incoming).toHaveLength(2);
      expect(frames.incoming[0]).toEqual(frames.incoming[1]);
    }
  });

  it("keeps Morph distinct from Fade and Dissolve", () => {
    const morph = transitionFrames(makeTransition("morph"));
    const fade = transitionFrames(makeTransition("fade"));
    const dissolve = transitionFrames(makeTransition("dissolve"));
    expect(morph.incoming).not.toEqual(fade.incoming);
    expect(morph.incoming).not.toEqual(dissolve.incoming);
    expect(dissolve.incoming[0]).toHaveProperty("filter");
  });

  it("provides valid frame pairs for every gallery transition", () => {
    for (const preset of TRANSITIONS) {
      const frames = transitionFrames(makeTransition(preset.id));
      expect(frames.incoming.length, preset.id).toBeGreaterThanOrEqual(2);
      expect(frames.outgoing.length, preset.id).toBeGreaterThanOrEqual(2);
    }
  });
});
