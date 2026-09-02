import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  const signInUrl = new URL('/sign-in', request.url);
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (items) => {
            items.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            items.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const { data: claimsData } = await supabase.auth.getClaims();

    if (!claimsData?.claims) {
      return NextResponse.redirect(signInUrl);
    }

    return response;
  } catch (error) {
    console.error('Proxy auth check failed:', error);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/teacher/:path*', '/student/:path*', '/settings/:path*'],
};
