'use server';

import { createClient } from '@/lib/supabase/server';

export async function signIn(_: { error: string }, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const hasDatabaseUrl = Boolean(
    process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL,
  );

  if (!hasDatabaseUrl) {
    return {
      error:
        'Máy chủ chưa có kết nối Postgres. Hãy kết nối Supabase với project Vercel hoặc cấu hình DATABASE_URL/POSTGRES_PRISMA_URL.',
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: 'Email hoặc mật khẩu không đúng.' } : { error: '' };
  } catch (error) {
    console.error('Sign in failed:', error);
    return { error: 'Không thể kết nối dịch vụ đăng nhập. Vui lòng thử lại sau.' };
  }
}
