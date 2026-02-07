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
  Filter,
  ArrowLeft,
  CheckCheck,
  Undo2,
  User,
  Calendar,
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
}

interface CurrentUser {
  id: string
  name: string
  role: string
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
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

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

  // 日報一覧取得
  useEffect(() => {
    if (!currentUser) return
    fetchReports()
  }, [currentUser, filter])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/approvals?status=${filter}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports)
      }
    } catch (err) {
      console.error('承認一覧取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  // 一括承認
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

  // 一括差戻し
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

  // 統計
  const stats = useMemo(() => {
    const all = reports.length
    const pending = reports.filter(r => getReportStatus(r.approvals) === 'pending' || getReportStatus(r.approvals) === 'partial').length
    const approved = reports.filter(r => getReportStatus(r.approvals) === 'approved').length
    const rejected = reports.filter(r => getReportStatus(r.approvals) === 'rejected').length
    return { all, pending, approved, rejected }
  }, [reports])

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
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">承認管理</h1>
                <p className="text-xs text-gray-500 hidden sm:block">営業日報の承認・差戻し</p>
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
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

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

        {/* 日報リスト */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">該当する日報はありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map(report => {
              const status = getReportStatus(report.approvals)
              const isExpanded = expandedReport === report.id
              const destinations = report.visitRecords.map(v => v.destination).filter(Boolean)

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  {/* カードヘッダー */}
                  <div
                    className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50 transition-colors"
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

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {report.user.name}
                            {report.user.position && <span className="text-gray-400">({report.user.position})</span>}
                          </span>
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
                        {(status === 'pending' || status === 'partial') && (
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

                  {/* 展開コンテンツ */}
                  {isExpanded && (
                    <div className="border-t border-gray-200">
                      {/* モバイル用 一括ボタン */}
                      {(status === 'pending' || status === 'partial') && (
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
