import { PrismaClient } from '@prisma/client';

function firstEnvEndingWith(suffix: string) {
  const entry = Object.entries(process.env).find(
    ([key, value]) => key.endsWith(suffix) && Boolean(value),
  );
  return entry?.[1];
}

const databaseUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL ??
  firstEnvEndingWith('_POSTGRES_PRISMA_URL') ??
  firstEnvEndingWith('_POSTGRES_URL');

const directUrl =
  process.env.DIRECT_URL ??
  process.env.POSTGRES_URL_NON_POOLING ??
  firstEnvEndingWith('_POSTGRES_URL_NON_POOLING') ??
  databaseUrl;

if (databaseUrl && !process.env.DATABASE_URL) process.env.DATABASE_URL = databaseUrl;
if (directUrl && !process.env.DIRECT_URL) process.env.DIRECT_URL = directUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
