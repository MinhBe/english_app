import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const signInUrl = new URL('/sign-in', request.url);

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase public environment variables in proxy.');
    return NextResponse.redirect(signInUrl);
  }

  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
