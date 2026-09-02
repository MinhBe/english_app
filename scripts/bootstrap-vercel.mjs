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

const publicKey =
  (integrationPrefix &&
    (process.env[`NEXT_PUBLIC_${integrationPrefix}_SUPABASE_ANON_KEY`] ||
      process.env[`${integrationPrefix}_SUPABASE_PUBLISHABLE_KEY`])) ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!databaseUrl || !directUrl) throw new Error('Postgres env missing.');
if (!supabaseUrl || !adminKey || !publicKey) throw new Error('Supabase auth env missing.');

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

const authAdmin = createClient(supabaseUrl, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data: listed, error: listError } = await authAdmin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) throw listError;

const testUsers = [
  { email: 'admin@test.local', password: 'admin1', role: 'ADMIN', fullName: 'Test Admin' },
  { email: 'sv@test.local', password: 'sv1234', role: 'STUDENT', fullName: 'Test Student' },
];

for (const spec of testUsers) {
  let user = listed.users.find(
    (candidate) => candidate.email?.toLowerCase() === spec.email,
  );

  if (!user) {
    const { data, error } = await authAdmin.auth.admin.createUser({
      email: spec.email,
      password: spec.password,
      email_confirm: true,
      user_metadata: { full_name: spec.fullName },
    });
    if (error || !data.user) throw error || new Error(`Could not create ${spec.email}`);
    user = data.user;
  } else {
    const { data, error } = await authAdmin.auth.admin.updateUserById(user.id, {
      password: spec.password,
      email_confirm: true,
      user_metadata: { full_name: spec.fullName },
    });
    if (error || !data.user) throw error || new Error(`Could not update ${spec.email}`);
    user = data.user;
  }

  await prisma.profile.upsert({
    where: { id: user.id },
    create: {
      id: user.id,
      email: spec.email,
      fullName: spec.fullName,
      role: spec.role,
    },
    update: {
      email: spec.email,
      fullName: spec.fullName,
      role: spec.role,
    },
  });

  const probe = createClient(supabaseUrl, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: loginData, error: loginError } = await probe.auth.signInWithPassword({
    email: spec.email,
    password: spec.password,
  });
  if (loginError || !loginData.user) {
    throw loginError || new Error(`Login verification failed for ${spec.email}`);
  }
  await probe.auth.signOut();
}

const profiles = await prisma.profile.findMany({
  where: { email: { in: testUsers.map((user) => user.email) } },
  select: { email: true, role: true },
  orderBy: { email: 'asc' },
});
await prisma.$disconnect();

if (profiles.length !== 2) throw new Error('Expected two test profiles.');
console.log('Bootstrap verified: both test logins work and roles are present.');
