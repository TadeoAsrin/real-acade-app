
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de Real Acade: Configurado para permitir acceso total.
 * La seguridad de escritura se maneja vía Firebase Auth + Firestore Rules.
 * Este archivo asegura que Next.js no fuerce redirecciones al Login.
 */
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// Opcional: Definir qué rutas NO deben ser procesadas por el middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
