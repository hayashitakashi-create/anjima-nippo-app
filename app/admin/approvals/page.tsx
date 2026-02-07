'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  CheckCheck,
  Undo2,
  User,
  Calendar,
  Route,
  Search,
  Users,
  X,
  CheckSquare,
  Square,
} from 'lucide-react'

interface Approval {
  id: string
  approverRole: string
  approverUserId?: string
  approvedAt?: string
  status: string
  approver?: {
    id: string
    name: string
    position?: string
  }
}

interface VisitRecord {
  id: string
  destination: string
  contactPerson?: string
  startTime?: string
  endTime?: string
  content?: string
  expense?: number
}

interface DailyReport {
  id: string
  date: string
  specialNotes?: string
  user: {
    id: string
    name: string
    position?: string
  }
  visitRecords: VisitRecord[]
  approvals: Approval[]
  approvalRoute?: {
    id: string
    name: string
  } | null
}

interface CurrentUser {
  id: string
  name: string
  role: string
}

interface ManagedUser {
  id: string
  name: string
  username: string
  position?: string
  role: string
  isActive?: boolean
}

interface SubmissionStatus {
  users: { id: string; name: string; position?: string }[]
  year: number
  month: number
  periodStart: string // YYYY-MM-DD形式
  periodEnd: string   // YYYY-MM-DD形式
  submissionMap: Record<string, Record<string, boolean>>
}

// 日報の総合ステータスを判定
function getReportStatus(approvals: Approval[]): 'pending' | 'approved' | 'rejected' | 'partial' {
  if (approvals.length === 0) return 'pending'
  const hasRejected = approvals.some(a => a.status === 'rejected')
  if (hasRejected) return 'rejected'
  const allApproved = approvals.every(a => a.status === 'approved')
  if (allApproved) return 'approved'
  const hasSomeApproved = approvals.some(a => a.status === 'approved')
  if (hasSomeApproved) return 'partial'
  return 'pending'
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'approved': return '承認済み'
    case 'rejected': return '差戻し'
    case 'partial': return '一部承認'
    case 'pending': return '承認待ち'
    default: return status
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'partial':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'pending':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'approved': return <CheckCircle className="w-4 h-4" />
    case 'rejected': return <XCircle className="w-4 h-4" />
    case 'partial': return <Clock className="w-4 h-4" />
    case 'pending': return <Clock className="w-4 h-4" />
    default: return <Clock className="w-4 h-4" />
  }
}

