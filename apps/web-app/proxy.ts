import { type NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  // Bypass auth check for our API auth routes AND the memwal-proxy
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/memwal-proxy")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;
  let isAuthenticated = false;
  let isOnboarded = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      isAuthenticated = true;
      isOnboarded = payload.isOnboarded as boolean;
    } catch {
      // invalid or expired token
    }
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isOnboardPage = pathname === "/onboard";

  // 1. Unauthenticated Users
  if (!isAuthenticated) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Authenticated but NOT Onboarded
  // 2. Authenticated but NOT Onboarded
  if (!isOnboarded) {
    // Allow access to the onboard page AND any API routes needed during onboarding
    if (isOnboardPage || pathname.startsWith("/api/")) {
      return NextResponse.next();
    }
    // Force redirect to onboard
    return NextResponse.redirect(new URL("/onboard", request.url));
  }

  // 3. Authenticated AND Onboarded
  if (isAuthPage || isOnboardPage) {
    // Prevent access to login/register/onboard pages once fully set up
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 4. Default Allow
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/chat/:id",
    "/onboard",
    "/api/:path*",
    "/login",
    "/register",
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
