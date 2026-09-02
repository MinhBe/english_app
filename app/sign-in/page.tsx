'use client';

import { useActionState, useState } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { createAccount, signIn } from './actions';

export default function SignInPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [signInState, signInAction, signInPending] = useActionState(signIn, { error: '' });
  const [signUpState, signUpAction, signUpPending] = useActionState(createAccount, { error: '' });

  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted/30 px-4 py-8">
      <div className="w-full max-w-sm rounded-xl border bg-card p-8">
        <BookOpen className="mx-auto mb-3 h-9 w-9" />
        <h1 className="text-center text-2xl font-bold">Flashcard Learning</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Học từ vựng và ôn tập theo tiến độ của bạn
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'signin' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'signup' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            Tạo tài khoản
          </button>
        </div>

        {mode === 'signin' ? (
          <form action={signInAction} className="mt-5 space-y-4">
            <label className="block text-sm">
              Tài khoản
              <input
                name="username"
                type="text"
                autoComplete="username"
                required
                placeholder="Nhập tài khoản"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              Mật khẩu
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="Nhập mật khẩu"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            {signInState.error && (
              <p className="text-sm text-destructive">{signInState.error}</p>
            )}

            <button
              disabled={signInPending}
              className="w-full rounded-lg bg-primary py-2.5 text-primary-foreground disabled:opacity-60"
            >
              {signInPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Đăng nhập'}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Quản trị viên: admin / 1
            </p>
          </form>
        ) : (
          <form action={signUpAction} className="mt-5 space-y-4">
            <label className="block text-sm">
              Tài khoản mới
              <input
                name="username"
                type="text"
                autoComplete="username"
                minLength={7}
                required
                placeholder="Ít nhất 7 ký tự"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            <label className="block text-sm">
              Mật khẩu
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={7}
                required
                placeholder="Ít nhất 7 ký tự"
                className="mt-1 w-full rounded-lg border bg-background px-3 py-2"
              />
            </label>

            <p className="text-xs text-muted-foreground">
              Không cần email và không cần xác minh. Tạo xong sẽ đăng nhập ngay.
            </p>

            {signUpState.error && (
              <p className="text-sm text-destructive">{signUpState.error}</p>
            )}

            <button
              disabled={signUpPending}
              className="w-full rounded-lg bg-primary py-2.5 text-primary-foreground disabled:opacity-60"
            >
              {signUpPending ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Tạo tài khoản'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
