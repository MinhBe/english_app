import 'server-only';

import { prisma } from '@/lib/db/prisma';

export async function ensureProgressRecords(studentId: string, flashcardIds: string[]) {
  if (!flashcardIds.length) {
    return;
  }

  await prisma.studentProgress.createMany({
    data: flashcardIds.map((flashcardId) => ({ studentId, flashcardId })),
    skipDuplicates: true,
  });
}
