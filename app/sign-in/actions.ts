'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const TEST_ACCOUNTS = {
  admin: { email: 'admin@test.local', supabasePassword: 'admin1' },
  sv: { email: 'sv@test.local', supabasePassword: 'sv1234' },
} as const;

export async function signIn(_: { error: string }, formData: FormData) {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const account = TEST_ACCOUNTS[username as keyof typeof TEST_ACCOUNTS];

  if (!account || password !== '1') {
    return { error: 'Tài khoản hoặc mật khẩu không đúng.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.supabasePassword,
    });

    if (error) {
      console.error('Supabase sign in failed:', error);
      return { error: 'Không thể đăng nhập tài khoản test.' };
    }
  } catch (error) {
    console.error('Sign in failed:', error);
    return { error: 'Không thể kết nối dịch vụ đăng nhập. Vui lòng thử lại sau.' };
  }

  redirect('/dashboard');
}
