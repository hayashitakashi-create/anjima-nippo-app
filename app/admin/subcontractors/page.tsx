'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  Truck,
  Plus,
  Trash2,
  Save,
  X,
  ArrowLeft,
} from 'lucide-react'

interface User {
  id: string
  name: string
  role: string
}

interface Subcontractor {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function SubcontractorsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // 新規外注先追加フォーム
  const [newSubcontractor, setNewSubcontractor] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  // デフォルト外注先リスト
  const defaultSubcontractors = [
    'エルシー',
    'キョウワビルト工業',
    '森下塗装',
    '又川工業',
    '恒松塗装',
    '長岡塗装',
    '裏山工業',
    '塗裁工房',
    '鳥島工芸',
    '三和電工',
  ]

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
        if (data?.user) {
          if (data.user.role !== 'admin') {
            router.push('/dashboard')
            return
          }
          setCurrentUser(data.user)
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!currentUser) return
    fetchSubcontractors()
  }, [currentUser])

  // 初回ロード時にデフォルトデータがなければ自動登録
  useEffect(() => {
    if (subcontractors.length === 0 && !loading) {
      loadDefaultsAutomatically()
    }
  }, [subcontractors, loading])

  const loadDefaultsAutomatically = async () => {
    try {
      const res = await fetch('/api/admin/subcontractors/load-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subcontractors: defaultSubcontractors }),
      })
      if (res.ok) {
        await fetchSubcontractors()
      }
    } catch (err) {
      console.error('デフォルト外注先自動登録エラー:', err)
    }
  }

  const fetchSubcontractors = async () => {
    try {
      const res = await fetch('/api/admin/subcontractors')
      if (res.ok) {
        const data = await res.json()
        setSubcontractors(data.subcontractors)
      } else if (res.status === 403) {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('外注先一覧取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubcontractor = async () => {
    if (!newSubcontractor.trim()) {
      setError('外注先名を入力してください')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/subcontractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubcontractor }),
      })
      if (res.ok) {
        const data = await res.json()
        setSubcontractors(prev => [...prev, data.subcontractor])
        setNewSubcontractor('')
        setAddingNew(false)
        setMessage('外注先を追加しました')
      } else {
        const data = await res.json()
        setError(data.error || '追加に失敗しました')
      }
    } catch {
      setError('追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この外注先を削除しますか？')) return

    setError('')
    try {
      const res = await fetch(`/api/admin/subcontractors?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSubcontractors(prev => prev.filter(s => s.id !== id))
        setMessage('外注先を削除しました')
      } else {
        const data = await res.json()
        setError(data.error || '削除に失敗しました')
      }
    } catch {
      setError('削除に失敗しました')
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setError('')
    try {
      const res = await fetch('/api/admin/subcontractors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      if (res.ok) {
        setSubcontractors(prev =>
          prev.map(s => (s.id === id ? { ...s, isActive: !currentActive } : s))
        )
        setMessage(currentActive ? '外注先を無効化しました' : '外注先を有効化しました')
      } else {
        const data = await res.json()
        setError(data.error || '更新に失敗しました')
      }
    } catch {
      setError('更新に失敗しました')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
  }

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">外注先管理</h1>
                <p className="text-xs text-gray-500 hidden sm:block">外注先マスタの登録・管理</p>
              </div>
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link href="/admin" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="管理画面">
                <Shield className="h-5 w-5" />
              </Link>
              <Link href="/dashboard" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="TOP画面">
                <Home className="h-5 w-5" />
              </Link>
              <Link href="/settings" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="設定">
                <Settings className="h-5 w-5" />
              </Link>
              <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ログアウト">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            管理画面に戻る
          </Link>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 外注先リスト */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-indigo-600" />
              外注先リスト ({subcontractors.length}件)
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setAddingNew(!addingNew)
                  setNewSubcontractor('')
                  setError('')
                }}
                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                新規追加
              </button>
            </div>
          </div>

          {/* 新規追加フォーム */}
          {addingNew && (
            <div className="px-4 sm:px-6 py-4 bg-indigo-50 border-b border-indigo-200">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    外注先名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSubcontractor}
                    onChange={e => setNewSubcontractor(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="例: エルシー"
                  />
                </div>
                <button
                  onClick={() => {
                    setAddingNew(false)
                    setNewSubcontractor('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddSubcontractor}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}

          {/* テーブル */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">外注先名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subcontractors.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">外注先が登録されていません</p>
                      <p className="text-sm text-gray-400">「新規追加」または「デフォルトを読み込む」から登録してください</p>
                    </td>
                  </tr>
                ) : (
                  subcontractors.map(subcontractor => (
                    <tr
                      key={subcontractor.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        !subcontractor.isActive ? 'opacity-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{subcontractor.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            subcontractor.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subcontractor.isActive ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleToggleActive(subcontractor.id, subcontractor.isActive)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                              subcontractor.isActive
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {subcontractor.isActive ? '無効化' : '有効化'}
                          </button>
                          <button
                            onClick={() => handleDelete(subcontractor.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
