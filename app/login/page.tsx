'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setError(data?.error ?? 'No se pudo iniciar sesión.')
        return
      }
      router.replace('/')
      router.refresh()
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login-escena">
      <form className="login-caja" onSubmit={entrar}>
        <div className="login-sello" aria-hidden>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
            <rect x="3" y="2" width="18" height="4" rx="1" />
          </svg>
        </div>
        <h1 className="login-titulo">Monitoreo y Control</h1>
        <p className="login-sub">Instituto Winston Churchill · acceso administrativo</p>

        <label className="login-campo">
          <span>Usuario</span>
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            autoComplete="username"
            required
            autoFocus
          />
        </label>

        <label className="login-campo">
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <button type="submit" className="login-boton" disabled={enviando}>
          {enviando ? 'Validando…' : 'Ingresar'}
        </button>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <p className="login-version">Mismo acceso que Cheques · Caja chica</p>
      </form>
    </main>
  )
}
