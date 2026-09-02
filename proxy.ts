import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
export async function proxy(request: NextRequest) {
  let response=NextResponse.next({request});
  const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{
    getAll:()=>request.cookies.getAll(),
    setAll:(items)=>{items.forEach(({name,value})=>request.cookies.set(name,value)); response=NextResponse.next({request}); items.forEach(({name,value,options})=>response.cookies.set(name,value,options));}
  }});
  const { data: claimsData } = await supabase.auth.getClaims();
  const protectedPath=['/dashboard','/teacher','/student','/settings'].some(p=>request.nextUrl.pathname.startsWith(p));
  if(protectedPath && !claimsData?.claims) return NextResponse.redirect(new URL('/sign-in',request.url));
  return response;
}
export const config={matcher:['/dashboard/:path*','/teacher/:path*','/student/:path*','/settings/:path*']};
