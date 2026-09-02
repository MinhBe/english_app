import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import type { Profile, Role } from '@prisma/client';

export async function getProfile(): Promise<Profile | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.DATABASE_URL
  ) {
    console.error('Missing required Supabase/Prisma environment variables.');
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    return await prisma.profile.findUnique({ where: { id: user.id } });
  } catch (error) {
    console.error('getProfile failed:', error);
    return null;
  }
}

export async function requireUser() {
  const p = await getProfile();
  if (!p) redirect('/sign-in');
  return p;
}

export async function requireRole(...roles: Role[]) {
  const p = await requireUser();
  if (!roles.includes(p.role)) redirect('/dashboard');
  return p;
}
