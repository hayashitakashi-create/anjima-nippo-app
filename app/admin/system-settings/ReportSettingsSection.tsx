'use client'

import { ChevronDown, ChevronUp, ClipboardList, AlertCircle, Save } from 'lucide-react'

interface ReportForm {
  report_reminder_enabled: boolean
  report_reminder_time: string
  default_work_hours_start: string
  default_work_hours_end: string
}

interface ReportSettingsSectionProps {
  variant: 'sales' | 'work'
  reportForm: ReportForm
  setReportForm: (form: ReportForm) => void
  expanded: boolean
  onToggle: () => void
  sectionMessage?: { type: 'success' | 'error'; text: string }
  savingSection: string | null
  onSave: () => void | Promise<void>
}

export default function ReportSettingsSection({
  variant,
  reportForm,
  setReportForm,
  expanded,
  onToggle,
  sectionMessage,
  savingSection,
  onSave,
}: ReportSettingsSectionProps) {
  const isSales = variant === 'sales'
  const title = isSales ? '営業日報設定' : '作業日報設定'
  const sectionKey = isSales ? 'salesReport' : 'workReport'
  const iconBg = isSales ? 'bg-orange-100' : 'bg-teal-100'
  const iconColor = isSales ? 'text-orange-600' : 'text-teal-600'
  const reportTypeLabel = isSales ? '営業日報' : '作業日報'

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
            <ClipboardList className={`w-5 h-5 ${iconColor}`} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
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
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">日報リマインダー</p>
                <p className="text-xs text-gray-500 mt-0.5">未提出日報の通知を有効化</p>
              </div>
              <button
                onClick={() => setReportForm({ ...reportForm, report_reminder_enabled: !reportForm.report_reminder_enabled })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  reportForm.report_reminder_enabled ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    reportForm.report_reminder_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                リマインダー時刻
              </label>
              <input
                type="time"
                value={reportForm.report_reminder_time}
                onChange={e => setReportForm({ ...reportForm, report_reminder_time: e.target.value })}
                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                通知を送信する時刻を設定します
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                デフォルト業務時間
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">開始時刻</label>
                  <input
                    type="time"
                    value={reportForm.default_work_hours_start}
                    onChange={e => setReportForm({ ...reportForm, default_work_hours_start: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">終了時刻</label>
                  <input
                    type="time"
                    value={reportForm.default_work_hours_end}
                    onChange={e => setReportForm({ ...reportForm, default_work_hours_end: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {reportTypeLabel}作成時のデフォルト値として使用されます
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onSave}
                disabled={savingSection === sectionKey}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingSection === sectionKey ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
