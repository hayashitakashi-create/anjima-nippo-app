'use client'

import { ChevronDown, ChevronUp, Cog, AlertCircle, Save } from 'lucide-react'

interface SystemForm {
  data_retention_days: number
  session_timeout_hours: number
}

interface SystemSectionProps {
  systemForm: SystemForm
  setSystemForm: (form: SystemForm) => void
  expanded: boolean
  onToggle: () => void
  sectionMessage?: { type: 'success' | 'error'; text: string }
  savingSection: string | null
  onSave: () => void | Promise<void>
}

export default function SystemSection({
  systemForm,
  setSystemForm,
  expanded,
  onToggle,
  sectionMessage,
  savingSection,
  onSave,
}: SystemSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Cog className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">システム</h2>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 sm:px-6 pb-6 border-t border-slate-200">
          {sectionMessage && (
            <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
              sectionMessage.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{sectionMessage.text}</span>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                データ保持期間（日）
              </label>
              <input
                type="number"
                min="1"
                value={systemForm.data_retention_days}
                onChange={e => setSystemForm({ ...systemForm, data_retention_days: parseInt(e.target.value) || 1 })}
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                この期間を過ぎたデータは自動削除されます
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                セッションタイムアウト（時間）
              </label>
              <input
                type="number"
                min="1"
                value={systemForm.session_timeout_hours}
                onChange={e => setSystemForm({ ...systemForm, session_timeout_hours: parseInt(e.target.value) || 1 })}
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                ログイン状態を保持する期間を設定します
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onSave}
                disabled={savingSection === 'system'}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingSection === 'system' ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
