import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.SEED_TEACHER_EMAIL;
  const password = process.env.SEED_TEACHER_PASSWORD;
  if (!url || !key || !email || !password) throw new Error('Missing seed env vars');

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;

  let profile = null;
  for (let i = 0; i < 12 && !profile; i += 1) {
    profile = await prisma.profile.findUnique({ where: { id: data.user.id } });
    if (!profile) await sleep(500);
  }
  if (!profile) throw new Error('Profile trigger not ready');

  await prisma.profile.update({
    where: { id: data.user.id },
    data: { role: 'TEACHER' },
  });
  console.log(`Teacher created: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
