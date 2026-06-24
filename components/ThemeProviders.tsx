'use client'

import { ThemeProvider } from '@/contexts/ThemeContext'
import type { ReactNode } from 'react'

export default function ThemeProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
