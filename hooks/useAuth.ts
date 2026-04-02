'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { ClientUser } from '@/lib/types'

interface UseAuthOptions {
  required?: boolean
  requiredPermission?: string
  adminOnly?: boolean
}

interface UseAuthReturn {
  user: ClientUser | null
  loading: boolean
  logout: () => Promise<void>
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { required = true, requiredPermission, adminOnly = false } = options
  const router = useRouter()
  const [user, setUser] = useState<ClientUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          if (required) router.push('/login')
          setLoading(false)
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data?.user) {
          if (adminOnly && data.user.role !== 'admin') {
            router.push('/dashboard')
            return
          }
          if (requiredPermission && !data.user.permissions?.[requiredPermission]) {
            router.push('/dashboard')
            return
          }
          setUser(data.user)
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('ユーザー取得エラー:', error)
        if (required) router.push('/login')
        setLoading(false)
      })
  }, [router, required, requiredPermission, adminOnly])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }, [router])

  return { user, loading, logout }
}
