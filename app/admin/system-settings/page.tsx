'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  Building2,
  FileCheck,
  ClipboardList,
  Cog,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { adminApi, apiGet } from '@/lib/api'
import { ApprovalRoutesSection } from './ApprovalRoutesSection'
import { PermissionsSection } from './PermissionsSection'

interface SystemSettings {
  // 会社情報
  company_name: string
  company_address: string
  company_phone: string
  company_fax: string
  // 承認設定
  approval_roles: string[]
  auto_approve_days: number
  // 日報設定
  report_reminder_enabled: boolean
  report_reminder_time: string
  default_work_hours_start: string
  default_work_hours_end: string
  // システム設定
  data_retention_days: number
  session_timeout_hours: number
}

export default function SystemSettingsPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading, logout: handleLogout } = useAuth({ requiredPermission: 'system_settings' })
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<SystemSettings | null>(null)

  // セクション展開状態
  const [expandedSections, setExpandedSections] = useState({
    company: true,
    approval: true,
    salesReport: true,
    workReport: true,
    system: true,
  })

  // 各セクションの保存状態
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [sectionMessages, setSectionMessages] = useState<Record<string, { type: 'success' | 'error', text: string }>>({})

  // フォームデータ
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_fax: '',
  })

  const [approvalForm, setApprovalForm] = useState({
    approval_roles: [] as string[],
    auto_approve_days: 0,
  })

  const [salesReportForm, setSalesReportForm] = useState({
    report_reminder_enabled: true,
    report_reminder_time: '17:00',
    default_work_hours_start: '08:00',
    default_work_hours_end: '17:00',
  })

  const [workReportForm, setWorkReportForm] = useState({
    report_reminder_enabled: true,
    report_reminder_time: '17:00',
    default_work_hours_start: '08:00',
    default_work_hours_end: '17:00',
  })

  const [systemForm, setSystemForm] = useState({
    data_retention_days: 365,
    session_timeout_hours: 720,
  })

  // 新しい役職追加用
  const [newRole, setNewRole] = useState('')

  // 権限設定の初期値
  const PERMISSION_KEYS = [
    'view_all_reports', 'edit_all_reports', 'approve_reports', 'manage_users',
    'manage_masters', 'system_settings', 'view_audit_log', 'bulk_print',
    'view_aggregation', 'view_all_analytics',
  ]
  const [permissionsForm, setPermissionsForm] = useState<Record<string, Record<string, boolean>>>({
    admin: Object.fromEntries(PERMISSION_KEYS.map(k => [k, true])),
    user: Object.fromEntries(PERMISSION_KEYS.map(k => [k, false])),
  })

  useEffect(() => {
    if (!currentUser) return
    fetchSettings()
  }, [currentUser])

  const fetchSettings = async () => {
    try {
      const data = await apiGet<any>('/api/admin/system-settings')
      setSettings(data.settings)

      // フォームに初期値を設定
      setCompanyForm({
        company_name: data.settings.company_name || '',
        company_address: data.settings.company_address || '',
        company_phone: data.settings.company_phone || '',
        company_fax: data.settings.company_fax || '',
      })

      setApprovalForm({
        approval_roles: data.settings.approval_roles || [],
        auto_approve_days: data.settings.auto_approve_days || 0,
      })

      setSalesReportForm({
        report_reminder_enabled: data.settings.sales_report_reminder_enabled !== false,
        report_reminder_time: data.settings.sales_report_reminder_time || '17:00',
        default_work_hours_start: data.settings.sales_default_work_hours_start || '08:00',
        default_work_hours_end: data.settings.sales_default_work_hours_end || '17:00',
      })

      setWorkReportForm({
        report_reminder_enabled: data.settings.work_report_reminder_enabled !== false,
        report_reminder_time: data.settings.work_report_reminder_time || '17:00',
        default_work_hours_start: data.settings.work_default_work_hours_start || '08:00',
        default_work_hours_end: data.settings.work_default_work_hours_end || '17:00',
      })

      setSystemForm({
        data_retention_days: data.settings.data_retention_days || 365,
        session_timeout_hours: data.settings.session_timeout_hours || 720,
      })

      // 権限設定の読み込み
      if (data.settings.role_permissions) {
        const rp = data.settings.role_permissions
        setPermissionsForm(prev => {
          const merged: Record<string, Record<string, boolean>> = {}
          for (const role of ['admin', 'user']) {
            merged[role] = { ...prev[role] }
            if (rp[role]) {
              for (const key of PERMISSION_KEYS) {
                if (typeof rp[role][key] === 'boolean') {
                  merged[role][key] = rp[role][key]
                }
              }
            }
          }
          return merged
        })
      }
    } catch (err: any) {
      if (err.status === 403) {
        router.push('/dashboard')
      } else {
        console.error('設定取得エラー:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const setSectionMessage = (section: string, type: 'success' | 'error', text: string) => {
    setSectionMessages(prev => ({ ...prev, [section]: { type, text } }))
    setTimeout(() => {
      setSectionMessages(prev => {
        const newMessages = { ...prev }
        delete newMessages[section]
        return newMessages
      })
    }, 5000)
  }

  const saveSetting = async (key: string, value: any) => {
    return adminApi.saveSystemSetting(key, value)
  }

  // 会社情報の保存
  const handleSaveCompany = async () => {
    setSavingSection('company')
    try {
      await Promise.all([
        saveSetting('company_name', companyForm.company_name),
        saveSetting('company_address', companyForm.company_address),
        saveSetting('company_phone', companyForm.company_phone),
        saveSetting('company_fax', companyForm.company_fax),
      ])
      setSectionMessage('company', 'success', '会社情報を保存しました')
      await fetchSettings()
    } catch (error: any) {
      setSectionMessage('company', 'error', error.message || '保存に失敗しました')
    } finally {
      setSavingSection(null)
    }
  }

  // 承認設定の保存
  const handleSaveApproval = async () => {
    setSavingSection('approval')
    try {
      await Promise.all([
        saveSetting('approval_roles', approvalForm.approval_roles),
        saveSetting('auto_approve_days', approvalForm.auto_approve_days),
      ])
      setSectionMessage('approval', 'success', '承認設定を保存しました')
      await fetchSettings()
    } catch (error: any) {
      setSectionMessage('approval', 'error', error.message || '保存に失敗しました')
    } finally {
      setSavingSection(null)
    }
  }

  // 営業日報設定の保存
  const handleSaveSalesReport = async () => {
    setSavingSection('salesReport')
    try {
      await Promise.all([
        saveSetting('sales_report_reminder_enabled', salesReportForm.report_reminder_enabled),
        saveSetting('sales_report_reminder_time', salesReportForm.report_reminder_time),
        saveSetting('sales_default_work_hours_start', salesReportForm.default_work_hours_start),
        saveSetting('sales_default_work_hours_end', salesReportForm.default_work_hours_end),
      ])
      setSectionMessage('salesReport', 'success', '営業日報設定を保存しました')
      await fetchSettings()
    } catch (error: any) {
      setSectionMessage('salesReport', 'error', error.message || '保存に失敗しました')
    } finally {
      setSavingSection(null)
    }
  }

  // 作業日報設定の保存
  const handleSaveWorkReport = async () => {
    setSavingSection('workReport')
    try {
      await Promise.all([
        saveSetting('work_report_reminder_enabled', workReportForm.report_reminder_enabled),
        saveSetting('work_report_reminder_time', workReportForm.report_reminder_time),
        saveSetting('work_default_work_hours_start', workReportForm.default_work_hours_start),
        saveSetting('work_default_work_hours_end', workReportForm.default_work_hours_end),
      ])
      setSectionMessage('workReport', 'success', '作業日報設定を保存しました')
      await fetchSettings()
    } catch (error: any) {
      setSectionMessage('workReport', 'error', error.message || '保存に失敗しました')
    } finally {
      setSavingSection(null)
    }
  }

  // システム設定の保存
  const handleSaveSystem = async () => {
    setSavingSection('system')
    try {
      await Promise.all([
        saveSetting('data_retention_days', systemForm.data_retention_days),
        saveSetting('session_timeout_hours', systemForm.session_timeout_hours),
      ])
      setSectionMessage('system', 'success', 'システム設定を保存しました')
      await fetchSettings()
    } catch (error: any) {
      setSectionMessage('system', 'error', error.message || '保存に失敗しました')
    } finally {
      setSavingSection(null)
    }
  }


  // 役職の追加
  const handleAddRole = () => {
    if (newRole.trim() && !approvalForm.approval_roles.includes(newRole.trim())) {
      setApprovalForm(prev => ({
        ...prev,
        approval_roles: [...prev.approval_roles, newRole.trim()],
      }))
      setNewRole('')
    }
  }

  // 役職の削除
  const handleRemoveRole = (index: number) => {
    setApprovalForm(prev => ({
      ...prev,
      approval_roles: prev.approval_roles.filter((_, i) => i !== index),
    }))
  }




  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">システム設定</h1>
                <p className="text-xs text-gray-500 hidden sm:block">各種設定の管理</p>
              </div>
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link href="/admin" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="管理画面">
                <Shield className="h-5 w-5" />
              </Link>
              <Link href="/dashboard" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="TOP画面">
                <Home className="h-5 w-5" />
              </Link>
              <Link href="/settings" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="設定">
                <Settings className="h-5 w-5" />
              </Link>
              <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ログアウト">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 py-6">
        {/* 管理画面に戻る */}
        <div className="mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            管理画面に戻る
          </Link>
        </div>

        <div className="space-y-6">
          {/* 会社情報 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('company')}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">会社情報</h2>
              </div>
              {expandedSections.company ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.company && (
              <div className="px-4 sm:px-6 pb-6 border-t border-slate-200">
                {sectionMessages.company && (
                  <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
                    sectionMessages.company.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{sectionMessages.company.text}</span>
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
                      onClick={handleSaveCompany}
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

          {/* 承認設定 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('approval')}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">承認設定</h2>
              </div>
              {expandedSections.approval ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.approval && (
              <div className="px-4 sm:px-6 pb-6 border-t border-slate-200">
                {sectionMessages.approval && (
                  <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
                    sectionMessages.approval.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{sectionMessages.approval.text}</span>
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      承認者役職リスト
                    </label>

                    {/* 役職リスト */}
                    <div className="space-y-2 mb-3">
                      {approvalForm.approval_roles.map((role, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                            {role}
                          </div>
                          <button
                            onClick={() => handleRemoveRole(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 新規追加 */}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newRole}
                        onChange={e => setNewRole(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddRole()}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm"
                        placeholder="新しい役職を追加"
                      />
                      <button
                        onClick={handleAddRole}
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
                      onClick={handleSaveApproval}
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

          <ApprovalRoutesSection approvalRoles={settings?.approval_roles || []} />

          {/* 営業日報設定 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('salesReport')}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">営業日報設定</h2>
              </div>
              {expandedSections.salesReport ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.salesReport && (
              <div className="px-4 sm:px-6 pb-6 border-t border-slate-200">
                {sectionMessages.salesReport && (
                  <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
                    sectionMessages.salesReport.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{sectionMessages.salesReport.text}</span>
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">日報リマインダー</p>
                      <p className="text-xs text-gray-500 mt-0.5">未提出日報の通知を有効化</p>
                    </div>
                    <button
                      onClick={() => setSalesReportForm({ ...salesReportForm, report_reminder_enabled: !salesReportForm.report_reminder_enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        salesReportForm.report_reminder_enabled ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          salesReportForm.report_reminder_enabled ? 'translate-x-6' : 'translate-x-1'
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
                      value={salesReportForm.report_reminder_time}
                      onChange={e => setSalesReportForm({ ...salesReportForm, report_reminder_time: e.target.value })}
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
                          value={salesReportForm.default_work_hours_start}
                          onChange={e => setSalesReportForm({ ...salesReportForm, default_work_hours_start: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">終了時刻</label>
                        <input
                          type="time"
                          value={salesReportForm.default_work_hours_end}
                          onChange={e => setSalesReportForm({ ...salesReportForm, default_work_hours_end: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      営業日報作成時のデフォルト値として使用されます
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveSalesReport}
                      disabled={savingSection === 'salesReport'}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savingSection === 'salesReport' ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 作業日報設定 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('workReport')}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-teal-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">作業日報設定</h2>
              </div>
              {expandedSections.workReport ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.workReport && (
              <div className="px-4 sm:px-6 pb-6 border-t border-slate-200">
                {sectionMessages.workReport && (
                  <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
                    sectionMessages.workReport.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{sectionMessages.workReport.text}</span>
                  </div>
                )}

                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">日報リマインダー</p>
                      <p className="text-xs text-gray-500 mt-0.5">未提出日報の通知を有効化</p>
                    </div>
                    <button
                      onClick={() => setWorkReportForm({ ...workReportForm, report_reminder_enabled: !workReportForm.report_reminder_enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        workReportForm.report_reminder_enabled ? 'bg-purple-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          workReportForm.report_reminder_enabled ? 'translate-x-6' : 'translate-x-1'
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
                      value={workReportForm.report_reminder_time}
                      onChange={e => setWorkReportForm({ ...workReportForm, report_reminder_time: e.target.value })}
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
                          value={workReportForm.default_work_hours_start}
                          onChange={e => setWorkReportForm({ ...workReportForm, default_work_hours_start: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">終了時刻</label>
                        <input
                          type="time"
                          value={workReportForm.default_work_hours_end}
                          onChange={e => setWorkReportForm({ ...workReportForm, default_work_hours_end: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      作業日報作成時のデフォルト値として使用されます
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveWorkReport}
                      disabled={savingSection === 'workReport'}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savingSection === 'workReport' ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* システム設定 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('system')}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Cog className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">システム</h2>
              </div>
              {expandedSections.system ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.system && (
              <div className="px-4 sm:px-6 pb-6 border-t border-slate-200">
                {sectionMessages.system && (
                  <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
                    sectionMessages.system.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{sectionMessages.system.text}</span>
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
                      onClick={handleSaveSystem}
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

          <PermissionsSection initialPermissions={permissionsForm} onSaved={fetchSettings} />
        </div>
      </main>
    </div>
  )
}
