/**
 * Contracts only for a future Bible verse insertion workflow.
 * No Bible text, translation catalogue, network provider, or insertion UI is included.
 * Translation/licensing and church-service requirements will be decided before activation.
 */

export interface BibleVerseReference {
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
}

export interface BibleTranslationDescriptor {
  id: string;
  name: string;
  language: string;
  copyrightNotice?: string;
  attributionText: string;
  publicDomain: boolean;
}

export interface BibleVerseRecord {
  reference: BibleVerseReference;
  translationId: string;
  displayReference: string;
  text: string;
}

export type BibleInsertionTarget = "new-slide" | "current-slide";

export interface BibleInsertionRequest {
  references: BibleVerseReference[];
  translationId: string;
  target: BibleInsertionTarget;
  /** Future layout options will be specified with the product requirements. */
  layoutId?: string;
}

export interface BibleTextProvider {
  readonly id: string;
  listTranslations(): Promise<BibleTranslationDescriptor[]>;
  getVerses(references: BibleVerseReference[], translationId: string): Promise<BibleVerseRecord[]>;
}
