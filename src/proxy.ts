import { NextResponse } from "next/server";

const publicPaths = ["/", "/login", "/register", "/api/auth"];

export function proxy(request: Request) {
  const { pathname } = new URL(request.url);

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isPublic) {
    return NextResponse.next();
  }

  // API 라우트가 아닌 경우만 리다이렉트 (API는 각 라우트에서 401 반환)
  if (!pathname.startsWith("/api/")) {
    const token =
      (request as unknown as { cookies: { get: (name: string) => { value: string } | undefined } })
        .cookies?.get("authjs.session-token")?.value ||
      (request as unknown as { cookies: { get: (name: string) => { value: string } | undefined } })
        .cookies?.get("__Secure-authjs.session-token")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
