import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes - no auth required
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Redirect to login if not authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Trainer-only routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/games")) {
    if (token.role !== "TRAINER" && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/join", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
