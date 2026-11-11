import { describe, expect, it } from "vitest";
import { makeShape } from "./factory";
import { getSharedGroupGradient } from "./groupStyles";

describe("group fill preservation", () => {
  it("shares a coordinated gradient only when all members use identical settings", () => {
    const first = makeShape("star", { gradient: true, gradientType: "linear", gradientAngle: 135, gradientColors: ["#ff0000", "#ffffff"] });
    const second = makeShape("hexagon", { gradient: true, gradientType: "linear", gradientAngle: 135, gradientColors: ["#ff0000", "#ffffff"] });
    expect(getSharedGroupGradient([first, second])).toBe(first);
  });
  it("preserves each member's fill when grouped shapes have different styling", () => {
    const gradient = makeShape("star", { gradient: true, gradientColors: ["#ff0000", "#ffffff"] });
    const solid = makeShape("hexagon", { gradient: false, fill: "#1155cc" });
    const differentGradient = makeShape("ellipse", { gradient: true, gradientColors: ["#00ff00", "#0000ff"] });
    expect(getSharedGroupGradient([gradient, solid])).toBeUndefined();
    expect(getSharedGroupGradient([gradient, differentGradient])).toBeUndefined();
  });
  it("does not coordinate gradients across mixed element types", () => {
    const first = makeShape("star", { gradient: true });
    const second = makeShape("ellipse", { gradient: true });
    expect(getSharedGroupGradient([first, second], false)).toBeUndefined();
  });
});
