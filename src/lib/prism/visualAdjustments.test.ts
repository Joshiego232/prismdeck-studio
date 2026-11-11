import { describe, expect, it } from "vitest";
import { makeImage, makeShape, makeText } from "./factory";
import {
  buildVisualBoxShadow,
  buildVisualFilter,
  DEFAULT_VISUAL_ADJUSTMENTS,
  resolveVisualAdjustments,
  toLegacyImageAdjustments,
} from "./visualAdjustments";

describe("shared visual adjustment pipeline", () => {
  it("leaves every supported visual unchanged at neutral settings", () => {
    const elements = [makeShape("rect"), makeText(), makeImage("https://example.test/photo.jpg")];
    for (const element of elements) {
      expect(buildVisualFilter(element)).toBeUndefined();
      expect(buildVisualBoxShadow(element)).toBeUndefined();
    }
  });

  it("builds the same colour pipeline for shapes, text, charts and images", () => {
    const elements = [makeShape("rect"), makeText(), makeImage("https://example.test/photo.jpg")];
    for (const element of elements) {
      element.visualAdjustments = {
        ...DEFAULT_VISUAL_ADJUSTMENTS,
        exposure: 0.5,
        contrast: 24,
        saturation: 32,
        temperature: 35,
        hue: 12,
        clarity: 20,
      };
      const filter = buildVisualFilter(element);
      expect(filter).toContain("brightness(");
      expect(filter).toContain("contrast(");
      expect(filter).toContain("saturate(");
      expect(filter).toContain("sepia(");
      expect(filter).toContain("hue-rotate(");
    }
  });

  it("maps old image adjustment documents into the new shared model", () => {
    const image = makeImage("https://example.test/legacy.jpg", {
      adjust: { brightness: 18, exposure: 25, saturation: 35, contrast: -12, highlights: 8, shadows: 42, temperature: -16, tint: 9, sharpness: 21 },
    });
    const resolved = resolveVisualAdjustments(image);
    expect(resolved.brightness).toBe(18);
    expect(resolved.exposure).toBe(0.5);
    expect(resolved.saturation).toBe(35);
    expect(resolved.shadows).toBe(42);
    expect(resolved.temperature).toBe(-16);
    expect(resolved.sharpness).toBe(21);
  });

  it("supports vignette, shadow, glow and blur finishing effects", () => {
    const shape = makeShape("ellipse");
    shape.visualAdjustments = { ...DEFAULT_VISUAL_ADJUSTMENTS, vignette: 70 };
    shape.shadow = { on: true, x: 4, y: 8, blur: 20, color: "rgba(0,0,0,.3)" };
    shape.glow = { on: true, size: 16, color: "#6bd9ed" };
    shape.blur = 2;
    expect(buildVisualFilter(shape)).toContain("blur(2px)");
    expect(buildVisualFilter(shape)).toContain("drop-shadow(");
    const boxShadow = buildVisualBoxShadow(shape);
    expect(boxShadow).toContain("inset");
    expect(boxShadow).toContain("rgba(0,0,0,.3)");
  });

  it("maps edited values back to legacy image fields", () => {
    const legacy = toLegacyImageAdjustments({ ...DEFAULT_VISUAL_ADJUSTMENTS, brightness: 15, exposure: 1.25, contrast: 20, saturation: -30 });
    expect(legacy.brightness).toBe(15);
    expect(legacy.exposure).toBe(62.5);
    expect(legacy.contrast).toBe(20);
    expect(legacy.saturation).toBe(-30);
  });
});
