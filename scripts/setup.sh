#!/usr/bin/env bash
set -euo pipefail
pnpm install
pnpm db:generate
printf '%s
' 'Điền .env, tạo Supabase project và chạy migration/seed khi sẵn sàng.'
