/**
 * Central activation switches for staged PrismDeck capabilities.
 *
 * Features are activated only when the product owner explicitly authorizes them.
 * A feature with a false flag must not expose UI, routes, menus, or insertion actions.
 */
export type StagedFeature =
  | "rememberedPositionSnapping"
  | "customShapeLibrary"
  | "stickFigureAnimationStudio"
  | "bibleVerseInserter";

export const FEATURE_FLAGS: Readonly<Record<StagedFeature, boolean>> = Object.freeze({
  rememberedPositionSnapping: true,
  customShapeLibrary: true,
  stickFigureAnimationStudio: false,
  bibleVerseInserter: false,
});

export function isFeatureEnabled(feature: StagedFeature): boolean {
  return FEATURE_FLAGS[feature];
}
