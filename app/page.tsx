'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // ログイン状態とroleを確認してリダイレクト
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data && data.user) {
          if (data.user.role === 'admin') {
            router.push('/admin/nippo')
          } else {
            router.push('/dashboard')
          }
        }
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-600">読み込み中...</div>
    </div>
  )
}
