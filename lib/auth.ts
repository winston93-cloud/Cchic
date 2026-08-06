import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'cchic_session'
const SESSION_HOURS = 8

/** Mismo acceso hardcodeado que Cheques (admin / admin123). */
const DEFAULT_USER = 'admin'
const DEFAULT_PASSWORD = 'admin123'

function secret(): string {
  return process.env.AUTH_SECRET || 'cchic-dev-auth-secret'
}

function firmar(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export interface Sesion {
  usuario: string
  exp: number
}

export function crearToken(usuario: string): string {
  const payload = Buffer.from(
    JSON.stringify({ usuario, exp: Date.now() + SESSION_HOURS * 3600_000 } satisfies Sesion)
  ).toString('base64url')
  return `${payload}.${firmar(payload)}`
}

export function verificarToken(token: string | undefined | null): Sesion | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const esperada = firmar(payload)
  const a = Buffer.from(sig)
  const b = Buffer.from(esperada)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const sesion = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Sesion
    if (!sesion.usuario || sesion.exp < Date.now()) return null
    return sesion
  } catch {
    return null
  }
}

/** Sesión actual desde la cookie (server components / route handlers). */
export async function obtenerSesion(): Promise<Sesion | null> {
  const jar = await cookies()
  return verificarToken(jar.get(SESSION_COOKIE)?.value)
}

export function credencialesValidas(usuario: string, password: string): boolean {
  const u = process.env.CCHIC_ADMIN_USER || process.env.CHEQUES_ADMIN_USER || DEFAULT_USER
  const p =
    process.env.CCHIC_ADMIN_PASSWORD || process.env.CHEQUES_ADMIN_PASSWORD || DEFAULT_PASSWORD
  return usuario.trim().toLowerCase() === u.toLowerCase() && password === p
}

export const SESSION_MAX_AGE = SESSION_HOURS * 3600
