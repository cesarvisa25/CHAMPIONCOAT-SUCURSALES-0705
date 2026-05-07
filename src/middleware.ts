import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;
    const role = token?.role as string;

    // Empleado solo puede ir a checkin y sales
    if (role === "EMPLEADO") {
      if (
        pathname.startsWith("/admin") ||
        pathname.startsWith("/branches") ||
        pathname.startsWith("/employees") ||
        pathname.startsWith("/attendance") ||
        pathname.startsWith("/reports")
      ) {
        return NextResponse.redirect(new URL("/checkin", req.url));
      }
    }

    // Gerente no puede ver branches
    if (role === "GERENTE" && pathname.startsWith("/branches")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/branches/:path*",
    "/employees/:path*",
    "/attendance/:path*",
    "/sales/:path*",
    "/reports/:path*",
    "/checkin/:path*",
    "/checkin",
  ],
};
