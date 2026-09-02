export const SUPABASE_URL =
  process.env.SUPABASE_ENG_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://wvcguntxwupmcojxexao.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ENG_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ENG_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_1q5Z9eX8cKtH2NGT_F6h0Q_OUqjkicU';
