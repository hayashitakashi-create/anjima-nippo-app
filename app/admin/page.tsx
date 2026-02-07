'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Building2,
  Shield,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  UserCog,
  CheckCircle,
  FileText,
} from 'lucide-react'

interface User {
  id: string
  name: string
  username: string
  position?: string
  role: string
  defaultReportType: string
}

interface ManagedUser extends User {
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sortField, setSortField] = useState<'name' | 'role'>('role')
  const [sortAsc, setSortAsc] = useState(true)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{
    role: string
    defaultReportType: string
    position: string
  }>({ role: '', defaultReportType: '', position: '' })

  // ログインユーザー取得 + 管理者チェック
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
          if (data.user.role !== 'admin') {
            router.push('/dashboard')
            return
          }
          setCurrentUser(data.user)
        }
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  // ユーザー一覧取得
  useEffect(() => {
    if (!currentUser) return

    fetchUsers()
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
      } else if (res.status === 403) {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('ユーザー一覧取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: ManagedUser) => {
    setEditingUser(user.id)
    setEditForm({
      role: user.role,
      defaultReportType: user.defaultReportType,
      position: user.position || '',
    })
    setMessage('')
    setError('')
  }

  const handleSave = async (userId: string) => {
    setSaving(userId)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          role: editForm.role,
          defaultReportType: editForm.defaultReportType,
          position: editForm.position || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, ...data.user } : u))
        )
        setEditingUser(null)
        setMessage('ユーザー情報を更新しました')
      } else {
        const data = await res.json()
        setError(data.error || '更新に失敗しました')
      }
    } catch {
      setError('更新に失敗しました')
    } finally {
      setSaving(null)
    }
  }

  const handleCancel = () => {
    setEditingUser(null)
  }

  const handleSort = (field: 'name' | 'role') => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const sortedUsers = [...users].sort((a, b) => {
    let cmp = 0
    if (sortField === 'role') {
      // admin を先に
      cmp = a.role === b.role ? 0 : a.role === 'admin' ? -1 : 1
      if (cmp === 0) cmp = a.name.localeCompare(b.name, 'ja')
    } else {
      cmp = a.name.localeCompare(b.name, 'ja')
    }
    return sortAsc ? cmp : -cmp
  })

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const userCount = users.filter(u => u.role === 'user').length

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
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">管理画面</h1>
                <p className="text-xs text-gray-500 hidden sm:block">システム管理</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link
                href="/dashboard"
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="TOP画面"
              >
                <Home className="h-5 w-5" />
              </Link>
              <Link
                href="/settings"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="設定"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="ログアウト"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {/* メッセージ */}
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 統計サマリ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">全ユーザー</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">管理者</p>
                <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
              </div>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">一般ユーザー</p>
                <p className="text-2xl font-bold text-gray-900">{userCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 管理メニュー */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
          <Link
            href="/admin/approvals"
            className="group bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md hover:border-purple-300 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">承認管理</p>
                <p className="text-xs text-gray-500">営業日報の承認・差戻し</p>
              </div>
            </div>
          </Link>
          <Link
            href="/nippo"
            className="group bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:shadow-md hover:border-purple-300 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">日報一覧</p>
                <p className="text-xs text-gray-500">すべての日報を確認</p>
              </div>
            </div>
          </Link>
        </div>

        {/* ユーザー一覧 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              ユーザー管理
            </h2>
          </div>

          {/* テーブル（PC） */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-slate-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>氏名</span>
                      {sortField === 'name' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ユーザー名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    役職
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>権限</span>
                      {sortField === 'role' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    デフォルト日報
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{user.username}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <input
                          type="text"
                          value={editForm.position}
                          onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                          placeholder="未設定"
                        />
                      ) : (
                        <span className="text-sm text-gray-600">{user.position || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          <option value="admin">管理者</option>
                          <option value="user">一般</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? '管理者' : '一般'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={editForm.defaultReportType}
                          onChange={e => setEditForm({ ...editForm, defaultReportType: e.target.value })}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          <option value="sales">営業日報</option>
                          <option value="work">作業日報</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.defaultReportType === 'sales'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.defaultReportType === 'sales' ? '営業日報' : '作業日報'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {editingUser === user.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleSave(user.id)}
                            disabled={saving === user.id}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            {saving === user.id ? '保存中...' : '保存'}
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit(user)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          編集
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* カードリスト（モバイル） */}
          <div className="md:hidden divide-y divide-slate-100">
            {sortedUsers.map(user => (
              <div key={user.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.username}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? '管理者' : '一般'}
                    </span>
                  </div>
                </div>

                {editingUser === user.id ? (
                  <div className="mt-3 space-y-3 bg-gray-50 rounded-lg p-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">役職</label>
                      <input
                        type="text"
                        value={editForm.position}
                        onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        placeholder="未設定"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">権限</label>
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="admin">管理者</option>
                        <option value="user">一般</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">デフォルト日報</label>
                      <select
                        value={editForm.defaultReportType}
                        onChange={e => setEditForm({ ...editForm, defaultReportType: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      >
                        <option value="sales">営業日報</option>
                        <option value="work">作業日報</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSave(user.id)}
                        disabled={saving === user.id}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {saving === user.id ? '保存中...' : '保存'}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {user.position || '役職未設定'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.defaultReportType === 'sales'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.defaultReportType === 'sales' ? '営業' : '作業'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100"
                    >
                      編集
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
