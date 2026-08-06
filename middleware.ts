import { NextRequest, NextResponse } from 'next/server'

const COOKIE = 'cchic_session'
const PUBLICAS = ['/login', '/api/auth/login']

/**
 * Primera barrera: sin cookie de sesión no se entra (la firma HMAC se
 * verifica en servidor con `obtenerSesion`, aquí solo presencia).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const tieneCookie = Boolean(request.cookies.get(COOKIE)?.value)

  if (pathname.startsWith('/login')) {
    if (tieneCookie) {
      const destino = request.nextUrl.clone()
      destino.pathname = '/'
      destino.search = ''
      return NextResponse.redirect(destino)
    }
    return NextResponse.next()
  }

  if (PUBLICAS.some((p) => pathname.startsWith(p))) return NextResponse.next()

  if (tieneCookie) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }
  const destino = request.nextUrl.clone()
  destino.pathname = '/login'
  destino.search = ''
  return NextResponse.redirect(destino)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)'],
}
