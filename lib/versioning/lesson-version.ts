export type LessonVersionStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type SnapshotCard = {
  flashcardId: string;
  frontText: string;
  backText: string;
  exampleSentence: string | null;
  source: 'MANUAL' | 'IMPORT';
};

export function nextVersionNumber(latest: { versionNumber: number } | null | undefined) {
  return (latest?.versionNumber ?? 0) + 1;
}

export function canRollbackVersion(version: {
  status: LessonVersionStatus;
  publishedAt: Date | null;
}) {
  return version.status === 'ARCHIVED' && version.publishedAt !== null;
}

export function copySnapshotCard(card: SnapshotCard, lessonVersionId: string) {
  return {
    flashcardId: card.flashcardId,
    lessonVersionId,
    frontText: card.frontText,
    backText: card.backText,
    exampleSentence: card.exampleSentence,
    source: card.source,
  };
}
