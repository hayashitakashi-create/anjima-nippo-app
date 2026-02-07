'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, LogOut, Building2, Shield } from 'lucide-react'

interface User {
  id: string
  name: string
  username: string
  position?: string
  role: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // ユーザー名変更用
  const [usernameForm, setUsernameForm] = useState({
    username: '',
  })

  // パスワード変更用
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // ログインユーザーを取得
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
          setCurrentUser(data.user)
          setUsernameForm({ username: data.user.username })
        }
      })
      .catch(error => {
        console.error('ユーザー取得エラー:', error)
        router.push('/login')
      })
  }, [router])

  // ユーザー名変更
  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usernameForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'ユーザー名の更新に失敗しました')
      }

      setMessage('ユーザー名を更新しました')
      setCurrentUser(data.user)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // パスワード変更
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'パスワードの変更に失敗しました')
      }

      setMessage('パスワードを変更しました')
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">設定</h1>
              </div>
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link
                href="/dashboard"
                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                title="TOP画面"
              >
                <Home className="h-5 w-5" />
              </Link>
              {currentUser?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="管理画面"
                >
                  <Shield className="h-5 w-5" />
                </Link>
              )}
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    router.push('/login')
                  } catch (error) {
                    console.error('ログアウトエラー:', error)
                  }
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="ログアウト"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* TOP画面に戻るボタン */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            TOP画面に戻る
          </Link>
        </div>

        {/* メッセージ表示 */}
        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* ユーザー情報表示 */}
        {currentUser && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ユーザー情報</h2>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">氏名: </span>
                <span className="text-gray-900">{currentUser.name}</span>
                {currentUser.position && (
                  <span className="text-gray-600"> ({currentUser.position})</span>
                )}
              </div>
              <div>
                <span className="text-sm text-gray-600">現在のユーザー名: </span>
                <span className="text-gray-900">{currentUser.username}</span>
              </div>
            </div>
          </div>
        )}

        {/* ユーザー名変更フォーム */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">ユーザー名変更</h2>
          <form onSubmit={handleUsernameUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しいユーザー名（メールアドレス）
              </label>
              <input
                type="email"
                value={usernameForm.username}
                onChange={(e) => setUsernameForm({ username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: t-yasujima@yasujimakougyou.co.jp"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '更新中...' : 'ユーザー名を更新'}
            </button>
          </form>
        </div>

        {/* パスワード変更フォーム */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">パスワード変更</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                現在のパスワード
              </label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード（8文字以上）
              </label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                新しいパスワード（確認）
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '変更中...' : 'パスワードを変更'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
