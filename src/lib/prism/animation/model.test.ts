import { describe, expect, it } from "vitest";
import { animationDurationSeconds, clampAnimationFrame, orderKeyframes } from "./model";
import type { RigKeyframe } from "./model";

describe("stick-figure animation model foundations", () => {
  it("clamps timeline frames to the valid frame range", () => {
    expect(clampAnimationFrame(-4, 48)).toBe(0);
    expect(clampAnimationFrame(80, 48)).toBe(47);
    expect(clampAnimationFrame(12.8, 48)).toBe(12);
  });

  it("orders keyframes without mutating the source collection", () => {
    const keyframes: RigKeyframe[] = [
      { id: "late", frame: 12, pose: { joints: {} }, interpolation: "linear" },
      { id: "early", frame: 2, pose: { joints: {} }, interpolation: "hold" },
    ];
    expect(orderKeyframes(keyframes).map(frame => frame.id)).toEqual(["early", "late"]);
    expect(keyframes[0]?.id).toBe("late");
  });

  it("converts frames and FPS into duration seconds", () => {
    expect(animationDurationSeconds({ durationFrames: 72, fps: 24 })).toBe(3);
  });
});
