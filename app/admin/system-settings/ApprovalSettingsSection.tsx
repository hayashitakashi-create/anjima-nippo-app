'use client'

import { ChevronDown, ChevronUp, FileCheck, AlertCircle, Save, Plus, Trash2 } from 'lucide-react'

interface ApprovalForm {
  approval_roles: string[]
  auto_approve_days: number
}

interface ApprovalSettingsSectionProps {
  approvalForm: ApprovalForm
  setApprovalForm: (form: ApprovalForm) => void
  newRole: string
  setNewRole: (v: string) => void
  onAddRole: () => void
  onRemoveRole: (index: number) => void
  expanded: boolean
  onToggle: () => void
  sectionMessage?: { type: 'success' | 'error'; text: string }
  savingSection: string | null
  onSave: () => void | Promise<void>
}

export default function ApprovalSettingsSection({
  approvalForm,
  setApprovalForm,
  newRole,
  setNewRole,
  onAddRole,
  onRemoveRole,
  expanded,
  onToggle,
  sectionMessage,
  savingSection,
  onSave,
}: ApprovalSettingsSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <FileCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">承認設定</h2>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                承認者役職リスト
              </label>

              <div className="space-y-2 mb-3">
                {approvalForm.approval_roles.map((role, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                      {role}
                    </div>
                    <button
                      onClick={() => onRemoveRole(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && onAddRole()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                  placeholder="新しい役職を追加"
                />
                <button
                  onClick={onAddRole}
                  className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                承認者として選択可能な役職を管理します
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                自動承認日数
              </label>
              <input
                type="number"
                min="0"
                value={approvalForm.auto_approve_days}
                onChange={e => setApprovalForm({ ...approvalForm, auto_approve_days: parseInt(e.target.value) || 0 })}
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                0日で無効。設定した日数経過後に自動承認されます
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onSave}
                disabled={savingSection === 'approval'}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingSection === 'approval' ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
