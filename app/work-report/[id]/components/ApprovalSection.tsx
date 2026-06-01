'use client'

import { canActOnApproval } from '@/lib/approval-permissions'

interface Props {
  approvals: any[]
  currentUser: any
  approvalProcessing: string | null
  onApprove: (approvalId: string) => void
  onOpenReject: (approvalId: string) => void
}

export function ApprovalSection({ approvals, currentUser, approvalProcessing, onApprove, onOpenReject }: Props) {
  if (!approvals || approvals.length === 0) return null
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b border-emerald-100">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">承認状況</h2>
      </div>
      <div className="p-4 sm:p-6">
        {/* バッジ */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {['承認者', '常務', '専務', '社長'].map(role => {
            const items = approvals.filter((a: any) => a.approverRole === role)
            if (items.length === 0) return null
            const anyRejected = items.some((a: any) => a.status === 'rejected')
            const allApproved = items.every((a: any) => a.status === 'approved')
            const st = anyRejected ? 'rejected' : allApproved ? 'approved' : 'pending'
            const style = st === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
              : st === 'rejected' ? 'bg-red-100 text-red-700 border-red-300'
              : 'bg-yellow-50 text-yellow-700 border-yellow-300'
            return (
              <span key={role} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border ${style}`}>
                {role}{items.length > 1 ? ` (${items.filter((a: any) => a.status === 'approved').length}/${items.length})` : ''}
              </span>
            )
          })}
        </div>
        {/* 詳細 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {['承認者', '常務', '専務', '社長'].flatMap(role => {
            const items = approvals.filter((a: any) => a.approverRole === role)
            return items.map((approval: any) => {
              const statusLabel = approval.status === 'approved' ? '承認済み' : approval.status === 'rejected' ? '差戻し' : '承認待ち'
              const statusStyle = approval.status === 'approved' ? 'bg-green-50 border-green-200 text-green-800'
                : approval.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              const canAct = canActOnApproval(approval, currentUser)
              return (
                <div key={approval.id} className={`p-3 rounded-lg border ${statusStyle}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{role}</div>
                      {approval.approver && (
                        <div className="text-xs opacity-75">
                          {approval.approver.name}
                          {approval.approvedAt && (
                            <span className="ml-2">({new Date(approval.approvedAt).toLocaleDateString('ja-JP')})</span>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{statusLabel}</span>
                  </div>
                  {approval.status === 'rejected' && approval.rejectComment && (
                    <div className="mt-2 pt-2 border-t border-red-200 text-xs bg-white/60 rounded p-2 whitespace-pre-wrap text-red-900">
                      <span className="font-bold">差戻しコメント：</span>{approval.rejectComment}
                    </div>
                  )}
                  {canAct && (
                    <div className="mt-3 pt-2 border-t border-gray-200 flex gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove(approval.id)}
                        disabled={approvalProcessing === approval.id}
                        className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {approvalProcessing === approval.id ? '処理中...' : '承認'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenReject(approval.id)}
                        disabled={approvalProcessing === approval.id}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        差戻し
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          })}
        </div>
      </div>
    </div>
  )
}
