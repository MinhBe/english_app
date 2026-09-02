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
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="font-semibold">1. Tải bộ mẫu</div>
            <div className="mt-1 text-muted-foreground">Tải file Excel mẫu từ hệ thống.</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="font-semibold">2. Điền từ</div>
            <div className="mt-1 text-muted-foreground">Điền Từ, Nghĩa và Ví dụ vào file.</div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="font-semibold">3. Upload lại</div>
            <div className="mt-1 text-muted-foreground">Chọn file đã điền để nhập vào bộ từ.</div>
          </div>
        </div>

        <a
          href="/api/templates/vocabulary"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground hover:opacity-90 sm:w-auto"
        >
          <Download className="h-4 w-4" />
          Tải bộ mẫu Excel
        </a>
        <p className="mt-2 text-xs text-muted-foreground">
          File mẫu có sẵn 3 cột: Từ, Nghĩa, Ví dụ. Cột Ví dụ có thể để trống.
        </p>
      </div>

      <form action={action} className="space-y-5 rounded-xl border bg-card p-5">
        <div>
          <h3 className="font-semibold">Chọn nơi nhập từ</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Có thể tạo bộ từ mới hoặc thêm vào bộ từ đã có.
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
            Chỉ dùng khi tạo bộ từ mới. Nếu để trống, hệ thống dùng tên file Excel.
          </span>
        </label>

        <div>
          <h3 className="font-semibold">Upload file Excel đã điền</h3>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-7 text-center hover:bg-accent/40">
            <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
            <span className="mt-2 text-sm font-medium">Chọn file .xlsx đã điền</span>
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
              Đang nhập từ...
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" />
              Upload và thêm từ
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
