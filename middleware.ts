import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "sv_session";
const PUBLIC_PATHS = ["/login"];

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

async function sessaoValida(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const logado = await sessaoValida(token);

  // Usuário não logado tentando acessar rota privada -> manda pro login
  if (!isPublicPath && !logado) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário já logado tentando acessar /login -> manda pro menu
  if (isPublicPath && logado) {
    const menuUrl = new URL("/menu", request.url);
    return NextResponse.redirect(menuUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica o middleware em tudo, exceto:
     * - arquivos estáticos (_next/static, _next/image)
     * - favicon
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
