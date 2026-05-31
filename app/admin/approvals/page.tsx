'use client'

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
  ArrowLeft,
  CheckCheck,
  Undo2,
  User,
  Calendar,
  Route,
  X,
  CheckSquare,
  Square,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getMyAllowedRoles } from '@/lib/approval-permissions'
import {
  Approval,
  DailyReport,
  LEAVE_TYPE_COLORS,
  LEAVE_TYPE_SHORT,
  getReportStatus,
  getStatusLabel,
  getStatusStyle,
  formatDate,
} from './types'
import { useApprovalFilters } from './hooks/useApprovalFilters'
import { useApprovalList } from './hooks/useApprovalList'
import { useApprovalActions } from './hooks/useApprovalActions'
import { useCalendarState } from './hooks/useCalendarState'
import {
  StatusIcon,
  ApprovalsHeader,
  ApprovalFilters,
  StatsBadges,
  BulkActionsBar,
  SubmissionCalendar,
  CalendarDetailModal,
  ReportCard,
  RejectModal,
} from './components'

export default function ApprovalsPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading, logout: handleLogout } = useAuth({ requiredPermission: 'approve_reports' })
  // 承認権限フラグ: 役職承認者 or 承認者枠のどちらかがON
  const canActAsApprover = !!(currentUser?.isApprover || currentUser?.isAuthorizer)

  // ログインユーザーが操作できる approverRole を判定 (lib/approval-permissions 統合)
  const myAllowedRoles = getMyAllowedRoles(currentUser as any)

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
  // ② 承認したら承認待ちから消える: pending 表示時、自分の承認枠が全て承認済みの日報は隠す
  //    (承認権限がない管理者は myAllowedRoles が空のため除外されず全件表示される)
  const hideMyDone = (reports: any[]) =>
    filter === 'pending' ? reports.filter(r => !isMyApprovalDone(r)) : reports
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

  // カレンダー
  const {
    showCalendar, setShowCalendar,
    calendarOffset, setCalendarOffset,
    calendarNameFilter, setCalendarNameFilter,
    calendarDetail, setCalendarDetail,
  } = useCalendarState()

  // データ + fetch + 各種 useMemo
  const {
    reports, setReports,
    users,
    loading,
    filter, setFilter,
    expandedReport, setExpandedReport,
    processing, setProcessing,
    message, setMessage,
    error, setError,
    submissionStatus,
    fetchReports,
    filteredReports, pendingReports, stats, positionOptions,
  } = useApprovalList(currentUser, calendarOffset, {
    selectedUserId, selectedRole, selectedReportType, startDate, endDate,
  })

  // 承認/差戻し/選択操作
  const {
    selectedReportIds, setSelectedReportIds,
    rejectModal, setRejectModal,
    rejectComment, setRejectComment,
    handleSelectAll, handleToggleSelect,
    handleBulkApprove, handleBulkReject,
    handleApproveAll, handleRejectAll,
    handleApprove, handleReject,
    submitReject,
  } = useApprovalActions({
    pendingReportIds: hideMyDone(pendingReports).map(r => r.id),
    setReports,
    setProcessing,
    setMessage,
    setError,
    fetchReports,
  })

  // ② pending 表示時は自分のボールが残る日報だけを一覧に出す
  const visibleReports = hideMyDone(filteredReports)

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

        {submissionStatus && (
          <SubmissionCalendar
            submissionStatus={submissionStatus}
            users={users}
            showCalendar={showCalendar}
            setShowCalendar={setShowCalendar}
            calendarOffset={calendarOffset}
            setCalendarOffset={setCalendarOffset}
            calendarNameFilter={calendarNameFilter}
            setCalendarNameFilter={setCalendarNameFilter}
            onSelectDetail={setCalendarDetail}
          />
        )}

        <CalendarDetailModal detail={calendarDetail} onClose={() => setCalendarDetail(null)} />

        {/* 日報リスト */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : visibleReports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">該当する日報はありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleReports.map(report => (
              <ReportCard
                key={report.id}
                report={report}
                isExpanded={expandedReport === report.id}
                isSelected={selectedReportIds.has(report.id)}
                processing={processing}
                canActAsApprover={canActAsApprover}
                isMyApprovalDone={isMyApprovalDone}
                onToggleExpand={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                onToggleSelect={() => handleToggleSelect(report.id)}
                onApproveAll={handleApproveAll}
                onRejectAll={handleRejectAll}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
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
