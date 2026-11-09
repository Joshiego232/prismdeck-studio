/**
 * Central activation switches for staged PrismDeck capabilities.
 *
 * Keep these false until the product owner explicitly authorizes activation.
 * A feature with a false flag must not expose UI, routes, menus, or insertion actions.
 */
export const FEATURE_FLAGS = Object.freeze({
  rememberedPositionSnapping: false,
  customShapeLibrary: false,
  stickFigureAnimationStudio: false,
  bibleVerseInserter: false,
} as const);

export type StagedFeature = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(feature: StagedFeature): boolean {
  return FEATURE_FLAGS[feature] === true;
}
