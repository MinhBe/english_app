'use server';

import { createClient } from '@/lib/supabase/server';

function hasPostgresConnection() {
  return Object.entries(process.env).some(
    ([key, value]) =>
      Boolean(value) &&
      (key === 'DATABASE_URL' ||
        key === 'POSTGRES_PRISMA_URL' ||
        key === 'POSTGRES_URL' ||
        key.endsWith('_POSTGRES_PRISMA_URL') ||
        key.endsWith('_POSTGRES_URL')),
  );
}

export async function signIn(_: { error: string }, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!hasPostgresConnection()) {
    return {
      error: 'Máy chủ chưa có kết nối Postgres từ Vercel/Supabase integration.',
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
