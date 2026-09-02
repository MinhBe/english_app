'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Download, FileSpreadsheet, Loader2, UploadCloud } from 'lucide-react';
import { importExcel, type ImportState } from './actions';

const initialState: ImportState = { message: '' };

type LessonOption = {
  id: string;
  title: string;
};

export function ImportForm({ lessons }: { lessons: LessonOption[] }) {
  const [state, action, pending] = useActionState(importExcel, initialState);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">1. Tải file Excel mẫu</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Điền các cột Từ, Nghĩa và Ví dụ. Ví dụ là cột tùy chọn.
            </p>
          </div>
          <a
            href="/api/templates/vocabulary"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Download className="h-4 w-4" />
            Tải Excel mẫu
          </a>
        </div>
      </div>

      <form action={action} className="rounded-xl border bg-card p-5 space-y-5">
        <div>
          <h3 className="font-semibold">2. Chọn bộ từ</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo một bộ mới hoặc thêm từ vào bộ hiện có, giống cách quản lý study set của Quizlet.
          </p>
        </div>

        <label className="block text-sm font-medium">
          Bộ từ đích
          <select
            name="lessonId"
            defaultValue=""
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5"
          >
            <option value="">+ Tạo bộ từ mới</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Tên bộ từ mới
          <input
            name="title"
            placeholder="Ví dụ: IELTS Vocabulary - Unit 1"
            className="mt-1.5 w-full rounded-lg border bg-background px-3 py-2.5"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Chỉ dùng khi chọn “Tạo bộ từ mới”. Nếu để trống, hệ thống dùng tên file Excel.
          </span>
        </label>

        <div>
          <h3 className="font-semibold">3. Upload file đã điền</h3>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-7 text-center hover:bg-accent/40">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <span className="mt-2 text-sm font-medium">Chọn file .xlsx</span>
            <span className="mt-1 text-xs text-muted-foreground">Tối đa 5 MB</span>
            <input name="file" type="file" accept=".xlsx" required className="mt-3 text-sm" />
          </label>
        </div>

        <button
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang thêm từ...
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" />
              Thêm từ vào Draft
            </>
          )}
        </button>
      </form>

      {state.message && (
        <div className="rounded-xl border bg-card p-5">
          <p className="font-semibold">{state.message}</p>
          {state.successRows !== undefined && (
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-muted p-3">
                <div className="text-lg font-bold">{state.successRows}</div>
                <div className="text-muted-foreground">Đã thêm</div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-lg font-bold">{state.skippedRows ?? 0}</div>
                <div className="text-muted-foreground">Đã có</div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-lg font-bold">{state.errorRows ?? 0}</div>
                <div className="text-muted-foreground">Lỗi</div>
              </div>
            </div>
          )}

          {state.lessonId && (
            <Link
              className="mt-4 inline-block text-sm font-medium underline"
              href={`/teacher/lessons/${state.lessonId}`}
            >
              Mở bộ từ và kiểm tra Draft
            </Link>
          )}

          {state.errors?.length ? (
            <ul className="mt-4 max-h-56 overflow-auto list-disc space-y-1 pl-5 text-sm text-destructive">
              {state.errors.map((error, index) => (
                <li key={`${error.row}-${index}`}>
                  Dòng {error.row}: {error.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
}
