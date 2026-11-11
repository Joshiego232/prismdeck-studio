export interface SnapBounds {
  x: number;
  y: number;
  w: number;
  h: number;
  snapMemory?: { x: number; y: number; w: number; h: number };
}

export interface SnapTargets {
  x: number[];
  y: number[];
}

export interface SnapAdjustment {
  delta: number;
  guide: number;
}

/** Return left/centre/right and top/centre/bottom alignment lines for a rectangle. */
export function alignmentLines(bounds: Pick<SnapBounds, "x" | "y" | "w" | "h">): { x: number[]; y: number[] } {
  return {
    x: [bounds.x, bounds.x + bounds.w / 2, bounds.x + bounds.w],
    y: [bounds.y, bounds.y + bounds.h / 2, bounds.y + bounds.h],
  };
}

function unique(values: number[]): number[] {
  return [...new Set(values.filter(Number.isFinite).map(value => Math.round(value * 1000) / 1000))];
}

/**
 * Collect slide-edge/centre guides, current object alignment lines, and (when present)
 * the last stored position of each peer. Previous positions remain useful even after
 * the reference object has been moved elsewhere.
 */
export function collectSnapTargets(
  elements: SnapBounds[],
  slideWidth: number,
  slideHeight: number,
  includeRememberedPositions = false,
): SnapTargets {
  const x = [0, slideWidth / 2, slideWidth];
  const y = [0, slideHeight / 2, slideHeight];

  for (const element of elements) {
    const current = alignmentLines(element);
    x.push(...current.x);
    y.push(...current.y);

    if (includeRememberedPositions && element.snapMemory) {
      const remembered = alignmentLines(element.snapMemory);
      x.push(...remembered.x);
      y.push(...remembered.y);
    }
  }

  return { x: unique(x), y: unique(y) };
}

/** Pick the smallest alignment correction within the screen-space threshold. */
export function findAxisSnap(
  anchors: number[],
  targets: number[],
  threshold: number,
): SnapAdjustment | null {
  let best: SnapAdjustment | null = null;
  for (const anchor of anchors) {
    for (const target of targets) {
      const delta = target - anchor;
      if (Math.abs(delta) <= threshold && (!best || Math.abs(delta) < Math.abs(best.delta))) {
        best = { delta, guide: target };
      }
    }
  }
  return best;
}
