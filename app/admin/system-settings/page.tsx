'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { adminApi, apiGet } from '@/lib/api'
import { ApprovalRoutesSection } from './ApprovalRoutesSection'
import { PermissionsSection } from './PermissionsSection'
import CompanyInfoSection from './CompanyInfoSection'
import ApprovalSettingsSection from './ApprovalSettingsSection'
import ReportSettingsSection from './ReportSettingsSection'
import SystemSection from './SystemSection'

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
          <CompanyInfoSection
            companyForm={companyForm}
            setCompanyForm={setCompanyForm}
            expanded={expandedSections.company}
            onToggle={() => toggleSection('company')}
            sectionMessage={sectionMessages.company}
            savingSection={savingSection}
            onSave={handleSaveCompany}
          />

          {/* 承認設定 */}
          <ApprovalSettingsSection
            approvalForm={approvalForm}
            setApprovalForm={setApprovalForm}
            newRole={newRole}
            setNewRole={setNewRole}
            onAddRole={handleAddRole}
            onRemoveRole={handleRemoveRole}
            expanded={expandedSections.approval}
            onToggle={() => toggleSection('approval')}
            sectionMessage={sectionMessages.approval}
            savingSection={savingSection}
            onSave={handleSaveApproval}
          />

          <ApprovalRoutesSection approvalRoles={settings?.approval_roles || []} />

          {/* 営業日報設定 */}
          <ReportSettingsSection
            variant="sales"
            reportForm={salesReportForm}
            setReportForm={setSalesReportForm}
            expanded={expandedSections.salesReport}
            onToggle={() => toggleSection('salesReport')}
            sectionMessage={sectionMessages.salesReport}
            savingSection={savingSection}
            onSave={handleSaveSalesReport}
          />

          {/* 作業日報設定 */}
          <ReportSettingsSection
            variant="work"
            reportForm={workReportForm}
            setReportForm={setWorkReportForm}
            expanded={expandedSections.workReport}
            onToggle={() => toggleSection('workReport')}
            sectionMessage={sectionMessages.workReport}
            savingSection={savingSection}
            onSave={handleSaveWorkReport}
          />

          {/* システム設定 */}
          <SystemSection
            systemForm={systemForm}
            setSystemForm={setSystemForm}
            expanded={expandedSections.system}
            onToggle={() => toggleSection('system')}
            sectionMessage={sectionMessages.system}
            savingSection={savingSection}
            onSave={handleSaveSystem}
          />

          <PermissionsSection initialPermissions={permissionsForm} onSaved={fetchSettings} />
        </div>
      </main>
    </div>
  )
}
