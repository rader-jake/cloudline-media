import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Refreshes the Supabase auth session for /admin and redirects anonymous visitors to the login page.
// The admin allow-list (ADMIN_EMAILS) is enforced again in the admin layout and every admin API route.
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isLogin = req.nextUrl.pathname.startsWith("/admin/login");
  if (!url || !key) return isLogin ? NextResponse.next() : NextResponse.redirect(new URL("/admin/login", req.url));

  let res = NextResponse.next({ request: req });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user && !isLogin) return NextResponse.redirect(new URL("/admin/login", req.url));
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
