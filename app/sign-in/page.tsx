'use client';

import { useActionState } from 'react';
import { signIn } from './actions';
import { BookOpen, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const [state, action, pending] = useActionState(signIn, { error: '' });

  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm border rounded-xl bg-card p-8">
        <BookOpen className="mx-auto h-9 w-9 mb-3" />
        <h1 className="text-2xl font-bold text-center">Flashcard Learning</h1>
        <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
          Đăng nhập tài khoản kiểm thử
        </p>

        <form action={action} className="space-y-4">
          <label className="block text-sm">
            Tài khoản
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="admin hoặc sv"
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-background"
            />
          </label>

          <label className="block text-sm">
            Mật khẩu
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="1"
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-background"
            />
          </label>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <button
            disabled={pending}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
