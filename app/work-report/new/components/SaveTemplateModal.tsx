'use client'

import { X } from 'lucide-react'

interface SaveTemplateModalProps {
  show: boolean
  onClose: () => void
  templateName: string
  setTemplateName: (name: string) => void
  templateIsShared: boolean
  setTemplateIsShared: (shared: boolean) => void
  onSave: () => void
  saving: boolean
}

export function SaveTemplateModal({
  show,
  onClose,
  templateName,
  setTemplateName,
  templateIsShared,
  setTemplateIsShared,
  onSave,
  saving,
}: SaveTemplateModalProps) {
  if (!show) return null

  const handleClose = () => {
    setTemplateName('')
    setTemplateIsShared(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">テンプレートとして保存</h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              テンプレート名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="例: 現場A 通常作業"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="templateIsShared"
              checked={templateIsShared}
              onChange={(e) => setTemplateIsShared(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <label htmlFor="templateIsShared" className="text-sm text-gray-700">
              全ユーザーと共有する
            </label>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800">
              現在の入力内容がテンプレートとして保存されます。
              <br />
              <span className="text-xs text-amber-600">（日付・天候・連絡事項は除く）</span>
            </p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !templateName.trim()}
            className="px-4 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
