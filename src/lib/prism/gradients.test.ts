import { describe, expect, it } from "vitest";
import { gradientCss, normalizeGradientColors } from "./gradients";

describe("PrismDeck gradient helpers", () => {
  it("keeps no more than six valid gradient stops", () => {
    const colors = normalizeGradientColors([
      "#111111", "invalid", "#222222", "#333333", "#444444",
      "#555555", "#666666", "#777777",
    ]);
    expect(colors).toEqual([
      "#111111", "#222222", "#333333", "#444444", "#555555", "#666666",
    ]);
  });

  it("renders a linear gradient using its rotation and all colour stops", () => {
    expect(gradientCss("linear", 225, ["#111111", "#777777", "#eeeeee"])).toBe(
      "linear-gradient(225deg, #111111 0%, #777777 50%, #eeeeee 100%)",
    );
  });

  it("supports radial and reverse-radial gradients", () => {
    expect(gradientCss("radial", 0, ["#111111", "#eeeeee"])).toContain(
      "radial-gradient(circle at center, #111111 0%, #eeeeee 100%)",
    );
    expect(gradientCss("reverse-radial", 0, ["#111111", "#eeeeee"])).toContain(
      "radial-gradient(circle at center, #eeeeee 0%, #111111 100%)",
    );
  });

  it("supports conic gradients with rotation", () => {
    expect(gradientCss("conic", 90, ["#111111", "#eeeeee"])).toBe(
      "conic-gradient(from 90deg, #111111 0%, #eeeeee 100%)",
    );
  });

  it("falls back to the default two-colour gradient when fewer than two valid stops exist", () => {
    expect(normalizeGradientColors(["#123456", "bad"])).toEqual(["#6366f1", "#22d3ee"]);
  });
});
