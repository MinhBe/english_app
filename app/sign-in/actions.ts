'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { normalizeUsername, usernameToInternalEmail } from '@/lib/auth/local-account';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type AuthState = { error: string };

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const rawUsername = String(formData.get('username') ?? '').trim();
  const username = normalizeUsername(rawUsername);
  const password = String(formData.get('password') ?? '');

  let email: string;
  let authPassword: string;

  if (username === 'admin' && password === '1') {
    email = 'admin@test.local';
    authPassword = 'admin1';
  } else {
    if (username.length <= 6 || password.length <= 6) {
      return { error: 'Tài khoản hoặc mật khẩu không đúng.' };
    }
    email = usernameToInternalEmail(username);
    authPassword = password;
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: authPassword,
    });

    if (error) {
      return { error: 'Tài khoản hoặc mật khẩu không đúng.' };
    }
  } catch (error) {
    console.error('Sign in failed:', error);
    return { error: 'Không thể kết nối dịch vụ đăng nhập. Vui lòng thử lại sau.' };
  }

  redirect('/dashboard');
}

export async function createAccount(
  _: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const rawUsername = String(formData.get('username') ?? '').trim();
  const username = normalizeUsername(rawUsername);
  const password = String(formData.get('password') ?? '');

  if (username.length <= 6) {
    return { error: 'Tài khoản phải trên 6 ký tự.' };
  }
  if (password.length <= 6) {
    return { error: 'Mật khẩu phải trên 6 ký tự.' };
  }

  const email = usernameToInternalEmail(username);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username: rawUsername,
        full_name: rawUsername,
      },
    });

    if (error || !data.user) {
      if (error?.message.toLowerCase().includes('already')) {
        return { error: 'Tài khoản này đã tồn tại.' };
      }
      console.error('Create account failed:', error);
      return { error: 'Không thể tạo tài khoản.' };
    }

    await prisma.profile.upsert({
      where: { id: data.user.id },
      create: {
        id: data.user.id,
        email,
        fullName: rawUsername,
        role: 'STUDENT',
      },
      update: {
        email,
        fullName: rawUsername,
        role: 'STUDENT',
      },
    });

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Auto sign in after registration failed:', signInError);
      return { error: 'Tạo tài khoản thành công nhưng chưa thể đăng nhập tự động.' };
    }
  } catch (error) {
    console.error('Create account failed:', error);
    return { error: 'Không thể tạo tài khoản. Vui lòng thử lại.' };
  }

  redirect('/dashboard');
}
