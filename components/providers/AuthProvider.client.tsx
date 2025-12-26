'use client'

import { AuthProvider } from '@/hooks/useAuth'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster richColors position="top-center" />
    </AuthProvider>
  )
}
