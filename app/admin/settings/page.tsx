'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'

interface User {
  id: string
  name: string
  position?: string
  role: string
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
          // 管理者以外はアクセス不可
          if (data.user.role !== 'admin') {
            router.push('/dashboard')
            return
          }
          setCurrentUser(data.user)
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('ユーザー取得エラー:', error)
        router.push('/login')
      })
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理設定</h1>
          <p className="text-gray-600 mt-2">システムの管理と設定</p>
        </div>

        {/* カード */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 社員管理 */}
          <Link
            href="/users"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-purple-500"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  社員管理
                </h2>
                <p className="text-sm text-gray-500">
                  社員情報を管理します
                </p>
              </div>
            </div>
          </Link>

          {/* アカウント設定 */}
          <Link
            href="/settings"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-orange-500"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  アカウント設定
                </h2>
                <p className="text-sm text-gray-500">
                  自分のアカウント情報を変更します
                </p>
              </div>
            </div>
          </Link>

          {/* システム設定 */}
          <div className="block p-6 bg-gray-100 rounded-lg shadow border-2 border-gray-300 opacity-60">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-500">
                  システム設定
                </h2>
                <p className="text-sm text-gray-400">
                  準備中
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ログイン情報 */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ログイン情報
          </h3>
          {currentUser && (
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">氏名: </span>
                <span className="text-gray-900">{currentUser.name}</span>
                {currentUser.position && (
                  <span className="text-gray-600"> ({currentUser.position})</span>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-600">権限: </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  管理者
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
