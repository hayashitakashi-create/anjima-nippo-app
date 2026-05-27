'use client'

import { X, User, Calendar, FileText } from 'lucide-react'
import { LEAVE_TYPE_COLORS } from '../types'

interface Detail {
  userName: string
  dateKey: string
  types?: { type: string; id: string }[]
  leave?: { id: string; type: string; reason?: string; attachmentName?: string }
}

interface Props {
  detail: Detail | null
  onClose: () => void
}

export function CalendarDetailModal({ detail, onClose }: Props) {
  if (!detail) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">提出状況 詳細</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{detail.userName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{detail.dateKey.replace(/-/g, '/')}</span>
          </div>
          <hr className="border-gray-200" />

          {/* 日報提出状況 */}
          {detail.types && detail.types.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">日報提出</p>
              <div className="flex flex-col gap-2">
                {detail.types.filter(e => e.type === 'sales').map((e, i) => (
                  <a
                    key={`sales-${i}`}
                    href={`/nippo/${e.id}`}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    営業日報 提出済み
                    <span className="ml-auto text-emerald-500">→</span>
                  </a>
                ))}
                {detail.types.filter(e => e.type === 'work').map((e, i) => (
                  <a
                    key={`work-${i}`}
                    href={`/work-report/${e.id}`}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    作業日報 提出済み
                    <span className="ml-auto text-blue-500">→</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 休暇情報 */}
          {detail.leave && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">休暇届</p>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${LEAVE_TYPE_COLORS[detail.leave.type]?.bg || 'bg-gray-500'} text-white`}>
                    {detail.leave.type}
                  </span>
                </div>
                {detail.leave.reason && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">理由:</span> {detail.leave.reason}
                  </p>
                )}
                {detail.leave.attachmentName && (
                  <a
                    href={`/api/leave-requests/${detail.leave.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#0E3091] hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    {detail.leave.attachmentName}
                  </a>
                )}
              </div>
            </div>
          )}

          {!detail.types && !detail.leave && (
            <p className="text-sm text-gray-500">情報がありません</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  )
}
