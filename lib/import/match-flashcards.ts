import { flashcardFrontKey, flashcardIdentityKey, type ParsedRow } from './parse-xlsx';

export type BaselineCard = {
  flashcardId: string;
  frontText: string;
  backText: string;
};

export type MatchedImportedRow = {
  row: ParsedRow;
  flashcardId: string | null;
};

export function matchImportedRows(
  rows: ParsedRow[],
  baseline: BaselineCard[],
): MatchedImportedRow[] {
  const usedFlashcardIds = new Set<string>();

  return rows.map((row) => {
    const exactKey = flashcardIdentityKey(row.front_text, row.back_text);
    const exact = baseline.find(
      (card) =>
        !usedFlashcardIds.has(card.flashcardId) &&
        flashcardIdentityKey(card.frontText, card.backText) === exactKey,
    );

    if (exact) {
      usedFlashcardIds.add(exact.flashcardId);
      return { row, flashcardId: exact.flashcardId };
    }

    const sameFront = baseline.filter(
      (card) =>
        !usedFlashcardIds.has(card.flashcardId) &&
        flashcardFrontKey(card.frontText) === flashcardFrontKey(row.front_text),
    );

    if (sameFront.length === 1) {
      usedFlashcardIds.add(sameFront[0].flashcardId);
      return { row, flashcardId: sameFront[0].flashcardId };
    }

    return { row, flashcardId: null };
  });
}
