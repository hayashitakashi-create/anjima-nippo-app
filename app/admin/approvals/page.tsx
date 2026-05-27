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
    pendingReportIds: pendingReports.map(r => r.id),
    setReports,
    setProcessing,
    setMessage,
    setError,
    fetchReports,
  })

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
