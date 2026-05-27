'use client'

import Link from 'next/link'
import {
  CheckCircle, XCircle, Clock, FileText, MapPin,
  ChevronDown, ChevronUp, CheckCheck, Undo2, User, Shield, CheckSquare, Square,
} from 'lucide-react'
import { StatusIcon } from './StatusIcon'
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
                    onClick={() => onApproveAll(report.id)}
                    disabled={processing === report.id || !canActAsApprover}
                    title={!canActAsApprover ? '承認権限がありません' : ''}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400"
                  >
                    <CheckCheck className="w-4 h-4" />
                    一括承認
                  </button>
                  <button
                    onClick={() => onRejectAll(report.id)}
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
                const st = anyRejected ? 'rejected' : allApproved ? 'approved' : 'pending'
                return (
                  <span key={role} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(st)}`}>
                    <StatusIcon status={st} />
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
                          onClick={() => onApprove(approval.id, report.id)}
                          disabled={processing === approval.id || !canActAsApprover}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title={!canActAsApprover ? '承認権限がありません' : '承認'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReject(approval.id, report.id)}
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
}
