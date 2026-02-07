'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  Activity,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  X,
  FileText,
  FolderKanban,
  ClipboardList,
  Cog,
  UserPlus,
  UserX,
  Eye,
  EyeOff,
  Trash2,
  Edit,
} from 'lucide-react'

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  targetType: string
  targetId: string | null
  details: string | null
  ipAddress: string | null
  createdAt: string
}

interface User {
  id: string
  name: string
  role: string
}

// 相対時間を日本語で表示
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return `${diffSec}秒前`
  if (diffMin < 60) return `${diffMin}分前`
  if (diffHour < 24) return `${diffHour}時間前`
  if (diffDay < 7) return `${diffDay}日前`

  // 7日以上前は日付表示
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// アクションの日本語説明
function getActionDescription(action: string): string {
  const descriptions: Record<string, string> = {
    user_created: 'ユーザーを作成',
    user_updated: 'ユーザーを更新',
    user_deleted: 'ユーザーを削除',
    user_deactivated: 'アカウントを無効化',
    user_activated: 'アカウントを有効化',
    project_created: '案件を作成',
    project_updated: '案件を更新',
    project_deleted: '案件を削除',
    nippo_created: '営業日報を作成',
    nippo_deleted: '営業日報を削除',
    work_report_created: '作業日報を作成',
    work_report_deleted: '作業日報を削除',
    settings_updated: 'システム設定を更新',
  }
  return descriptions[action] || action
}

// アクションの色
function getActionColor(action: string): { bg: string; text: string; icon: any } {
  if (action.includes('created')) {
    return { bg: 'bg-green-100', text: 'text-green-700', icon: UserPlus }
  }
  if (action.includes('updated')) {
    return { bg: 'bg-blue-100', text: 'text-blue-700', icon: Edit }
  }
  if (action.includes('deleted')) {
    return { bg: 'bg-red-100', text: 'text-red-700', icon: Trash2 }
  }
  if (action.includes('deactivated')) {
    return { bg: 'bg-amber-100', text: 'text-amber-700', icon: EyeOff }
  }
  if (action.includes('activated')) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: Eye }
  }
  return { bg: 'bg-gray-100', text: 'text-gray-700', icon: Activity }
}

// ターゲットタイプのアイコン
function getTargetIcon(targetType: string) {
  switch (targetType) {
    case 'user':
      return User
    case 'project':
      return FolderKanban
    case 'nippo':
      return FileText
    case 'work_report':
      return ClipboardList
    case 'system':
      return Cog
    default:
      return Activity
  }
}

// ターゲットタイプの日本語名
function getTargetTypeName(targetType: string): string {
  const names: Record<string, string> = {
    user: 'ユーザー',
    project: '案件',
    nippo: '営業日報',
    work_report: '作業日報',
    system: 'システム',
  }
  return names[targetType] || targetType
}

export default function AuditLogPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // フィルタ
  const [filterTargetType, setFilterTargetType] = useState<string>('')
  const [filterDateFrom, setFilterDateFrom] = useState<string>('')
  const [filterDateTo, setFilterDateTo] = useState<string>('')

  // ページネーション
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

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
    fetchLogs()
  }, [currentUser, page, filterTargetType, filterDateFrom, filterDateTo])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (filterTargetType) params.append('targetType', filterTargetType)
      if (filterDateFrom) params.append('dateFrom', filterDateFrom)
      if (filterDateTo) params.append('dateTo', filterDateTo)

      const res = await fetch(`/api/admin/audit-log?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
        setTotal(data.pagination.total)
        setTotalPages(data.pagination.totalPages)
      } else if (res.status === 403) {
        router.push('/dashboard')
      } else {
        setError('操作ログの取得に失敗しました')
      }
    } catch (err) {
      console.error('操作ログ取得エラー:', err)
      setError('操作ログの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }
    catch (err) { console.error('ログアウトエラー:', err) }
  }

  const handleFilterReset = () => {
    setFilterTargetType('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setPage(1)
  }

  if (!currentUser) {
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
            <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">操作ログ</h1>
                <p className="text-xs text-gray-500 hidden sm:block">システム操作履歴</p>
              </div>
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link href="/dashboard" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="TOP画面">
                <Home className="h-5 w-5" />
              </Link>
              <Link href="/admin" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="管理画面">
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
        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* フィルタバー */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="w-5 h-5 text-purple-600" />
            <h2 className="text-sm font-bold text-gray-900">フィルタ</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">対象タイプ</label>
              <select
                value={filterTargetType}
                onChange={e => { setFilterTargetType(e.target.value); setPage(1) }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">全て</option>
                <option value="user">ユーザー</option>
                <option value="project">案件</option>
                <option value="nippo">営業日報</option>
                <option value="work_report">作業日報</option>
                <option value="system">システム</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">開始日</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={e => { setFilterDateFrom(e.target.value); setPage(1) }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">終了日</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={e => { setFilterDateTo(e.target.value); setPage(1) }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
          {(filterTargetType || filterDateFrom || filterDateTo) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleFilterReset}
                className="px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                フィルタをクリア
              </button>
            </div>
          )}
        </div>

        {/* 統計サマリ */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">
                全{total}件の操作ログ
              </span>
            </div>
            {totalPages > 1 && (
              <span className="text-sm text-gray-500">
                {page} / {totalPages} ページ
              </span>
            )}
          </div>
        </div>

        {/* ログリスト */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">読み込み中...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              操作ログがありません
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {logs.map(log => {
                const actionColor = getActionColor(log.action)
                const TargetIcon = getTargetIcon(log.targetType)
                const ActionIcon = actionColor.icon

                return (
                  <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      {/* アイコン */}
                      <div className={`w-10 h-10 rounded-lg ${actionColor.bg} flex items-center justify-center flex-shrink-0`}>
                        <ActionIcon className={`w-5 h-5 ${actionColor.text}`} />
                      </div>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* ユーザー名とアクション */}
                            <div className="flex items-center space-x-2 mb-1">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium text-gray-900">{log.userName}</span>
                              <span className="text-gray-500">が</span>
                              <span className={`font-medium ${actionColor.text}`}>
                                {getActionDescription(log.action)}
                              </span>
                            </div>

                            {/* ターゲット情報 */}
                            <div className="flex items-center space-x-2 mb-2">
                              <TargetIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600">
                                {getTargetTypeName(log.targetType)}
                                {log.targetId && (
                                  <span className="ml-1 text-xs text-gray-400 font-mono">
                                    (ID: {log.targetId.substring(0, 8)}...)
                                  </span>
                                )}
                              </span>
                            </div>

                            {/* 詳細情報 */}
                            {log.details && (
                              <details className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-2">
                                <summary className="cursor-pointer hover:text-gray-700">
                                  詳細を表示
                                </summary>
                                <pre className="mt-2 whitespace-pre-wrap break-all">
                                  {JSON.stringify(JSON.parse(log.details), null, 2)}
                                </pre>
                              </details>
                            )}

                            {/* IPアドレス */}
                            {log.ipAddress && (
                              <div className="text-xs text-gray-400 mt-1">
                                IP: {log.ipAddress}
                              </div>
                            )}
                          </div>

                          {/* 時刻 */}
                          <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            <span>{getRelativeTime(log.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-purple-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
