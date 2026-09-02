import { execFileSync } from 'node:child_process';
import { createClient } from '@supabase/supabase-js';

function firstEnvEndingWith(suffix) {
  const entry = Object.entries(process.env).find(
    ([key, value]) => key.endsWith(suffix) && Boolean(value),
  );
  return entry?.[1];
}

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  firstEnvEndingWith('_POSTGRES_PRISMA_URL') ||
  firstEnvEndingWith('_POSTGRES_URL');

const directUrl =
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  firstEnvEndingWith('_POSTGRES_URL_NON_POOLING') ||
  databaseUrl;

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  firstEnvEndingWith('_SUPABASE_URL');

const adminKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  firstEnvEndingWith('_SUPABASE_SERVICE_ROLE_KEY') ||
  firstEnvEndingWith('_SUPABASE_SECRET_KEY');

if (!databaseUrl || !directUrl) {
  throw new Error('No Postgres connection was found in Vercel environment variables.');
}
if (!supabaseUrl || !adminKey) {
  throw new Error('Supabase Admin environment variables are incomplete.');
}

const childEnv = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DIRECT_URL: directUrl,
};

console.log('Bootstrap DB: synchronizing Prisma schema.');
execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate'], {
  stdio: 'inherit',
  env: childEnv,
});

console.log('Bootstrap DB: generating Prisma Client.');
execFileSync('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  env: childEnv,
});

process.env.DATABASE_URL = databaseUrl;
process.env.DIRECT_URL = directUrl;
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const tables = [
  'profiles',
  'lessons',
  'lesson_versions',
  'flashcards',
  'flashcard_versions',
  'import_batches',
  'student_progress',
  'review_logs',
];

for (const table of tables) {
  await prisma.$executeRawUnsafe(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
}

const authAdmin = createClient(supabaseUrl, adminKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testUsers = [
  { email: 'admin@test.local', password: 'admin1', role: 'ADMIN', fullName: 'Test Admin' },
  { email: 'sv@test.local', password: 'sv1234', role: 'STUDENT', fullName: 'Test Student' },
];

const { data: listed, error: listError } = await authAdmin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) throw listError;

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
}

const profileCount = await prisma.profile.count();
await prisma.$disconnect();
console.log(`Bootstrap Auth complete: ${profileCount} profile(s).`);
