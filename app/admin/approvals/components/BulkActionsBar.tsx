'use client'

import { CheckSquare, Square, CheckCheck, Undo2 } from 'lucide-react'

interface Props {
  pendingCount: number
  selectedSize: number
  canActAsApprover: boolean
  processing: string | null
  onSelectAll: () => void
  onBulkApprove: () => void
  onBulkReject: () => void
}

export function BulkActionsBar({
  pendingCount, selectedSize, canActAsApprover, processing,
  onSelectAll, onBulkApprove, onBulkReject,
}: Props) {
  if (pendingCount === 0) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onSelectAll}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
          >
            {selectedSize === pendingCount ? (
              <CheckSquare className="w-5 h-5 text-purple-600" />
            ) : (
              <Square className="w-5 h-5" />
            )}
            {selectedSize === pendingCount ? '全解除' : '全選択'}
          </button>
          <span className="text-sm text-gray-500">
            {selectedSize > 0 && `${selectedSize}件選択中`}
          </span>
        </div>

        {selectedSize > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onBulkApprove}
              disabled={processing === 'bulk' || !canActAsApprover}
              title={!canActAsApprover ? '承認権限がありません（役職または承認者の設定が必要）' : ''}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              選択した{selectedSize}件を承認
            </button>
            <button
              onClick={onBulkReject}
              disabled={processing === 'bulk' || !canActAsApprover}
              title={!canActAsApprover ? '承認権限がありません（役職または承認者の設定が必要）' : ''}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
            >
              <Undo2 className="w-4 h-4" />
              差戻し
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
