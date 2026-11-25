import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    console.error("Supabase session verification failed:", error);
  }

  const authenticatedUser = error ? null : user;
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!authenticatedUser && !isLoginPage) {
    return redirectWithCookies(request, response, "/login");
  }

  if (authenticatedUser && isLoginPage) {
    return redirectWithCookies(request, response, "/");
  }

  return response;
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  destination: string
) {
  const url = request.nextUrl.clone();
  url.pathname = destination;
  url.search = "";

  const redirectResponse = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export const config = {
  matcher: ["/", "/login", "/riwayat/:path*", "/profil/:path*", "/admin/:path*"],
};
