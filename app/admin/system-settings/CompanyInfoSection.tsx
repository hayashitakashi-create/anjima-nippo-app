'use client'

import { ChevronDown, ChevronUp, Building2, AlertCircle, Save } from 'lucide-react'

interface CompanyForm {
  company_name: string
  company_address: string
  company_phone: string
  company_fax: string
}

interface CompanyInfoSectionProps {
  companyForm: CompanyForm
  setCompanyForm: (form: CompanyForm) => void
  expanded: boolean
  onToggle: () => void
  sectionMessage?: { type: 'success' | 'error'; text: string }
  savingSection: string | null
  onSave: () => void | Promise<void>
}

export default function CompanyInfoSection({
  companyForm,
  setCompanyForm,
  expanded,
  onToggle,
  sectionMessage,
  savingSection,
  onSave,
}: CompanyInfoSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">会社情報</h2>
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
                会社名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyForm.company_name}
                onChange={e => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="株式会社〇〇"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
              <input
                type="text"
                value={companyForm.company_address}
                onChange={e => setCompanyForm({ ...companyForm, company_address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder="東京都〇〇区..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
                <input
                  type="tel"
                  value={companyForm.company_phone}
                  onChange={e => setCompanyForm({ ...companyForm, company_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="03-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FAX番号</label>
                <input
                  type="tel"
                  value={companyForm.company_fax}
                  onChange={e => setCompanyForm({ ...companyForm, company_fax: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="03-1234-5679"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onSave}
                disabled={savingSection === 'company'}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {savingSection === 'company' ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
