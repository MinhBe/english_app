import 'server-only';
import { createClient } from '@supabase/supabase-js';

function findIntegrationPrefix() {
  for (const suffix of ['_SUPABASE_SERVICE_ROLE_KEY', '_SUPABASE_SECRET_KEY']) {
    const entry = Object.entries(process.env).find(
      ([key, value]) => key.endsWith(suffix) && Boolean(value),
    );
    if (entry) return entry[0].slice(0, -suffix.length);
  }
  return null;
}

export function createAdminClient() {
  const prefix = findIntegrationPrefix();
  const url =
    (prefix && process.env[`${prefix}_SUPABASE_URL`]) ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    (prefix &&
      (process.env[`${prefix}_SUPABASE_SERVICE_ROLE_KEY`] ||
        process.env[`${prefix}_SUPABASE_SECRET_KEY`])) ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error('Supabase admin environment variables are missing.');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
