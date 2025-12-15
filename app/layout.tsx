import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'cChic - Control de Caja Chica',
  description: 'Sistema de control de caja chica - Sistemas de Información Paez',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}

