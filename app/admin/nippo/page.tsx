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
  defaultReportType: string
}

export default function AdminNippoPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<'sales' | 'work'>('work')

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
          // デフォルトの日報タイプを設定
          setReportType(data.user.defaultReportType === 'sales' ? 'sales' : 'work')
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

  const reportTypeName = reportType === 'sales' ? '営業日報' : '作業日報'

  return (
    <AdminLayout>
      <div className="p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{reportTypeName}</h1>
              <p className="text-gray-600 mt-2">日報の作成・閲覧・管理</p>
            </div>
            {/* 日報タイプ切り替えボタン */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setReportType('sales')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === 'sales'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                営業日報
              </button>
              <button
                onClick={() => setReportType('work')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  reportType === 'work'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                作業日報
              </button>
            </div>
          </div>
        </div>

        {/* カード */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 新規日報作成 */}
          <Link
            href="/nippo-improved"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  新規日報作成
                </h2>
                <p className="text-sm text-gray-500">
                  新しい{reportTypeName}を作成します
                </p>
              </div>
            </div>
          </Link>

          {/* 日報一覧 */}
          <Link
            href="/nippo"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-500"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  日報一覧
                </h2>
                <p className="text-sm text-gray-500">
                  過去の{reportTypeName}を閲覧・編集します
                </p>
              </div>
            </div>
          </Link>

          {/* 承認待ち */}
          <Link
            href="/nippo/pending"
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  承認待ち
                </h2>
                <p className="text-sm text-gray-500">
                  承認が必要な日報を確認します
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* システム情報 */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ユーザー情報
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
