'use client'

import { Save, X } from 'lucide-react'

interface Props {
  isEditing: boolean
  saving: boolean
  onCancel: () => void
}

export function EditFooter({ isEditing, saving, onCancel }: Props) {
  if (!isEditing) return null
  return (
    <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] text-white rounded-xl hover:from-[#0a2470] hover:to-[#0E3091] disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? '更新中...' : '更新'}</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 text-base sm:text-lg font-bold transition-all shadow-sm"
        >
          <X className="w-5 h-5" />
          <span>キャンセル</span>
        </button>
      </div>
    </div>
  )
}
