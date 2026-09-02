import { PrismaClient } from '@prisma/client';

function firstEnvEndingWith(suffix: string) {
  const entry = Object.entries(process.env).find(
    ([key, value]) => key.endsWith(suffix) && Boolean(value),
  );
  return entry?.[1];
}

// Prefer database variables created by the active Vercel/Supabase integration.
// This prevents stale manually-created DATABASE_URL values from pointing Prisma
// at a different project than Supabase Auth.
const databaseUrl =
  firstEnvEndingWith('_POSTGRES_PRISMA_URL') ??
  firstEnvEndingWith('_POSTGRES_URL') ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL;

const directUrl =
  firstEnvEndingWith('_POSTGRES_URL_NON_POOLING') ??
  process.env.DIRECT_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  databaseUrl;

if (databaseUrl) process.env.DATABASE_URL = databaseUrl;
if (directUrl) process.env.DIRECT_URL = directUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
