# Flashcard Learning Platform

Nền tảng học từ vựng nhiều vai trò theo phạm vi đồ án đã chốt:

- `ADMIN` / `TEACHER` / `STUDENT` qua Supabase Auth.
- Giáo viên soạn thẻ thủ công hoặc import `.xlsx` (`front_text`, `back_text`, `example_sentence`).
- Vòng đời nội dung Draft → Preview → Publish → Revision History → Rollback.
- Sinh viên ôn theo FSRS với New/Learning/Review/Relearning và ReviewLog.
- Next.js App Router monolith + Prisma + PostgreSQL (Supabase), deploy Vercel + Supabase.
- Không AI, không MCP.

## Setup

1. `cp .env.example .env` và điền biến Supabase/Postgres.
2. Chạy `supabase/profile-trigger.sql` trong Supabase SQL Editor.
3. `pnpm install && pnpm db:generate && pnpm db:migrate`.
4. `pnpm db:seed` để tạo tài khoản giáo viên mẫu.
5. `pnpm build && pnpm test`.
