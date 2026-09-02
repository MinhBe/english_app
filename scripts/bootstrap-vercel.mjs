import { execFileSync } from 'node:child_process';

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

if (!databaseUrl || !directUrl) {
  throw new Error('No Postgres connection was found in Vercel environment variables.');
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

console.log('Bootstrap DB complete.');
