import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { missingSupabaseVars, supabaseEnvMessage } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const missing = missingSupabaseVars(supabaseUrl, supabaseKey);
  if (missing.length > 0) {
    // Mensaje claro (solo nombres de variables) en vez de un "Internal Server Error" opaco.
    const message = supabaseEnvMessage(missing);
    console.error(`[proxy] ${message}`);
    return new NextResponse(message, { status: 500, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    supabaseUrl!,
    supabaseKey!,
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
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  // /ui/* (galería y previews con datos de ejemplo) solo es público con UI_PREVIEW=1 (local/capturas).
  const isPublicPath =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/auth") ||
    (process.env.UI_PREVIEW === "1" && pathname.startsWith("/ui"));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
