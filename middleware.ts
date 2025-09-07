import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyJwtToken } from "@/app/utils/auth";
import type { NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register"];

const isAuthPage = (url: string) =>
    AUTH_PAGES.some((page) => page.startsWith(url));

export async function middleware(request: NextRequest) {
    const { nextUrl, cookies, url } = request;
    const pathname = nextUrl.pathname;

    // next-auth token (for role-based auth like /admin)
    const session = await getToken({ req: request });

    // manually verified JWT (for token in cookie named 'token')
    const { value: token } = cookies.get("token") ?? { value: null };
    const hasVerifiedToken = token && (await verifyJwtToken(token));

    const isAuthPageRequested = isAuthPage(pathname);
    const isAdminPage = pathname.startsWith("/admin");
    const isCourierPage = pathname.startsWith("/courier");

    // If visiting login/register but already authenticated
    if (isAuthPageRequested) {
        if (!hasVerifiedToken) {
            const response = NextResponse.next();
            response.cookies.delete("token");
            return response;
        }
        return NextResponse.redirect(new URL("/", url));
    }

    // If admin route but not logged in or not admin
    if (isAdminPage) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", url));
        }

        if (session.role !== "admin") {
            return NextResponse.redirect(new URL("/", url));
        }
    }

    // If courier route but not logged in or not courier
    if (isCourierPage) {
        if (!session) {
            return NextResponse.redirect(new URL("/login", url));
        }

        if (session.role !== "courier") {
            return NextResponse.redirect(new URL("/", url));
        }
    }

    // If trying to access protected panel but not authenticated
    if (pathname.startsWith("/panel")) {
        if (!hasVerifiedToken) {
            const searchParams = new URLSearchParams(nextUrl.searchParams);
            searchParams.set("next", nextUrl.pathname);

            const response = NextResponse.redirect(
                new URL(`/login?${searchParams}`, url)
            );
            response.cookies.delete("token");
            return response;
        }
    }

    return NextResponse.next();
}

// Match all routes that need auth
export const config = {
    matcher: [
        "/login",
        "/register",
        "/panel/:path*",
        "/admin/:path*",
        "/api/admin/:path*",
        "/courier/:path*",
    ],
};
