import { createClient } from '@supabase/supabase-js';

function firstEnvEndingWith(suffix) {
  return Object.entries(process.env).find(
    ([key, value]) => key.endsWith(suffix) && Boolean(value),
  )?.[1];
}

function findIntegrationPrefix() {
  for (const suffix of ['_SUPABASE_SERVICE_ROLE_KEY', '_SUPABASE_SECRET_KEY']) {
    const entry = Object.entries(process.env).find(
      ([key, value]) => key.endsWith(suffix) && Boolean(value),
    );
    if (entry) return entry[0].slice(0, -suffix.length);
  }
  return null;
}

const prefix = findIntegrationPrefix();
const supabaseUrl =
  (prefix && process.env[`${prefix}_SUPABASE_URL`]) ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const adminKey =
  (prefix &&
    (process.env[`${prefix}_SUPABASE_SERVICE_ROLE_KEY`] ||
      process.env[`${prefix}_SUPABASE_SECRET_KEY`])) ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY;
const databaseUrl =
  (prefix && process.env[`${prefix}_POSTGRES_PRISMA_URL`]) ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  firstEnvEndingWith('_POSTGRES_PRISMA_URL') ||
  firstEnvEndingWith('_POSTGRES_URL');

if (!supabaseUrl || !adminKey || !databaseUrl) {
  throw new Error('Missing environment for one-time sv cleanup.');
}

process.env.DATABASE_URL = databaseUrl;
process.env.DIRECT_URL = databaseUrl;

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();
const admin = createClient(supabaseUrl, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (error) throw error;

const user = data.users.find((candidate) => candidate.email === 'sv@test.local');
if (user) {
  await prisma.studentProgress.deleteMany({ where: { studentId: user.id } });
  await prisma.profile.deleteMany({ where: { id: user.id } });
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) throw deleteError;
  console.log('Legacy sv account removed.');
} else {
  console.log('Legacy sv account was already absent.');
}

await prisma.$disconnect();
