import { execFileSync } from 'node:child_process';

function firstEnvEndingWith(suffix) {
  const entry = Object.entries(process.env).find(
    ([key, value]) => key.endsWith(suffix) && Boolean(value),
  );
  return entry?.[1];
}

const databaseUrl =
  firstEnvEndingWith('_POSTGRES_PRISMA_URL') ||
  firstEnvEndingWith('_POSTGRES_URL') ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

const directUrl =
  firstEnvEndingWith('_POSTGRES_URL_NON_POOLING') ||
  process.env.DIRECT_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  databaseUrl;

const env = { ...process.env };
if (databaseUrl) env.DATABASE_URL = databaseUrl;
if (directUrl) env.DIRECT_URL = directUrl;

execFileSync('npx', ['prisma', 'generate'], {
  stdio: 'inherit',
  env,
});
