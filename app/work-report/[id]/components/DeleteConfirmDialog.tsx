'use client'

import { Trash2 } from 'lucide-react'

interface Props {
  show: boolean
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ show, deleting, onConfirm, onCancel }: Props) {
  if (!show) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 className="w-7 h-7 text-red-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
          作業日報を削除しますか？
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          この操作は取り消せません。作業者記録・材料記録なども全て削除されます。
        </p>
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? '削除中...' : '削除する'}
          </button>
          <button
            onClick={onCancel}
            disabled={deleting}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