export default function ApprovalsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [reports, setReports] = useState<DailyReport[]>([])
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarOffset, setCalendarOffset] = useState(0) // 0: 今期, -1: 前期, -2: 前々期...

  // 絞り込み条件
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // チェックボックス
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set())

  // ユーザー情報取得 + 管理者チェック
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => {
        if (data && data.user) {
          if (data.user.role !== 'admin') { router.push('/dashboard'); return }
          setCurrentUser(data.user)
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  // ユーザー一覧取得
  useEffect(() => {
    if (!currentUser) return
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (data.users) {
          setUsers(data.users.filter((u: ManagedUser) => u.isActive !== false))
        }
      })
      .catch(err => console.error('ユーザー一覧取得エラー:', err))
  }, [currentUser])

  // 日報一覧取得
  useEffect(() => {
    if (!currentUser) return
    fetchReports()
  }, [currentUser, filter])

  // カレンダー期間変更時に再取得
  useEffect(() => {
    if (!currentUser) return
    fetchCalendarData()
  }, [currentUser, calendarOffset])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/approvals?status=${filter}&includeSubmissionStatus=true&calendarOffset=${calendarOffset}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports)
        if (data.submissionStatus) {
          setSubmissionStatus(data.submissionStatus)
        }
      }
    } catch (err) {
      console.error('承認一覧取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  // カレンダーデータのみ取得（期間切り替え時）
  const fetchCalendarData = async () => {
    try {
      const res = await fetch(`/api/admin/approvals?status=all&includeSubmissionStatus=true&calendarOffset=${calendarOffset}`)
      if (res.ok) {
        const data = await res.json()
        if (data.submissionStatus) {
          setSubmissionStatus(data.submissionStatus)
        }
      }
    } catch (err) {
      console.error('カレンダーデータ取得エラー:', err)
    }
  }

  // 絞り込み適用
  const filteredReports = useMemo(() => {
    let result = reports

    // ユーザーIDで絞り込み
    if (selectedUserId) {
      result = result.filter(r => r.user.id === selectedUserId)
    }

    // 役職（権限）で絞り込み
    if (selectedRole) {
      result = result.filter(r => r.user.position === selectedRole)
    }

    // 期間で絞り込み
    if (startDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      result = result.filter(r => new Date(r.date) >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      result = result.filter(r => new Date(r.date) <= end)
    }

    return result
  }, [reports, selectedUserId, selectedRole, startDate, endDate])

  // 承認待ちの日報のみを取得
  const pendingReports = useMemo(() => {
    return filteredReports.filter(r => {
      const status = getReportStatus(r.approvals)
      return status === 'pending' || status === 'partial'
    })
  }, [filteredReports])

  // 全選択/全解除
  const handleSelectAll = () => {
    if (selectedReportIds.size === pendingReports.length) {
      setSelectedReportIds(new Set())
    } else {
      setSelectedReportIds(new Set(pendingReports.map(r => r.id)))
    }
  }

  // 個別選択
  const handleToggleSelect = (reportId: string) => {
    const newSet = new Set(selectedReportIds)
    if (newSet.has(reportId)) {
      newSet.delete(reportId)
    } else {
      newSet.add(reportId)
    }
    setSelectedReportIds(newSet)
  }

  // 一括承認（選択した複数日報）
  const handleBulkApprove = async () => {
    if (selectedReportIds.size === 0) {
      alert('承認する日報を選択してください')
      return
    }
    if (!confirm(`選択した${selectedReportIds.size}件の日報を承認しますか？`)) return

    setProcessing('bulk')
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportIds: Array.from(selectedReportIds),
          action: 'bulk_approve'
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        setSelectedReportIds(new Set())
        fetchReports() // 再取得
      } else {
        setError(data.error || '承認に失敗しました')
      }
    } catch {
      setError('承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  // 一括差戻し（選択した複数日報）
  const handleBulkReject = async () => {
    if (selectedReportIds.size === 0) {
      alert('差戻しする日報を選択してください')
      return
    }
    if (!confirm(`選択した${selectedReportIds.size}件の日報を差戻ししますか？`)) return

    setProcessing('bulk')
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportIds: Array.from(selectedReportIds),
          action: 'bulk_reject'
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        setSelectedReportIds(new Set())
        fetchReports() // 再取得
      } else {
        setError(data.error || '差戻しに失敗しました')
      }
    } catch {
      setError('差戻しに失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  // 一括承認（単一日報）
  const handleApproveAll = async (reportId: string) => {
    setProcessing(reportId)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action: 'approve_all' }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        // ローカル更新
        setReports(prev => prev.map(r => {
          if (r.id === reportId && data.report) {
            return { ...r, approvals: data.report.approvals }
          }
          return r
        }))
      } else {
        setError(data.error || '承認に失敗しました')
      }
    } catch {
      setError('承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  // 一括差戻し（単一日報）
  const handleRejectAll = async (reportId: string) => {
    if (!confirm('この日報を差戻ししますか？')) return
    setProcessing(reportId)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action: 'reject_all' }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        setReports(prev => prev.map(r => {
          if (r.id === reportId && data.report) {
            return { ...r, approvals: data.report.approvals }
          }
          return r
        }))
      } else {
        setError(data.error || '差戻しに失敗しました')
      }
    } catch {
      setError('差戻しに失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  // 個別承認
  const handleApprove = async (approvalId: string, reportId: string) => {
    setProcessing(approvalId)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId, action: 'approve' }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        setReports(prev => prev.map(r => {
          if (r.id === reportId) {
            return {
              ...r,
              approvals: r.approvals.map(a =>
                a.id === approvalId ? data.approval : a
              ),
            }
          }
          return r
        }))
      } else {
        setError(data.error || '承認に失敗しました')
      }
    } catch {
      setError('承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  // 個別差戻し
  const handleReject = async (approvalId: string, reportId: string) => {
    setProcessing(approvalId)
    setMessage('')
    setError('')
    try {
      const res = await fetch('/api/admin/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalId, action: 'reject' }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage(data.message)
        setReports(prev => prev.map(r => {
          if (r.id === reportId) {
            return {
              ...r,
              approvals: r.approvals.map(a =>
                a.id === approvalId ? data.approval : a
              ),
            }
          }
          return r
        }))
      } else {
        setError(data.error || '差戻しに失敗しました')
      }
    } catch {
      setError('差戻しに失敗しました')
    } finally {
      setProcessing(null)
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）`
  }

  // 絞り込みクリア
  const clearFilters = () => {
    setSelectedUserId('')
    setSelectedRole('')
    setStartDate('')
    setEndDate('')
  }

  // 統計（絞り込み後）
  const stats = useMemo(() => {
    const all = filteredReports.length
    const pending = filteredReports.filter(r => getReportStatus(r.approvals) === 'pending' || getReportStatus(r.approvals) === 'partial').length
    const approved = filteredReports.filter(r => getReportStatus(r.approvals) === 'approved').length
    const rejected = filteredReports.filter(r => getReportStatus(r.approvals) === 'rejected').length
    return { all, pending, approved, rejected }
  }, [filteredReports])

  // 役職一覧（ユニーク）
  const positionOptions = useMemo(() => {
    const positions = new Set<string>()
    users.forEach(u => {
      if (u.position) positions.add(u.position)
    })
    return Array.from(positions).sort()
  }, [users])

  // 絞り込みが適用されているか
  const hasActiveFilters = selectedUserId || selectedRole || startDate || endDate

  if (loading && !currentUser) {
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">承認管理</h1>
                <p className="text-xs text-gray-500 hidden sm:block">営業日報の承認・差戻し</p>
              </div>
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link
                href="/dashboard"
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="TOP画面"
              >
                <Home className="h-5 w-5" />
              </Link>
              <Link
                href="/admin"
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="管理画面"
              >
                <Shield className="h-5 w-5" />
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
        {/* 戻るボタン */}
        <div className="mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            管理画面に戻る
          </Link>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {message}
            <button onClick={() => setMessage('')} className="ml-auto text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 絞り込みパネル */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">絞り込み条件</h3>
              {hasActiveFilters && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  適用中
                </span>
              )}
            </div>
            {showFilters ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {showFilters && (
            <div className="border-t border-gray-200 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* ユーザー選択 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 text-gray-500" />
                    氏名
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">全てのユーザー</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>

                {/* 役職選択 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    役職
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="">全ての役職</option>
                    {positionOptions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                {/* 開始日 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    開始日
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                {/* 終了日 */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    終了日
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 mr-1" />
                    絞り込みをクリア
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* フィルタータブ */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'pending' as const, label: '承認待ち', count: stats.pending, color: 'orange' },
            { key: 'all' as const, label: 'すべて', count: stats.all, color: 'gray' },
            { key: 'approved' as const, label: '承認済み', count: stats.approved, color: 'emerald' },
            { key: 'rejected' as const, label: '差戻し', count: stats.rejected, color: 'red' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key
                  ? tab.color === 'orange' ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                    : tab.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                    : tab.color === 'red' ? 'bg-red-100 text-red-700 border-2 border-red-300'
                    : 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              {tab.label}
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                filter === tab.key ? 'bg-white/50' : 'bg-gray-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 一括操作バー */}
        {pendingReports.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                >
                  {selectedReportIds.size === pendingReports.length ? (
                    <CheckSquare className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                  {selectedReportIds.size === pendingReports.length ? '全解除' : '全選択'}
                </button>
                <span className="text-sm text-gray-500">
                  {selectedReportIds.size > 0 && `${selectedReportIds.size}件選択中`}
                </span>
              </div>

              {selectedReportIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBulkApprove}
                    disabled={processing === 'bulk'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    選択した{selectedReportIds.size}件を承認
                  </button>
                  <button
                    onClick={handleBulkReject}
                    disabled={processing === 'bulk'}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    <Undo2 className="w-4 h-4" />
                    差戻し
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 提出状況カレンダー */}
        {submissionStatus && (
          <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">
                  提出状況カレンダー
                  {submissionStatus.periodStart && submissionStatus.periodEnd && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({new Date(submissionStatus.periodStart).getMonth() + 1}/{new Date(submissionStatus.periodStart).getDate()}〜
                      {new Date(submissionStatus.periodEnd).getMonth() + 1}/{new Date(submissionStatus.periodEnd).getDate()})
                    </span>
                  )}
                </h3>
              </div>
              {showCalendar ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {/* 月切り替えボタン */}
            {showCalendar && (
              <div className="flex items-center justify-center gap-4 px-4 py-3 bg-gray-50 border-t border-b border-gray-200">
                <button
                  onClick={(e) => { e.stopPropagation(); setCalendarOffset(calendarOffset - 1) }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  前の期間
                </button>
                <span className="text-sm font-medium text-gray-900 min-w-[120px] text-center">
                  {submissionStatus.periodStart && (
                    <>
                      {new Date(submissionStatus.periodStart).getFullYear()}年
                      {new Date(submissionStatus.periodStart).getMonth() + 1}月
                      {calendarOffset === 0 && <span className="ml-1 text-xs text-purple-600">（今期）</span>}
                    </>
                  )}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setCalendarOffset(calendarOffset + 1) }}
                  disabled={calendarOffset >= 0}
                  className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    calendarOffset >= 0
                      ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  次の期間
                  <ChevronRight className="w-4 h-4" />
                </button>
                {calendarOffset !== 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setCalendarOffset(0) }}
                    className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    今期に戻る
                  </button>
                )}
              </div>
            )}

            {showCalendar && (
              <div className="p-4 overflow-x-auto">
                {(() => {
                  // 期間内の日付配列を生成（21日〜翌月20日）
                  const periodDates: Date[] = []
                  const start = new Date(submissionStatus.periodStart)
                  const end = new Date(submissionStatus.periodEnd)
                  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    periodDates.push(new Date(d))
                  }

                  return (
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="sticky left-0 bg-white px-2 py-2 text-left font-medium text-gray-700 border-r border-gray-200">氏名</th>
                          {periodDates.map((date, i) => {
                            const day = date.getDate()
                            const month = date.getMonth() + 1
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6
                            const isFirstOfMonth = day === 1 || i === 0
                            return (
                              <th key={i} className={`px-1 py-2 text-center font-medium ${isWeekend ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}>
                                {isFirstOfMonth && <div className="text-[10px] text-gray-400">{month}月</div>}
                                {day}
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {submissionStatus.users.map(user => (
                          <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="sticky left-0 bg-white px-2 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 whitespace-nowrap">
                              {user.name}
                            </td>
                            {periodDates.map((date, i) => {
                              const dateKey = date.toISOString().split('T')[0]
                              const isSubmitted = submissionStatus.submissionMap[user.id]?.[dateKey]
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              const isFuture = date > today

                              return (
                                <td key={i} className={`px-1 py-2 text-center ${isWeekend ? 'bg-red-50' : ''}`}>
                                  {isFuture ? (
                                    <span className="text-gray-300">-</span>
                                  ) : isSubmitted ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500 inline" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500 inline" />
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                })()}
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    提出済み
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-500" />
                    未提出
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
                    土日
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 日報リスト */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">該当する日報はありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map(report => {
              const status = getReportStatus(report.approvals)
              const isExpanded = expandedReport === report.id
              const destinations = report.visitRecords.map(v => v.destination).filter(Boolean)
              const isPending = status === 'pending' || status === 'partial'
              const isSelected = selectedReportIds.has(report.id)

              return (
                <div
                  key={report.id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                    isSelected ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-200'
                  }`}
                >
                  {/* カードヘッダー */}
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      {/* チェックボックス（承認待ちのみ） */}
                      {isPending && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleSelect(report.id) }}
                          className="mt-1 flex-shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-purple-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 hover:text-purple-600" />
                          )}
                        </button>
                      )}

                      {/* カード内容 */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                        onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(status)}`}>
                                {getStatusIcon(status)}
                                {getStatusLabel(status)}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDate(report.date)}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                              <span className="inline-flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {report.user.name}
                                {report.user.position && <span className="text-gray-400">({report.user.position})</span>}
                              </span>
                              {report.approvalRoute && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded">
                                  <Route className="w-3 h-3" />
                                  {report.approvalRoute.name}
                                </span>
                              )}
                              {destinations.length > 0 && (
                                <span className="inline-flex items-center gap-1 truncate">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                  {destinations[0]}
                                  {destinations.length > 1 && ` 他${destinations.length - 1}件`}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* 一括承認/差戻しボタン（承認待ちのもののみ） */}
                            {isPending && (
                              <div className="hidden sm:flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleApproveAll(report.id) }}
                                  disabled={processing === report.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  承認
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRejectAll(report.id) }}
                                  disabled={processing === report.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                                >
                                  <Undo2 className="w-3.5 h-3.5" />
                                  差戻し
                                </button>
                              </div>
                            )}
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 展開コンテンツ */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* モバイル用 一括ボタン */}
                      {isPending && (
                        <div className="sm:hidden flex gap-2 p-4 bg-gray-50 border-b border-gray-200">
                          <button
                            onClick={() => handleApproveAll(report.id)}
                            disabled={processing === report.id}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
                          >
                            <CheckCheck className="w-4 h-4" />
                            一括承認
                          </button>
                          <button
                            onClick={() => handleRejectAll(report.id)}
                            disabled={processing === report.id}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                          >
                            <Undo2 className="w-4 h-4" />
                            差戻し
                          </button>
                        </div>
                      )}

                      {/* 訪問記録 */}
                      <div className="p-4 sm:p-5">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          訪問記録 ({report.visitRecords.length}件)
                        </h4>
                        <div className="space-y-2 mb-6">
                          {report.visitRecords.map((visit, i) => (
                            <div key={visit.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-900">{visit.destination}</span>
                                {visit.startTime && visit.endTime && (
                                  <span className="text-xs text-gray-500">
                                    {visit.startTime} 〜 {visit.endTime}
                                  </span>
                                )}
                              </div>
                              {visit.contactPerson && (
                                <p className="text-xs text-gray-500">面接者: {visit.contactPerson}</p>
                              )}
                              {visit.content && (
                                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{visit.content}</p>
                              )}
                              {visit.expense != null && visit.expense > 0 && (
                                <p className="text-xs text-gray-500 mt-1">経費: {visit.expense.toLocaleString()}円</p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 特記事項 */}
                        {report.specialNotes && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">連絡事項・備考</h4>
                            <p className="bg-amber-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                              {report.specialNotes}
                            </p>
                          </div>
                        )}

                        {/* 承認ステータス詳細 */}
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          承認ステータス
                        </h4>
                        <div className="space-y-2">
                          {report.approvals.map(approval => (
                            <div
                              key={approval.id}
                              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(approval.status)}`}>
                                  {getStatusIcon(approval.status)}
                                  {getStatusLabel(approval.status)}
                                </span>
                                <span className="text-sm font-medium text-gray-700">{approval.approverRole}</span>
                                {approval.approver && (
                                  <span className="text-xs text-gray-500">
                                    ({approval.approver.name})
                                  </span>
                                )}
                                {approval.approvedAt && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(approval.approvedAt).toLocaleString('ja-JP')}
                                  </span>
                                )}
                              </div>

                              {/* 個別の承認/差戻しボタン */}
                              {approval.status === 'pending' && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleApprove(approval.id, report.id)}
                                    disabled={processing === approval.id}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                    title="承認"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReject(approval.id, report.id)}
                                    disabled={processing === approval.id}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="差戻し"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* 日報詳細へのリンク */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <Link
                            href={`/nippo/${report.id}`}
                            className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                          >
                            <FileText className="w-4 h-4" />
                            日報詳細を表示
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
