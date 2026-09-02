export const dynamic='force-dynamic'; import { redirect } from 'next/navigation'; import { getProfile } from '@/lib/auth/queries';
export default async function Home(){const p=await getProfile(); redirect(p?'/dashboard':'/sign-in');}
