import { z } from 'zod';
const envSchema=z.object({
 NEXT_PUBLIC_SUPABASE_URL:z.string().url(), NEXT_PUBLIC_SUPABASE_ANON_KEY:z.string().min(1),
 SUPABASE_SERVICE_ROLE_KEY:z.string().min(1).optional(), DATABASE_URL:z.string().min(1), DIRECT_URL:z.string().min(1),
 SEED_TEACHER_EMAIL:z.string().email().optional(), SEED_TEACHER_PASSWORD:z.string().min(8).optional(),
});
export const env=envSchema.parse(process.env);
