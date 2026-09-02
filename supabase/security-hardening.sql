-- Security hardening for the direct-Prisma architecture.
-- Prisma connects directly to Postgres, so these RLS settings primarily lock down the exposed Data API.
alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_versions enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_versions enable row level security;
alter table public.import_batches enable row level security;
alter table public.student_progress enable row level security;
alter table public.review_logs enable row level security;

alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
