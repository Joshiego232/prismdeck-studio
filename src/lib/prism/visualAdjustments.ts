import type { SlideElement, VisualAdjustments } from "./types";

export const DEFAULT_VISUAL_ADJUSTMENTS: VisualAdjustments = {
  exposure: 0, brightness: 0, contrast: 0, highlights: 0, shadows: 0, blacks: 0, whites: 0,
  saturation: 0, vibrance: 0, temperature: 0, tint: 0, hue: 0,
  clarity: 0, sharpness: 0, fade: 0, vignette: 0,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Resolve current and legacy image adjustments into one consistent editing model. */
export function resolveVisualAdjustments(element: SlideElement): VisualAdjustments {
  if (element.visualAdjustments) return { ...DEFAULT_VISUAL_ADJUSTMENTS, ...element.visualAdjustments };
  if (element.type !== "image") return { ...DEFAULT_VISUAL_ADJUSTMENTS };
  return {
    ...DEFAULT_VISUAL_ADJUSTMENTS,
    brightness: element.adjust.brightness,
    exposure: element.adjust.exposure / 50,
    contrast: element.adjust.contrast,
    saturation: element.adjust.saturation,
    highlights: element.adjust.highlights,
    shadows: element.adjust.shadows,
    temperature: element.adjust.temperature,
    tint: element.adjust.tint,
    sharpness: element.adjust.sharpness,
  };
}

/** CSS filter pipeline shared by images, shapes, text, charts, and video. */
export function buildVisualFilter(element: SlideElement): string | undefined {
  const a = resolveVisualAdjustments(element);
  const brightness = clamp(1 + (
    a.brightness + a.exposure * 35 + a.shadows * .18 + a.highlights * .12 +
    a.whites * .10 - a.blacks * .10
  ) / 100, .1, 2.5);
  const contrast = clamp(1 + (
    a.contrast + a.clarity * .32 + a.sharpness * .22 + a.blacks * .22 + a.whites * .16
  ) / 100, .2, 2.8);
  const saturation = clamp(1 + (a.saturation + a.vibrance * .55) / 100, 0, 3);
  const temperature = Math.abs(a.temperature) / 175;
  const hue = a.hue + a.tint * .28 + (a.temperature < 0 ? a.temperature * .16 : 0);
  const filters = [
    brightness !== 1 ? `brightness(${brightness})` : "",
    contrast !== 1 ? `contrast(${contrast})` : "",
    saturation !== 1 ? `saturate(${saturation})` : "",
    temperature > 0 ? `sepia(${clamp(temperature, 0, .55)})` : "",
    hue !== 0 ? `hue-rotate(${hue}deg)` : "",
    element.blur > 0 ? `blur(${element.blur}px)` : "",
    element.glow.on && element.glow.size > 0
      ? `drop-shadow(0 0 ${element.glow.size}px ${element.glow.color})`
      : "",
    a.fade > 0 ? `opacity(${clamp(1 - a.fade / 150, .25, 1)})` : "",
  ].filter(Boolean);
  return filters.length ? filters.join(" ") : undefined;
}

export function buildVisualBoxShadow(element: SlideElement): string | undefined {
  const a = resolveVisualAdjustments(element);
  const layers: string[] = [];
  if (element.shadow.on) layers.push(`${element.shadow.x}px ${element.shadow.y}px ${element.shadow.blur}px ${element.shadow.color}`);
  if (a.vignette > 0) {
    const strength = clamp(a.vignette / 100, 0, 1) * .72;
    layers.push(`inset 0 0 ${Math.round(80 * strength)}px ${Math.round(28 * strength)}px rgba(0,0,0,${strength})`);
  }
  return layers.length ? layers.join(", ") : undefined;
}

/** Keep the legacy image inspector/document fields in sync during migration. */
export function toLegacyImageAdjustments(adjustments: VisualAdjustments) {
  return {
    brightness: adjustments.brightness,
    exposure: adjustments.exposure * 50,
    contrast: adjustments.contrast,
    saturation: adjustments.saturation,
    highlights: adjustments.highlights,
    shadows: adjustments.shadows,
    temperature: adjustments.temperature,
    tint: adjustments.tint,
    sharpness: adjustments.sharpness,
  };
}
