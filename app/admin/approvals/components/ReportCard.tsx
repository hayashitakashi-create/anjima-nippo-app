'use client'

import {
  CheckCircle, XCircle, Clock, MapPin,
  ChevronDown, ChevronUp, CheckCheck, Undo2, User, CheckSquare, Square,
} from 'lucide-react'
import { StatusIcon } from './StatusIcon'
import { ReportCardDetail } from './ReportCardDetail'
import { Approval, DailyReport, getReportStatus, getStatusLabel, getStatusStyle, formatDate } from '../types'

interface Props {
  report: DailyReport
  isExpanded: boolean
  isSelected: boolean
  processing: string | null
  canActAsApprover: boolean
  isMyApprovalDone: (report: any) => boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
  onApproveAll: (reportId: string) => void
  onRejectAll: (reportId: string) => void
  onApprove: (approvalId: string, reportId: string) => void
  onReject: (approvalId: string, reportId: string) => void
}

export function ReportCard({
  report, isExpanded, isSelected, processing,
  canActAsApprover, isMyApprovalDone,
  onToggleExpand, onToggleSelect,
  onApproveAll, onRejectAll, onApprove, onReject,
}: Props) {
  const status = getReportStatus(report.approvals)
  const destinations = report.visitRecords.map(v => v.destination).filter(Boolean)
  const isPending = status === 'pending' || status === 'partial'

  return (
    <div
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
              onClick={(e) => { e.stopPropagation(); onToggleSelect() }}
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
            onClick={onToggleExpand}
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
                  {['承認者', '常務', '専務', '社長'].map(role => {
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
                          onClick={(e) => { e.stopPropagation(); onApproveAll(report.id) }}
                          disabled={processing === report.id || !canActAsApprover}
                          title={!canActAsApprover ? '承認権限がありません' : ''}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          承認
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRejectAll(report.id) }}
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
        <ReportCardDetail
          report={report}
          processing={processing}
          canActAsApprover={canActAsApprover}
          isMyApprovalDone={isMyApprovalDone}
          onApproveAll={onApproveAll}
          onRejectAll={onRejectAll}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </div>
  )
}
