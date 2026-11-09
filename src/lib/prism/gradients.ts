import type { GradientType } from "./types";

export function normalizeGradientColors(colors: string[] | undefined, first = "#6366f1", second = "#22d3ee"): string[] {
  const valid = (colors ?? []).filter((color) => /^#[0-9a-f]{3,8}$/i.test(color)).slice(0, 6);
  if (valid.length >= 2) return valid;
  return [first, second];
}

export function gradientCss(type: GradientType | undefined, angle: number, inputColors: string[]): string {
  const colors = normalizeGradientColors(inputColors);
  const stops = colors.map((color, index) => {
    const position = colors.length <= 1 ? 0 : (index / (colors.length - 1)) * 100;
    return `${color} ${position}%`;
  }).join(", ");
  const reverseStops = [...colors].reverse().map((color, index) => {
    const position = (index / Math.max(1, colors.length - 1)) * 100;
    return `${color} ${position}%`;
  }).join(", ");
  const rotation = Number.isFinite(angle) ? angle : 135;
  switch (type ?? "linear") {
    case "radial":
      return `radial-gradient(circle at center, ${stops})`;
    case "reverse-radial":
      return `radial-gradient(circle at center, ${reverseStops})`;
    case "conic":
      return `conic-gradient(from ${rotation}deg, ${stops})`;
    case "diamond":
      return `radial-gradient(closest-side at center, ${stops})`;
    case "linear":
    default:
      return `linear-gradient(${rotation}deg, ${stops})`;
  }
}
