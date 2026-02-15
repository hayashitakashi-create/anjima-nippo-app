'use client'

import { RotateCcw, X } from 'lucide-react'

interface DraftBannerProps {
  show: boolean
  onRestore: () => void
  onDiscard: () => void
}

export function DraftBanner({
  show,
  onRestore,
  onDiscard,
}: DraftBannerProps) {
  if (!show) return null

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <RotateCcw className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">前回の入力内容が見つかりました</h3>
            <p className="text-sm text-amber-700 mt-0.5">保存されていない下書きがあります。復元しますか？</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDiscard}
          className="text-amber-400 hover:text-amber-600 ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-3 mt-3 ml-8">
        <button
          type="button"
          onClick={onRestore}
          className="px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          復元する
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="px-4 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          破棄する
        </button>
      </div>
    </div>
  )
}
