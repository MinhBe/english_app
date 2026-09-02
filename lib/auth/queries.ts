import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import type { Profile, Role } from '@prisma/client';

export async function getProfile(): Promise<Profile | null> {
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
  const profile = await getProfile();
  if (!profile) redirect('/sign-in');
  return profile;
}

export async function requireRole(...roles: Role[]) {
  const profile = await requireUser();
  if (!roles.includes(profile.role)) redirect('/dashboard');
  return profile;
}
