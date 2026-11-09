/**
 * Central activation switches for staged PrismDeck capabilities.
 *
 * Keep these false until the product owner explicitly authorizes activation.
 * A feature with a false flag must not expose UI, routes, menus, or insertion actions.
 */
export type StagedFeature =
  | "rememberedPositionSnapping"
  | "customShapeLibrary"
  | "stickFigureAnimationStudio"
  | "bibleVerseInserter";

export const FEATURE_FLAGS: Readonly<Record<StagedFeature, boolean>> = Object.freeze({
  rememberedPositionSnapping: false,
  customShapeLibrary: false,
  stickFigureAnimationStudio: false,
  bibleVerseInserter: false,
});

export function isFeatureEnabled(feature: StagedFeature): boolean {
  return FEATURE_FLAGS[feature];
}
