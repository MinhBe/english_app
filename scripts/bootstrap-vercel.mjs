import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

function firstEnvEndingWith(suffix) {
  const entry = Object.entries(process.env).find(
    ([key, value]) => key.endsWith(suffix) && Boolean(value),
  );
  return entry?.[1];
}

function findIntegrationPrefix() {
  const serviceSuffix = '_SUPABASE_SERVICE_ROLE_KEY';
  const secretSuffix = '_SUPABASE_SECRET_KEY';
  const serviceEntry = Object.entries(process.env).find(
    ([key, value]) =>
      key !== 'SUPABASE_SERVICE_ROLE_KEY' &&
      key.endsWith(serviceSuffix) &&
      Boolean(value),
  );
  if (serviceEntry) return serviceEntry[0].slice(0, -serviceSuffix.length);

  const secretEntry = Object.entries(process.env).find(
    ([key, value]) =>
      key !== 'SUPABASE_SECRET_KEY' && key.endsWith(secretSuffix) && Boolean(value),
  );
  if (secretEntry) return secretEntry[0].slice(0, -secretSuffix.length);
  return null;
}

const integrationPrefix = findIntegrationPrefix();

const databaseUrl =
  (integrationPrefix && process.env[`${integrationPrefix}_POSTGRES_PRISMA_URL`]) ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  firstEnvEndingWith('_POSTGRES_PRISMA_URL') ||
  firstEnvEndingWith('_POSTGRES_URL');

const directUrl =
  (integrationPrefix && process.env[`${integrationPrefix}_POSTGRES_URL_NON_POOLING`]) ||
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  firstEnvEndingWith('_POSTGRES_URL_NON_POOLING') ||
  databaseUrl;

const supabaseUrl =
  (integrationPrefix && process.env[`${integrationPrefix}_SUPABASE_URL`]) ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const adminKey =
  (integrationPrefix &&
    (process.env[`${integrationPrefix}_SUPABASE_SERVICE_ROLE_KEY`] ||
      process.env[`${integrationPrefix}_SUPABASE_SECRET_KEY`])) ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!databaseUrl || !directUrl) throw new Error('Postgres env missing.');
if (!supabaseUrl || !adminKey) throw new Error('Supabase admin env missing.');

const childEnv = { ...process.env, DATABASE_URL: databaseUrl, DIRECT_URL: directUrl };

execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
  stdio: 'inherit',
  env: childEnv,
});
execFileSync('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  env: childEnv,
});

process.env.DATABASE_URL = databaseUrl;
process.env.DIRECT_URL = directUrl;
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

for (const table of [
  'profiles',
  'lessons',
  'lesson_versions',
  'flashcards',
  'flashcard_versions',
  'import_batches',
  'student_progress',
  'review_logs',
]) {
  await prisma.$executeRawUnsafe(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
}
await prisma.$disconnect();

const authAdmin = createClient(supabaseUrl, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data, error } = await authAdmin.auth.admin.listUsers({ page: 1, perPage: 10 });
if (error) throw error;
console.log(`Supabase Admin API reachable; ${data.users.length} user(s) sampled.`);
