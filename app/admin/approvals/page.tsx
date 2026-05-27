'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
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
  Users,
  X,
  CheckSquare,
  Square,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { adminApi, apiGet, apiPut } from '@/lib/api'
import {
  Approval,
  DailyReport,
  ManagedUser,
  SubmissionStatus,
  LEAVE_TYPE_COLORS,
  LEAVE_TYPE_SHORT,
  getReportStatus,
  getStatusLabel,
  getStatusStyle,
  formatDate,
} from './types'
import { useApprovalFilters } from './hooks/useApprovalFilters'
import {
  StatusIcon,
  ApprovalsHeader,
  ApprovalFilters,
  StatsBadges,
  BulkActionsBar,
  CalendarDetailModal,
  RejectModal,
} from './components'

export default function ApprovalsPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading, logout: handleLogout } = useAuth({ requiredPermission: 'approve_reports' })
  // 承認権限フラグ: 役職承認者 or 承認者枠のどちらかがON
  const canActAsApprover = !!(currentUser?.isApprover || currentUser?.isAuthorizer)

  // ログインユーザーが操作できる approverRole を判定
  const myAllowedRoles = (() => {
    const roles: string[] = []
    switch ((currentUser as any)?.position) {
      case '部長': case '課長': roles.push('上長'); break
      case '常務': roles.push('常務'); break
      case '専務': roles.push('専務'); break
      case '社長': roles.push('社長'); break
    }
    if (currentUser?.isAuthorizer && !['社長', '専務', '常務'].includes((currentUser as any)?.position || '')) {
      roles.push('承認者')
    }
    return roles
  })()

  // 「自分が承認できる枠が全て承認済み」か判定
  const isMyApprovalDone = (report: any) => {
    if (myAllowedRoles.length === 0) return false
    const myItems = report.approvals.filter((a: any) =>
      myAllowedRoles.includes(a.approverRole) &&
      (a.approverRole !== '承認者' || !a.approverUserId || a.approverUserId === currentUser?.id)
    )
    if (myItems.length === 0) return false
    return myItems.every((a: any) => a.status === 'approved')
  }
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
  const [calendarNameFilter, setCalendarNameFilter] = useState('') // カレンダー氏名絞り込み
  const [calendarDetail, setCalendarDetail] = useState<{ userName: string; dateKey: string; types?: { type: string; id: string }[]; leave?: { id: string; type: string; reason?: string; attachmentName?: string } } | null>(null)

  // 絞り込み条件
  const {
    selectedUserId, setSelectedUserId,
    selectedRole, setSelectedRole,
    selectedReportType, setSelectedReportType,
    startDate, setStartDate,
    endDate, setEndDate,
    showFilters, setShowFilters,
    clearFilters,
    hasActiveFilters,
  } = useApprovalFilters()

  // チェックボックス
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set())

  // ユーザー一覧取得
  useEffect(() => {
    if (!currentUser) return
    adminApi.fetchUsers()
      .then(data => {
        if (data.users) {
          setUsers((data.users as any[]).filter((u: ManagedUser) => u.isActive !== false))
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
      const data = await apiGet<any>(`/api/admin/approvals?status=${filter}&includeSubmissionStatus=true&calendarOffset=${calendarOffset}`)
      setReports(data.reports)
      if (data.submissionStatus) {
        setSubmissionStatus(data.submissionStatus)
      }
    } catch (err) {
      console.error('承認一覧取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendarData = async () => {
    try {
      const data = await apiGet<any>(`/api/admin/approvals?status=all&includeSubmissionStatus=true&calendarOffset=${calendarOffset}`)
      if (data.submissionStatus) {
        setSubmissionStatus(data.submissionStatus)
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

    // 日報種別で絞り込み
    if (selectedReportType) {
      result = result.filter(r => ((r as any).reportType || 'sales') === selectedReportType)
    }

    return result
  }, [reports, selectedUserId, selectedRole, startDate, endDate, selectedReportType])

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
      const data = await apiPut<any>('/api/admin/approvals', {
        reportIds: Array.from(selectedReportIds),
        action: 'bulk_approve'
      })
      setMessage(data.message)
      setSelectedReportIds(new Set())
      fetchReports()
    } catch (err: any) {
      setError(err.message || '承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  // 差戻しモーダル state
  const [rejectModal, setRejectModal] = useState<
    | null
    | { kind: 'individual'; approvalId: string; reportId: string }
    | { kind: 'all'; reportId: string }
    | { kind: 'bulk'; reportIds: string[] }
  >(null)
  const [rejectComment, setRejectComment] = useState('')

  // 差戻し送信
  const submitReject = async () => {
    if (!rejectModal) return
    const comment = rejectComment.trim()
    if (!comment) {
      alert('差戻しの理由（コメント）を入力してください')
      return
    }
    const processingKey = rejectModal.kind === 'individual' ? rejectModal.approvalId : rejectModal.kind === 'all' ? rejectModal.reportId : 'bulk'
    setProcessing(processingKey)
    setMessage('')
    setError('')
    try {
      if (rejectModal.kind === 'individual') {
        const data = await apiPut<any>('/api/admin/approvals', {
          approvalId: rejectModal.approvalId, action: 'reject', rejectComment: comment,
        })
        setMessage(data.message)
        const reportId = rejectModal.reportId
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, approvals: r.approvals.map(a => a.id === rejectModal.approvalId ? data.approval : a) } : r))
      } else if (rejectModal.kind === 'all') {
        const data = await apiPut<any>('/api/admin/approvals', {
          reportId: rejectModal.reportId, action: 'reject_all', rejectComment: comment,
        })
        setMessage(data.message)
        setReports(prev => prev.map(r => r.id === rejectModal.reportId && data.report ? { ...r, approvals: data.report.approvals } : r))
      } else {
        const data = await apiPut<any>('/api/admin/approvals', {
          reportIds: rejectModal.reportIds, action: 'bulk_reject', rejectComment: comment,
        })
        setMessage(data.message)
        setSelectedReportIds(new Set())
        fetchReports()
      }
      setRejectModal(null)
      setRejectComment('')
    } catch (err: any) {
      setError(err.message || '差戻しに失敗しました')
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
    setRejectComment('')
    setRejectModal({ kind: 'bulk', reportIds: Array.from(selectedReportIds) })
  }

  // 一括承認（単一日報）
  const handleApproveAll = async (reportId: string) => {
    setProcessing(reportId)
    setMessage('')
    setError('')
    try {
      const data = await apiPut<any>('/api/admin/approvals', { reportId, action: 'approve_all' })
      setMessage(data.message)
      setReports(prev => prev.map(r => {
        if (r.id === reportId && data.report) {
          return { ...r, approvals: data.report.approvals }
        }
        return r
      }))
    } catch (err: any) {
      setError(err.message || '承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  // 一括差戻し（単一日報）
  const handleRejectAll = async (reportId: string) => {
    setRejectComment('')
    setRejectModal({ kind: 'all', reportId })
  }

  // 個別承認
  const handleApprove = async (approvalId: string, reportId: string) => {
    setProcessing(approvalId)
    setMessage('')
    setError('')
    try {
      const data = await apiPut<any>('/api/admin/approvals', { approvalId, action: 'approve' })
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
    } catch (err: any) {
      setError(err.message || '承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  // 個別差戻し
  const handleReject = async (approvalId: string, reportId: string) => {
    setRejectComment('')
    setRejectModal({ kind: 'individual', approvalId, reportId })
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

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ApprovalsHeader onLogout={handleLogout} />

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

        <ApprovalFilters
          users={users}
          positionOptions={positionOptions}
          selectedUserId={selectedUserId}
          setSelectedUserId={setSelectedUserId}
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
          selectedReportType={selectedReportType}
          setSelectedReportType={setSelectedReportType}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
        />

        <StatsBadges filter={filter} setFilter={setFilter} stats={stats} />

        <BulkActionsBar
          pendingCount={pendingReports.length}
          selectedSize={selectedReportIds.size}
          canActAsApprover={canActAsApprover}
          processing={processing}
          onSelectAll={handleSelectAll}
          onBulkApprove={handleBulkApprove}
          onBulkReject={handleBulkReject}
        />

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

            {showCalendar && (
              <>
                {/* 月切り替え + 氏名フィルター */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); setCalendarOffset(calendarOffset - 1) }}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      前
                    </button>
                    <span className="text-sm font-medium text-gray-900 min-w-[100px] text-center">
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
                      disabled={calendarOffset >= 2}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        calendarOffset >= 2
                          ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      次
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {calendarOffset !== 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setCalendarOffset(0) }}
                        className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        今期
                      </button>
                    )}
                  </div>
                  {/* ① 氏名フィルター */}
                  <select
                    value={calendarNameFilter}
                    onChange={(e) => setCalendarNameFilter(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">全社員</option>
                    {[...users].sort((a, b) => a.name.localeCompare(b.name, 'ja')).map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="p-4 overflow-x-auto">
                  {(() => {
                    const periodDates: Date[] = []
                    const start = new Date(submissionStatus.periodStart)
                    const end = new Date(submissionStatus.periodEnd)
                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                      periodDates.push(new Date(d))
                    }

                    // ① 氏名フィルター適用
                    const filteredUsers = calendarNameFilter
                      ? submissionStatus.users.filter(u => u.name === calendarNameFilter)
                      : submissionStatus.users

                    return (
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="sticky left-0 bg-white px-2 py-2 text-left font-medium text-gray-700 border-r border-gray-200 z-10">
                              氏名
                              {calendarNameFilter && <span className="ml-1 text-purple-600">({filteredUsers.length}件)</span>}
                            </th>
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
                          {filteredUsers.map(user => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="sticky left-0 bg-white px-2 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 whitespace-nowrap z-10">
                                {user.name}
                              </td>
                              {periodDates.map((date, i) => {
                                const dateKey = date.toISOString().split('T')[0]
                                const isSubmitted = submissionStatus.submissionMap[user.id]?.[dateKey]
                                const isApproved = submissionStatus.approvalMap?.[user.id]?.[dateKey] === 'approved'
                                const leaveInfo = submissionStatus.leaveMap?.[user.id]?.[dateKey]
                                const submissionTypes = submissionStatus.submissionTypeMap?.[user.id]?.[dateKey]
                                const cellStatus = submissionStatus.statusMap?.[user.id]?.[dateKey]
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                                const todayKey = new Date().toISOString().split('T')[0]
                                const isFuture = dateKey > todayKey
                                const hasContent = leaveInfo || (!isFuture && isSubmitted)

                                // ② 休暇種別の色を取得
                                const leaveColor = leaveInfo ? (LEAVE_TYPE_COLORS[leaveInfo.type] || LEAVE_TYPE_COLORS['その他']) : null
                                const leaveShort = leaveInfo ? (LEAVE_TYPE_SHORT[leaveInfo.type] || '他') : ''

                                // セル背景色（ステータス3値）— 休暇・未来日・週末は対象外
                                let statusBg = ''
                                if (!leaveInfo && !isFuture) {
                                  if (cellStatus === 'complete') statusBg = 'bg-emerald-50'
                                  else if (cellStatus === 'partial') statusBg = 'bg-amber-100'
                                  else if (cellStatus === 'none') statusBg = 'bg-rose-50'
                                }

                                return (
                                  <td
                                    key={i}
                                    className={`px-0.5 py-1.5 text-center ${isWeekend ? 'bg-red-50' : statusBg} ${hasContent ? 'cursor-pointer hover:opacity-70' : ''}`}
                                    onClick={() => {
                                      // ③ クリックで詳細表示
                                      if (hasContent) {
                                        setCalendarDetail({
                                          userName: user.name,
                                          dateKey,
                                          types: submissionTypes,
                                          leave: leaveInfo ? { id: leaveInfo.id, type: leaveInfo.type, reason: leaveInfo.reason, attachmentName: leaveInfo.attachmentName } : undefined,
                                        })
                                      }
                                    }}
                                  >
                                    {leaveInfo ? (
                                      <span
                                        className={`inline-block w-5 h-4 leading-4 rounded text-[9px] font-bold ${leaveColor?.bg} ${leaveColor?.text}`}
                                        title={leaveInfo.type + (leaveInfo.reason ? `（${leaveInfo.reason}）` : '')}
                                      >
                                        {leaveShort}
                                      </span>
                                    ) : isFuture ? (
                                      <span className="text-gray-300">-</span>
                                    ) : isSubmitted ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        {submissionTypes?.some(e => e.type === 'sales') && (
                                          <span className={`inline-block w-5 h-3.5 leading-[14px] rounded text-[8px] font-bold text-white bg-emerald-500 ${isApproved ? 'ring-1 ring-amber-400' : ''}`}>
                                            営
                                          </span>
                                        )}
                                        {submissionTypes?.some(e => e.type === 'work') && (
                                          <span className={`inline-block w-5 h-3.5 leading-[14px] rounded text-[8px] font-bold text-white bg-blue-500 ${isApproved ? 'ring-1 ring-amber-400' : ''}`}>
                                            作
                                          </span>
                                        )}
                                      </div>
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
                  {/* 凡例 */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-emerald-500 text-white text-[7px] font-bold text-center">営</span>
                      営業日報
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-blue-500 text-white text-[7px] font-bold text-center">作</span>
                      作業日報
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-emerald-500 text-white text-[7px] font-bold text-center ring-1 ring-amber-400">営</span>
                      /
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-blue-500 text-white text-[7px] font-bold text-center ring-1 ring-amber-400">作</span>
                      承認済み
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-rose-500 text-white text-[7px] font-bold text-center">有</span>
                      有給
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-purple-500 text-white text-[7px] font-bold text-center">振</span>
                      振替
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-teal-500 text-white text-[7px] font-bold text-center">代</span>
                      代休
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-pink-500 text-white text-[7px] font-bold text-center">看</span>
                      看護
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-orange-500 text-white text-[7px] font-bold text-center">介</span>
                      介護
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-amber-500 text-white text-[7px] font-bold text-center">特</span>
                      特別休暇
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="inline-block w-4 h-3 leading-3 rounded bg-gray-500 text-white text-[7px] font-bold text-center">他</span>
                      その他
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-rose-50 border border-rose-200 rounded" />
                      未提出
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded" />
                      要確認
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded" />
                      提出済
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
                      土日
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <CalendarDetailModal detail={calendarDetail} onClose={() => setCalendarDetail(null)} />

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
                                <StatusIcon status={status} />
                                {getStatusLabel(status)}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {formatDate(report.date)}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                (report as any).reportType === 'work'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-purple-100 text-purple-700 border border-purple-300'
                              }`}>
                                {(report as any).reportType === 'work' ? '作業' : '営業'}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
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
                            {/* 承認状況バッジ（未承認者がひと目でわかる） */}
                            <div className="flex items-center gap-1.5 mt-1">
                              {['承認者', '上長', '常務', '専務', '社長'].map(role => {
                                const items = report.approvals.filter((a: Approval) => a.approverRole === role)
                                if (items.length === 0) return null
                                const anyRejected = items.some(a => a.status === 'rejected')
                                const allApproved = items.every(a => a.status === 'approved')
                                const st = anyRejected ? 'rejected' : allApproved ? 'approved' : 'pending'
                                return (
                                  <span
                                    key={role}
                                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                      st === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' :
                                      st === 'rejected' ? 'bg-red-100 text-red-700 border-red-300' :
                                      'bg-yellow-50 text-yellow-700 border-yellow-300'
                                    }`}
                                  >
                                    {st === 'approved' ? <CheckCircle className="w-2.5 h-2.5" /> :
                                     st === 'rejected' ? <XCircle className="w-2.5 h-2.5" /> :
                                     <Clock className="w-2.5 h-2.5" />}
                                    {role}{items.length > 1 ? ` (${items.filter(a => a.status === 'approved').length}/${items.length})` : ''}
                                  </span>
                                )
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* 一括承認/差戻しボタン（承認待ちのもののみ） */}
                            {isPending && (
                              <div className="hidden sm:flex items-center gap-2">
                                {isMyApprovalDone(report) ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold rounded-lg">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    承認済
                                  </span>
                                ) : (
                                  <>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleApproveAll(report.id) }}
                                      disabled={processing === report.id || !canActAsApprover}
                                      title={!canActAsApprover ? '承認権限がありません' : ''}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
                                    >
                                      <CheckCheck className="w-3.5 h-3.5" />
                                      承認
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRejectAll(report.id) }}
                                      disabled={processing === report.id || !canActAsApprover}
                                      title={!canActAsApprover ? '承認権限がありません' : ''}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                                    >
                                      <Undo2 className="w-3.5 h-3.5" />
                                      差戻し
                                    </button>
                                  </>
                                )}
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
                          {isMyApprovalDone(report) ? (
                            <span className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-100 text-emerald-700 border border-emerald-300 text-sm font-bold rounded-lg">
                              <CheckCircle className="w-4 h-4" />
                              承認済
                            </span>
                          ) : (
                            <>
                              <button
                                onClick={() => handleApproveAll(report.id)}
                                disabled={processing === report.id || !canActAsApprover}
                                title={!canActAsApprover ? '承認権限がありません' : ''}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
                              >
                                <CheckCheck className="w-4 h-4" />
                                一括承認
                              </button>
                              <button
                                onClick={() => handleRejectAll(report.id)}
                                disabled={processing === report.id || !canActAsApprover}
                                title={!canActAsApprover ? '承認権限がありません' : ''}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                              >
                                <Undo2 className="w-4 h-4" />
                                差戻し
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* 訪問記録（営業日報のみ） */}
                      <div className="p-4 sm:p-5">
                        {(report as any).reportType !== 'work' && (
                          <>
                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              訪問記録 ({report.visitRecords.length}件)
                              <span className="text-xs font-normal text-gray-500 ml-2">（クリックで日報を別タブで開きます）</span>
                            </h4>
                            <div className="space-y-2 mb-6">
                              {report.visitRecords.map((visit, i) => (
                                <Link
                                  key={visit.id}
                                  href={`/nippo/${report.id}?preview=1`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block bg-gray-50 rounded-lg p-3 text-sm hover:bg-purple-50 hover:ring-1 hover:ring-purple-300 transition-colors cursor-pointer"
                                >
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
                                </Link>
                              ))}
                            </div>
                          </>
                        )}

                        {/* 特記事項 */}
                        {report.specialNotes && (
                          <div className="mb-6">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">連絡事項・備考</h4>
                            <p className="bg-amber-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                              {report.specialNotes}
                            </p>
                          </div>
                        )}

                        {/* 承認状況 */}
                        <div className="flex items-center mb-3 flex-wrap gap-3">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            承認状況
                          </h4>
                          <Link
                            href={`${(report as any).reportType === 'work' ? '/work-report' : '/nippo'}/${report.id}?preview=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            日報詳細を表示
                          </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          {['承認者', '上長', '常務', '専務', '社長'].map((role) => {
                            const items = report.approvals.filter(a => a.approverRole === role)
                            if (items.length === 0) return null
                            const anyRejected = items.some(a => a.status === 'rejected')
                            const allApproved = items.every(a => a.status === 'approved')
                            const status = anyRejected ? 'rejected' : allApproved ? 'approved' : 'pending'
                            return (
                              <span key={role} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(status)}`}>
                                <StatusIcon status={status} />
                                {role}{items.length > 1 ? ` (${items.filter(a => a.status === 'approved').length}/${items.length})` : ''}
                              </span>
                            )
                          })}
                        </div>
                        <div className="space-y-2">
                          {['承認者', '上長', '常務', '専務', '社長'].flatMap(role => {
                            const items = report.approvals.filter(a => a.approverRole === role)
                            return items.map(approval => (
                              <div
                                key={approval.id}
                                className={`rounded-lg p-3 ${
                                  approval.status === 'approved' ? 'bg-emerald-50 border border-emerald-200' :
                                  approval.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                                  'bg-gray-50 border border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(approval.status)}`}>
                                    <StatusIcon status={approval.status} />
                                    {getStatusLabel(approval.status)}
                                  </span>
                                  <span className="text-sm font-bold text-gray-900">{approval.approverRole}</span>
                                  {approval.approver && (
                                    <span className="text-xs text-gray-600 font-medium">
                                      （{approval.approver.name}）
                                    </span>
                                  )}
                                  {approval.approvedAt && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(approval.approvedAt).toLocaleString('ja-JP')}
                                    </span>
                                  )}
                                </div>

                                {/* 個別の承認/差戻しボタン */}
                                {approval.status === 'pending' && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleApprove(approval.id, report.id)}
                                      disabled={processing === approval.id || !canActAsApprover}
                                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                      title={!canActAsApprover ? '承認権限がありません' : '承認'}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleReject(approval.id, report.id)}
                                      disabled={processing === approval.id || !canActAsApprover}
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                      title={!canActAsApprover ? '承認権限がありません' : '差戻し'}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                </div>
                                {approval.status === 'rejected' && (approval as any).rejectComment && (
                                  <div className="mt-2 pt-2 border-t border-red-200 text-xs text-red-800 bg-white/50 rounded p-2 whitespace-pre-wrap">
                                    <span className="font-bold">差戻しコメント：</span>{(approval as any).rejectComment}
                                  </div>
                                )}
                              </div>
                            ))
                          })}
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

      <RejectModal
        modal={rejectModal}
        comment={rejectComment}
        setComment={setRejectComment}
        processing={processing}
        onSubmit={submitReject}
        onClose={() => { setRejectModal(null); setRejectComment('') }}
      />
    </div>
  )
}
