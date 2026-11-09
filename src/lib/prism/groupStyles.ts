import type { ShapeEl } from "./types";

function gradientSignature(shape: ShapeEl): string | null {
  if (!shape.gradient) return null;
  return JSON.stringify({
    type: shape.gradientType ?? "linear",
    angle: shape.gradientAngle,
    colors: shape.gradientColors?.length ? shape.gradientColors : [shape.fill, shape.fill2],
  });
}

/**
 * Share one group-wide gradient only when all group members are shapes and
 * intentionally use an identical gradient definition. Mixed styling falls back
 * to each shape's individual fill and gradient.
 */
export function getSharedGroupGradient(shapes: ShapeEl[], allMembersAreShapes = true): ShapeEl | undefined {
  if (!allMembersAreShapes || shapes.length < 2) return undefined;
  const first = shapes[0];
  if (!first) return undefined;
  const signature = gradientSignature(first);
  if (!signature || !shapes.every(shape => gradientSignature(shape) === signature)) return undefined;
  return first;
}
