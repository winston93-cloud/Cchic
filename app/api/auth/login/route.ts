import { NextResponse } from 'next/server'
import { credencialesValidas, crearToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

export async function POST(request: Request) {
  let usuario = ''
  let password = ''
  try {
    const body = (await request.json()) as { usuario?: string; password?: string }
    usuario = body.usuario ?? ''
    password = body.password ?? ''
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  if (!credencialesValidas(usuario, password)) {
    return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, usuario: usuario.trim() })
  res.cookies.set(SESSION_COOKIE, crearToken(usuario.trim()), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}
