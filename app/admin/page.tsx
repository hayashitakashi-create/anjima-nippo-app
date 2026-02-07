'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  Users,
  ChevronDown,
  ChevronUp,
  Save,
  UserCog,
  CheckCircle,
  FileText,
  UserPlus,
  Trash2,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  FolderKanban,
  ClipboardList,
  Activity,
  Package,
  Truck,
  Layers,
  Printer,
  BarChart3,
  Ruler,
} from 'lucide-react'

interface User {
  id: string
  name: string
  username: string
  position?: string
  role: string
  isActive?: boolean
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

  // 新規作成モーダル
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    password: '',
    position: '',
    role: 'user',
    defaultReportType: 'work',
  })
  const [creating, setCreating] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // 削除確認
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 無効化確認
  const [deactivateTarget, setDeactivateTarget] = useState<ManagedUser | null>(null)

  // フィルタ
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')

  // 役職リスト
  const [positionOptions, setPositionOptions] = useState<string[]>([
    '会長', '社長', '副社長', '専務', '常務', '取締役', '部長', '次長', '課長', '係長', '主任'
  ])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => {
        if (data?.user) {
          if (data.user.role !== 'admin') { router.push('/dashboard'); return }
          setCurrentUser(data.user)
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!currentUser) return
    fetchUsers()
    fetchPositionOptions()
  }, [currentUser])

  const fetchPositionOptions = async () => {
    try {
      const res = await fetch('/api/admin/system-settings?key=approval_roles')
      if (res.ok) {
        const data = await res.json()
        if (data.settings?.approval_roles && Array.isArray(data.settings.approval_roles)) {
          setPositionOptions(data.settings.approval_roles)
        }
      }
    } catch (err) {
      console.error('役職リスト取得エラー:', err)
    }
  }

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
        setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...data.user } : u)))
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

  const handleCancel = () => setEditingUser(null)

  const handleSort = (field: 'name' | 'role') => {
    if (sortField === field) { setSortAsc(!sortAsc) }
    else { setSortField(field); setSortAsc(true) }
  }

  // 新規作成
  const handleCreate = async () => {
    if (!createForm.name || !createForm.username || !createForm.password) {
      setError('氏名、ユーザー名、パスワードは必須です')
      return
    }
    if (createForm.password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }

    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(prev => [...prev, data.user])
        setShowCreateModal(false)
        setCreateForm({ name: '', username: '', password: '', position: '', role: 'user', defaultReportType: 'work' })
        setMessage('ユーザーを作成しました')
      } else {
        const data = await res.json()
        setError(data.error || '作成に失敗しました')
      }
    } catch {
      setError('作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  // 削除
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users?userId=${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
        setDeleteTarget(null)
        setMessage('ユーザーを削除しました')
      } else {
        const data = await res.json()
        setError(data.error || '削除に失敗しました')
        setDeleteTarget(null)
      }
    } catch {
      setError('削除に失敗しました')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // 無効化/有効化
  const handleToggleActive = async (user: ManagedUser) => {
    const newIsActive = !(user.isActive !== false)
    setError('')
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isActive: newIsActive }),
      })
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newIsActive } : u))
        setDeactivateTarget(null)
        setMessage(newIsActive ? 'アカウントを有効化しました' : 'アカウントを無効化しました')
      } else {
        const data = await res.json()
        setError(data.error || '更新に失敗しました')
      }
    } catch {
      setError('更新に失敗しました')
    }
  }

  const filteredUsers = users.filter(u => {
    if (filterActive === 'active') return u.isActive !== false
    if (filterActive === 'inactive') return u.isActive === false
    return true
  })

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let cmp = 0
    if (sortField === 'role') {
      cmp = a.role === b.role ? 0 : a.role === 'admin' ? -1 : 1
      if (cmp === 0) cmp = a.name.localeCompare(b.name, 'ja')
    } else {
      cmp = a.name.localeCompare(b.name, 'ja')
    }
    return sortAsc ? cmp : -cmp
  })

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }
    catch (err) { console.error('ログアウトエラー:', err) }
  }

  const adminCount = users.filter(u => u.role === 'admin').length
  const userCount = users.filter(u => u.role === 'user').length
  const activeCount = users.filter(u => u.isActive !== false).length
  const inactiveCount = users.filter(u => u.isActive === false).length

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
              <Link href="/dashboard" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="TOP画面">
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
        {/* メッセージ */}
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-green-500 hover:text-green-700"><X className="w-4 h-4" /></button>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* 統計サマリ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">有効</p>
                <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">無効</p>
                <p className="text-2xl font-bold text-gray-900">{inactiveCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 管理メニュー */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <Link href="/admin/approvals" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">承認管理</p>
                <p className="text-xs text-gray-500 hidden sm:block">日報の承認・差戻し</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/projects" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <FolderKanban className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">案件管理</p>
                <p className="text-xs text-gray-500 hidden sm:block">案件の一覧・管理</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/project-types" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Layers className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">工事種別</p>
                <p className="text-xs text-gray-500 hidden sm:block">工事種別マスタ</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/materials" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                <Package className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">使用材料</p>
                <p className="text-xs text-gray-500 hidden sm:block">材料マスタ管理</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/subcontractors" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">外注先</p>
                <p className="text-xs text-gray-500 hidden sm:block">外注先マスタ管理</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/audit-log" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                <Activity className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">操作ログ</p>
                <p className="text-xs text-gray-500 hidden sm:block">システム操作履歴</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/system-settings" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">システム設定</p>
                <p className="text-xs text-gray-500 hidden sm:block">各種設定</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/bulk-print" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                <Printer className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">一括印刷</p>
                <p className="text-xs text-gray-500 hidden sm:block">日報を一括印刷</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/aggregation" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                <BarChart3 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">月次集計</p>
                <p className="text-xs text-gray-500 hidden sm:block">労働・材料・外注</p>
              </div>
            </div>
          </Link>
          <Link href="/admin/units" className="group bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center group-hover:bg-violet-200 transition-colors">
                <Ruler className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors">単位設定</p>
                <p className="text-xs text-gray-500 hidden sm:block">単位マスタ管理</p>
              </div>
            </div>
          </Link>
        </div>

        {/* ユーザー管理 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              ユーザー管理
            </h2>
            <div className="flex items-center space-x-2">
              {/* フィルタ */}
              <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
                {(['all', 'active', 'inactive'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterActive(f)}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      filterActive === f ? 'bg-white shadow text-purple-700 font-medium' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {f === 'all' ? '全て' : f === 'active' ? '有効' : '無効'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setShowCreateModal(true); setError(''); setMessage('') }}
                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="w-4 h-4 mr-1" />
                新規作成
              </button>
            </div>
          </div>

          {/* テーブル（PC） */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center space-x-1">
                      <span>氏名</span>
                      {sortField === 'name' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">役職</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100" onClick={() => handleSort('role')}>
                    <div className="flex items-center space-x-1">
                      <span>権限</span>
                      {sortField === 'role' && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日報</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状態</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedUsers.map(user => (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.isActive === false ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{user.username}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none">
                          <option value="">未設定</option>
                          {positionOptions.map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-600">{user.position || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none">
                          <option value="admin">管理者</option>
                          <option value="user">一般</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role === 'admin' ? '管理者' : '一般'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select value={editForm.defaultReportType} onChange={e => setEditForm({ ...editForm, defaultReportType: e.target.value })}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none">
                          <option value="sales">営業日報</option>
                          <option value="work">作業日報</option>
                          <option value="both">両方</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.defaultReportType === 'sales' ? 'bg-emerald-100 text-emerald-800' : user.defaultReportType === 'both' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.defaultReportType === 'sales' ? '営業' : user.defaultReportType === 'both' ? '両方' : '作業'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive !== false ? '有効' : '無効'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {editingUser === user.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => handleSave(user.id)} disabled={saving === user.id}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400">
                            <Save className="w-3 h-3 mr-1" />{saving === user.id ? '保存中...' : '保存'}
                          </button>
                          <button onClick={handleCancel} className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">取消</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-1">
                          <button onClick={() => handleEdit(user)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="編集">
                            <FileText className="w-4 h-4" />
                          </button>
                          {user.id !== currentUser.id && (
                            <>
                              <button onClick={() => {
                                if (user.isActive !== false) setDeactivateTarget(user)
                                else handleToggleActive(user)
                              }}
                                className={`p-1.5 rounded-lg transition-colors ${user.isActive !== false ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                                title={user.isActive !== false ? '無効化' : '有効化'}>
                                {user.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                              <button onClick={() => setDeleteTarget(user)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="削除">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
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
              <div key={user.id} className={`p-4 ${user.isActive === false ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.username}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive !== false ? '有効' : '無効'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? '管理者' : '一般'}
                    </span>
                  </div>
                </div>

                {editingUser === user.id ? (
                  <div className="mt-3 space-y-3 bg-gray-50 rounded-lg p-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">役職</label>
                      <select value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none">
                        <option value="">未設定</option>
                        {positionOptions.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">権限</label>
                      <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none">
                        <option value="admin">管理者</option>
                        <option value="user">一般</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">デフォルト日報</label>
                      <select value={editForm.defaultReportType} onChange={e => setEditForm({ ...editForm, defaultReportType: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none">
                        <option value="sales">営業日報</option>
                        <option value="work">作業日報</option>
                        <option value="both">両方</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleSave(user.id)} disabled={saving === user.id}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400">
                        <Save className="w-4 h-4 mr-1" />{saving === user.id ? '保存中...' : '保存'}
                      </button>
                      <button onClick={handleCancel} className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300">取消</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{user.position || '役職未設定'}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.defaultReportType === 'sales' ? 'bg-emerald-100 text-emerald-800' : user.defaultReportType === 'both' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.defaultReportType === 'sales' ? '営業' : user.defaultReportType === 'both' ? '両方' : '作業'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button onClick={() => handleEdit(user)} className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100">編集</button>
                      {user.id !== currentUser.id && (
                        <>
                          <button onClick={() => user.isActive !== false ? setDeactivateTarget(user) : handleToggleActive(user)}
                            className={`p-1.5 rounded-lg ${user.isActive !== false ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}>
                            {user.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setDeleteTarget(user)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 新規作成モーダル */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <UserPlus className="w-5 h-5 mr-2 text-purple-600" />新規ユーザー作成
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">氏名 <span className="text-red-500">*</span></label>
                <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="山田 太郎" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名（メールアドレス） <span className="text-red-500">*</span></label>
                <input type="text" value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="yamada@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">パスワード <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" placeholder="8文字以上" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">8文字以上で設定してください</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">役職</label>
                <select value={createForm.position} onChange={e => setCreateForm({ ...createForm, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                  <option value="">未設定</option>
                  {positionOptions.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">権限</label>
                  <select value={createForm.role} onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    <option value="user">一般ユーザー</option>
                    <option value="admin">管理者</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">デフォルト日報</label>
                  <select value={createForm.defaultReportType} onChange={e => setCreateForm({ ...createForm, defaultReportType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none">
                    <option value="work">作業日報</option>
                    <option value="sales">営業日報</option>
                    <option value="both">両方</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">キャンセル</button>
              <button onClick={handleCreate} disabled={creating}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400">
                {creating ? '作成中...' : '作成する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">ユーザー削除</h3>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{deleteTarget.name}</span> を本当に削除しますか？
              </p>
              <p className="text-xs text-red-600 mt-2">この操作は取り消せません。日報が紐づいている場合は削除できません。</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">キャンセル</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400">
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 無効化確認モーダル */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">アカウント無効化</h3>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{deactivateTarget.name}</span> のアカウントを無効化しますか？
              </p>
              <p className="text-xs text-gray-500 mt-2">無効化されたユーザーはログインできなくなります。後で有効化に戻すことも可能です。</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setDeactivateTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">キャンセル</button>
              <button onClick={() => handleToggleActive(deactivateTarget)}
                className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                無効化する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
