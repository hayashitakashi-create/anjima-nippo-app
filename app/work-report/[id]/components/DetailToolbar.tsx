'use client'

import Link from 'next/link'
import { ArrowLeft, Printer, Trash2, Edit3 } from 'lucide-react'

interface Props {
  isEditing: boolean
  isPreview: boolean
  reportId: string
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
}

export function DetailToolbar({ isEditing, isPreview, reportId, onBack, onEdit, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {isPreview ? '承認管理に戻る' : '戻る'}
        </button>
        <Link
          href={`/work-report/${reportId}/print`}
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0E3091] bg-white hover:bg-blue-50 border border-blue-300 rounded-lg transition-colors"
        >
          <Printer className="h-4 w-4" />
          印刷 / PDF
        </Link>
        {!isPreview && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white hover:bg-red-50 border border-red-300 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            削除
          </button>
        )}
      </div>
      {!isEditing && !isPreview && (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] hover:from-[#0a2470] hover:to-[#0E3091] rounded-lg shadow-md transition-all"
        >
          <Edit3 className="h-4 w-4" />
          編集する
        </button>
      )}
      {isPreview && (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full">
          閲覧専用モード
        </span>
      )}
    </div>
  )
}
