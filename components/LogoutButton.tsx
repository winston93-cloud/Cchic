'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  async function cerrarSesion() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    router.replace('/login')
    router.refresh()
  }

  return (
    <button type="button" className="logout-btn" onClick={cerrarSesion}>
      Cerrar sesión
    </button>
  )
}
