import * as XLSX from 'xlsx';
import { z } from 'zod';

const rowSchema = z.object({
  front_text: z.string().trim().min(1, 'Cột Từ không được để trống'),
  back_text: z.string().trim().min(1, 'Cột Nghĩa không được để trống'),
  example_sentence: z.string().trim().optional(),
});

export type ParsedRow = z.infer<typeof rowSchema>;
export type RowError = { row: number; message: string };

type CanonicalColumn = keyof ParsedRow;

const HEADER_ALIASES: Record<string, CanonicalColumn> = {
  'front_text': 'front_text',
  'front text': 'front_text',
  'term': 'front_text',
  'word': 'front_text',
  'tu': 'front_text',
  'từ': 'front_text',
  'back_text': 'back_text',
  'back text': 'back_text',
  'definition': 'back_text',
  'meaning': 'back_text',
  'nghia': 'back_text',
  'nghĩa': 'back_text',
  'example_sentence': 'example_sentence',
  'example sentence': 'example_sentence',
  'example': 'example_sentence',
  'sentence': 'example_sentence',
  'vi du': 'example_sentence',
  'ví dụ': 'example_sentence',
  'cau vi du': 'example_sentence',
  'câu ví dụ': 'example_sentence',
};

function normalizeHeader(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function canonicalColumn(value: unknown) {
  return HEADER_ALIASES[normalizeHeader(value)];
}

function isBlankRow(row: Record<string, unknown>) {
  return Object.values(row).every((value) => String(value ?? '').trim() === '');
}

function canonicalizeRow(row: Record<string, unknown>) {
  const mapped: Partial<Record<CanonicalColumn, string>> = {};

  for (const [header, value] of Object.entries(row)) {
    const column = canonicalColumn(header);
    if (!column) continue;
    mapped[column] = String(value ?? '').trim();
  }

  return {
    front_text: mapped.front_text ?? '',
    back_text: mapped.back_text ?? '',
    example_sentence: mapped.example_sentence ?? '',
  };
}

export function flashcardFrontKey(frontText: string) {
  return frontText.trim().toLowerCase();
}

export function flashcardIdentityKey(frontText: string, backText: string) {
  return `${flashcardFrontKey(frontText)}\u0000${backText.trim().toLowerCase()}`;
}

export function parseLessonWorkbook(buffer: ArrayBuffer) {
  const wb = XLSX.read(buffer, { type: 'array' });
  const preferredSheet = wb.SheetNames.find((name) =>
    ['tu_vung', 'từ vựng', 'tu vung', 'vocabulary'].includes(name.trim().toLowerCase()),
  );
  const name = preferredSheet ?? wb.SheetNames[0];

  if (!name) {
    return {
      valid: [],
      errors: [{ row: 1, message: 'Workbook không có sheet' }],
      totalRows: 0,
    };
  }

  const sheet = wb.Sheets[name];
  const headerRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });
  const headers = (headerRows[0] ?? []).map(canonicalColumn).filter(Boolean);

  if (!headers.includes('front_text') || !headers.includes('back_text')) {
    return {
      valid: [],
      errors: [
        {
          row: 1,
          message: 'Thiếu cột Từ/Nghĩa. Có thể dùng Từ, Nghĩa, Ví dụ hoặc front_text, back_text, example_sentence.',
        },
      ],
      totalRows: Math.max(0, headerRows.length - 1),
    };
  }

  const raw = XLSX.utils
    .sheet_to_json<Record<string, unknown>>(sheet, { defval: '', blankrows: false })
    .filter((row) => !isBlankRow(row));

  const valid: ParsedRow[] = [];
  const errors: RowError[] = [];
  const seen = new Set<string>();

  raw.forEach((row, i) => {
    const out = rowSchema.safeParse(canonicalizeRow(row));
    if (!out.success) {
      errors.push({
        row: i + 2,
        message: out.error.issues.map((issue) => issue.message).join('; '),
      });
      return;
    }

    const key = flashcardIdentityKey(out.data.front_text, out.data.back_text);
    if (seen.has(key)) {
      errors.push({ row: i + 2, message: 'Dòng trùng Từ/Nghĩa trong chính file Excel' });
      return;
    }

    seen.add(key);
    valid.push(out.data);
  });

  return { valid, errors, totalRows: raw.length };
}
