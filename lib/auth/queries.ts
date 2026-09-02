import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import type { Profile, Role } from '@prisma/client';
export async function getProfile(): Promise<Profile | null> {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user) return null; return prisma.profile.findUnique({where:{id:user.id}});
}
export async function requireUser(){ const p=await getProfile(); if(!p) redirect('/sign-in'); return p; }
export async function requireRole(...roles: Role[]){ const p=await requireUser(); if(!roles.includes(p.role)) redirect('/dashboard'); return p; }
