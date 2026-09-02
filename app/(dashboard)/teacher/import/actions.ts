'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { requireRole } from '@/lib/auth/queries';
import {
  flashcardIdentityKey,
  parseLessonWorkbook,
  type ParsedRow,
} from '@/lib/import/parse-xlsx';
import {
  InvalidXlsxArchiveError,
  validateXlsxArchive,
} from '@/lib/import/validate-xlsx-archive';

export type ImportState = {
  message: string;
  lessonId?: string;
  successRows?: number;
  skippedRows?: number;
  errorRows?: number;
  errors?: { row: number; message: string }[];
};

function uniqueAgainstExisting(rows: ParsedRow[], existingKeys: Set<string>) {
  const added: ParsedRow[] = [];
  let skipped = 0;

  for (const row of rows) {
    const key = flashcardIdentityKey(row.front_text, row.back_text);
    if (existingKeys.has(key)) {
      skipped += 1;
      continue;
    }
    existingKeys.add(key);
    added.push(row);
  }

  return { added, skipped };
}

export async function importExcel(
  _: ImportState,
  formData: FormData,
): Promise<ImportState> {
  const user = await requireRole('TEACHER', 'ADMIN');
  const file = formData.get('file');

  if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.xlsx')) {
    return { message: 'Vui lòng chọn file Excel .xlsx.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { message: 'File Excel vượt quá giới hạn 5 MB.' };
  }

  let parsed: ReturnType<typeof parseLessonWorkbook>;
  try {
    const buffer = await file.arrayBuffer();
    validateXlsxArchive(buffer);
    parsed = parseLessonWorkbook(buffer);
  } catch (error) {
    if (error instanceof InvalidXlsxArchiveError) {
      return { message: error.message };
    }
    console.error('Excel import parse failed:', error);
    return { message: 'Không thể đọc file Excel này.' };
  }

  if (parsed.valid.length === 0) {
    return {
      message: 'Không có dòng từ vựng hợp lệ để import.',
      successRows: 0,
      skippedRows: 0,
      errorRows: parsed.errors.length,
      errors: parsed.errors,
    };
  }

  const requestedLessonId = String(formData.get('lessonId') ?? '').trim();
  const requestedTitle = String(formData.get('title') ?? '').trim();

  if (!requestedLessonId) {
    const title = requestedTitle || file.name.replace(/\.xlsx$/i, '').trim() || 'Bộ từ mới';

    const lesson = await prisma.$transaction(async (tx) => {
      const createdLesson = await tx.lesson.create({
        data: { title, teacherId: user.id },
      });
      const version = await tx.lessonVersion.create({
        data: {
          lessonId: createdLesson.id,
          versionNumber: 1,
          status: 'DRAFT',
          source: 'IMPORT',
          createdById: user.id,
        },
      });

      for (const row of parsed.valid) {
        await tx.flashcard.create({
          data: {
            lessonId: createdLesson.id,
            versions: {
              create: {
                lessonVersionId: version.id,
                frontText: row.front_text,
                backText: row.back_text,
                exampleSentence: row.example_sentence || null,
                source: 'IMPORT',
              },
            },
          },
        });
      }

      await tx.importBatch.create({
        data: {
          lessonVersionId: version.id,
          fileName: file.name,
          totalRows: parsed.totalRows,
          successRows: parsed.valid.length,
          errorRows: parsed.errors.length,
          errorsJson: parsed.errors,
          createdById: user.id,
        },
      });

      return createdLesson;
    });

    revalidatePath('/teacher/lessons');
    revalidatePath('/teacher/import');
    revalidatePath(`/teacher/lessons/${lesson.id}`);

    return {
      message: `Đã tạo bộ từ “${lesson.title}”.`,
      lessonId: lesson.id,
      successRows: parsed.valid.length,
      skippedRows: 0,
      errorRows: parsed.errors.length,
      errors: parsed.errors,
    };
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: requestedLessonId,
      ...(user.role === 'ADMIN' ? {} : { teacherId: user.id }),
    },
  });

  if (!lesson) {
    return { message: 'Không tìm thấy bộ từ hoặc bạn không có quyền chỉnh sửa.' };
  }

  const draft = await prisma.lessonVersion.findFirst({
    where: { lessonId: lesson.id, status: 'DRAFT' },
    orderBy: { versionNumber: 'desc' },
    include: { cardVersions: true },
  });
  const latest = draft
    ? draft
    : await prisma.lessonVersion.findFirst({
        where: { lessonId: lesson.id },
        orderBy: { versionNumber: 'desc' },
        include: { cardVersions: true },
      });

  const existingKeys = new Set(
    (latest?.cardVersions ?? []).map((card) =>
      flashcardIdentityKey(card.frontText, card.backText),
    ),
  );
  const { added: rowsToImport, skipped } = uniqueAgainstExisting(
    parsed.valid,
    existingKeys,
  );

  if (rowsToImport.length === 0) {
    return {
      message: 'Không có từ mới. Tất cả dòng hợp lệ đã tồn tại trong bộ từ.',
      lessonId: lesson.id,
      successRows: 0,
      skippedRows: skipped,
      errorRows: parsed.errors.length,
      errors: parsed.errors,
    };
  }

  const highestVersion = await prisma.lessonVersion.findFirst({
    where: { lessonId: lesson.id },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });

  await prisma.$transaction(async (tx) => {
    if (draft) {
      await tx.lessonVersion.update({
        where: { id: draft.id },
        data: { status: 'ARCHIVED' },
      });
    }

    const version = await tx.lessonVersion.create({
      data: {
        lessonId: lesson.id,
        versionNumber: (highestVersion?.versionNumber ?? 0) + 1,
        status: 'DRAFT',
        source: 'IMPORT',
        createdById: user.id,
      },
    });

    for (const card of latest?.cardVersions ?? []) {
      await tx.flashcardVersion.create({
        data: {
          flashcardId: card.flashcardId,
          lessonVersionId: version.id,
          frontText: card.frontText,
          backText: card.backText,
          exampleSentence: card.exampleSentence,
          source: card.source,
        },
      });
    }

    for (const row of rowsToImport) {
      await tx.flashcard.create({
        data: {
          lessonId: lesson.id,
          versions: {
            create: {
              lessonVersionId: version.id,
              frontText: row.front_text,
              backText: row.back_text,
              exampleSentence: row.example_sentence || null,
              source: 'IMPORT',
            },
          },
        },
      });
    }

    await tx.importBatch.create({
      data: {
        lessonVersionId: version.id,
        fileName: file.name,
        totalRows: parsed.totalRows,
        successRows: rowsToImport.length,
        errorRows: parsed.errors.length,
        errorsJson: parsed.errors,
        createdById: user.id,
      },
    });
  });

  revalidatePath('/teacher/lessons');
  revalidatePath('/teacher/import');
  revalidatePath(`/teacher/lessons/${lesson.id}`);

  return {
    message: `Đã thêm từ mới vào “${lesson.title}”.`,
    lessonId: lesson.id,
    successRows: rowsToImport.length,
    skippedRows: skipped,
    errorRows: parsed.errors.length,
    errors: parsed.errors,
  };
}
