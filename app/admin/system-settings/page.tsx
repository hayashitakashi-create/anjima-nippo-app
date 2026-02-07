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
  Route,
  GripVertical,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Star,
} from 'lucide-react'

interface User {
  id: string
  name: string
  role: string
}

interface ApprovalRouteItem {
  id: string
  name: string
  roles: string[]
  isDefault: boolean
  isActive: boolean
  order: number
}

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
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<SystemSettings | null>(null)

  // セクション展開状態
  const [expandedSections, setExpandedSections] = useState({
    company: true,
    approval: true,
    approvalRoutes: true,
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

  // 承認ルート管理
  const [approvalRoutes, setApprovalRoutes] = useState<ApprovalRouteItem[]>([])
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState<ApprovalRouteItem | null>(null)
  const [routeForm, setRouteForm] = useState({
    name: '',
    roles: [] as string[],
    isDefault: false,
  })
  const [newRouteRole, setNewRouteRole] = useState('')
  const [routeLoading, setRouteLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data?.user) {
          if (data.user.role !== 'admin') {
            router.push('/dashboard')
            return
          }
          setCurrentUser(data.user)
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!currentUser) return
    fetchSettings()
    fetchApprovalRoutes()
  }, [currentUser])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/system-settings')
      if (res.ok) {
        const data = await res.json()
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
      } else if (res.status === 403) {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('設定取得エラー:', err)
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
    const res = await fetch('/api/admin/system-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || '保存に失敗しました')
    }

    return res.json()
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

  // === 承認ルート管理 ===
  const fetchApprovalRoutes = async () => {
    try {
      const res = await fetch('/api/admin/approval-routes')
      if (res.ok) {
        const data = await res.json()
        setApprovalRoutes(data.routes || [])
      }
    } catch (err) {
      console.error('承認ルート取得エラー:', err)
    }
  }

  const openNewRouteModal = () => {
    setEditingRoute(null)
    setRouteForm({ name: '', roles: [], isDefault: false })
    setNewRouteRole('')
    setShowRouteModal(true)
  }

  const openEditRouteModal = (route: ApprovalRouteItem) => {
    setEditingRoute(route)
    setRouteForm({ name: route.name, roles: [...route.roles], isDefault: route.isDefault })
    setNewRouteRole('')
    setShowRouteModal(true)
  }

  const handleAddRouteRole = () => {
    const roleToAdd = newRouteRole.trim()
    if (roleToAdd && !routeForm.roles.includes(roleToAdd)) {
      setRouteForm(prev => ({
        ...prev,
        roles: [...prev.roles, roleToAdd],
      }))
      setNewRouteRole('')
    }
  }

  const handleRemoveRouteRole = (index: number) => {
    setRouteForm(prev => ({
      ...prev,
      roles: prev.roles.filter((_, i) => i !== index),
    }))
  }

  const handleSaveRoute = async () => {
    if (!routeForm.name.trim()) {
      setSectionMessage('approvalRoutes', 'error', 'ルート名を入力してください')
      return
    }
    if (routeForm.roles.length === 0) {
      setSectionMessage('approvalRoutes', 'error', '承認者役職を1つ以上追加してください')
      return
    }

    setRouteLoading(true)
    try {
      const url = '/api/admin/approval-routes'
      const method = editingRoute ? 'PUT' : 'POST'
      const body = editingRoute
        ? { id: editingRoute.id, ...routeForm }
        : routeForm

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (res.ok) {
        setShowRouteModal(false)
        await fetchApprovalRoutes()
        setSectionMessage('approvalRoutes', 'success', '承認ルートを保存しました')
      } else {
        setSectionMessage('approvalRoutes', 'error', data.error || '保存に失敗しました')
      }
    } catch {
      setSectionMessage('approvalRoutes', 'error', '保存に失敗しました')
    } finally {
      setRouteLoading(false)
    }
  }

  const handleToggleRouteActive = async (route: ApprovalRouteItem) => {
    try {
      const res = await fetch('/api/admin/approval-routes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: route.id, isActive: !route.isActive }),
      })
      if (res.ok) {
        setSectionMessage('approvalRoutes', 'success', route.isActive ? '無効化しました' : '有効化しました')
        fetchApprovalRoutes()
      }
    } catch {
      setSectionMessage('approvalRoutes', 'error', '更新に失敗しました')
    }
  }

  const handleSetDefaultRoute = async (route: ApprovalRouteItem) => {
    try {
      const res = await fetch('/api/admin/approval-routes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: route.id, isDefault: true }),
      })
      if (res.ok) {
        setSectionMessage('approvalRoutes', 'success', `「${route.name}」をデフォルトに設定しました`)
        fetchApprovalRoutes()
      }
    } catch {
      setSectionMessage('approvalRoutes', 'error', '更新に失敗しました')
    }
  }

  const handleDeleteRoute = async (route: ApprovalRouteItem) => {
    if (!confirm(`「${route.name}」を削除しますか？`)) return
    try {
      const res = await fetch(`/api/admin/approval-routes?id=${route.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok) {
        setSectionMessage('approvalRoutes', 'success', data.message)
        fetchApprovalRoutes()
      } else {
        setSectionMessage('approvalRoutes', 'error', data.error || '削除に失敗しました')
      }
    } catch {
      setSectionMessage('approvalRoutes', 'error', '削除に失敗しました')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
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
            <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
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
        {/* TOPに戻る */}
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            TOPに戻る
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

          {/* 承認ルート管理 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('approvalRoutes')}
              className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Route className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg font-bold text-gray-900">承認ルート管理</h2>
                  <p className="text-xs text-gray-500">複数の承認フローを設定</p>
                </div>
              </div>
              {expandedSections.approvalRoutes ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedSections.approvalRoutes && (
              <div className="px-4 sm:px-6 pb-6 border-t border-slate-200">
                {sectionMessages.approvalRoutes && (
                  <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
                    sectionMessages.approvalRoutes.type === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{sectionMessages.approvalRoutes.text}</span>
                  </div>
                )}

                <div className="mt-4">
                  {/* 新規追加ボタン */}
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      日報提出時に選択できる承認ルートを管理します
                    </p>
                    <button
                      onClick={openNewRouteModal}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      新規ルート
                    </button>
                  </div>

                  {/* ルート一覧 */}
                  {approvalRoutes.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Route className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">承認ルートがまだ登録されていません</p>
                      <p className="text-gray-400 text-xs mt-1">「新規ルート」から追加してください</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {approvalRoutes.map(route => (
                        <div
                          key={route.id}
                          className={`border rounded-lg p-4 transition-all ${
                            route.isActive
                              ? 'border-gray-200 bg-white'
                              : 'border-gray-100 bg-gray-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-bold text-gray-900">{route.name}</span>
                                {route.isDefault && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                    <Star className="w-3 h-3" />
                                    デフォルト
                                  </span>
                                )}
                                {!route.isActive && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                    無効
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {route.roles.map((role, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded"
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* 操作ボタン */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!route.isDefault && route.isActive && (
                                <button
                                  onClick={() => handleSetDefaultRoute(route)}
                                  className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                  title="デフォルトに設定"
                                >
                                  <Star className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => openEditRouteModal(route)}
                                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                title="編集"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleRouteActive(route)}
                                className={`p-1.5 rounded transition-colors ${
                                  route.isActive
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title={route.isActive ? '無効化' : '有効化'}
                              >
                                {route.isActive ? (
                                  <ToggleRight className="w-4 h-4" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteRoute(route)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="削除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 承認ルート作成/編集モーダル */}
          {showRouteModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Route className="w-5 h-5" />
                      {editingRoute ? '承認ルート編集' : '新規承認ルート'}
                    </h3>
                    <button
                      onClick={() => setShowRouteModal(false)}
                      className="text-white/80 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* ルート名 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ルート名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={routeForm.name}
                      onChange={e => setRouteForm({ ...routeForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="例: 社長決裁、部長決裁"
                    />
                  </div>

                  {/* 承認者役職リスト */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      承認者役職 <span className="text-red-500">*</span>
                    </label>

                    {routeForm.roles.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {routeForm.roles.map((role, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded text-sm text-indigo-700">
                              {role}
                            </div>
                            <button
                              onClick={() => handleRemoveRouteRole(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 役職選択 (既存の承認者役職リストから選択 + 手入力) */}
                    <div className="flex items-center gap-2">
                      <select
                        value={newRouteRole}
                        onChange={e => {
                          const selected = e.target.value
                          setNewRouteRole(selected)
                          if (selected && !routeForm.roles.includes(selected)) {
                            setRouteForm(prev => ({
                              ...prev,
                              roles: [...prev.roles, selected],
                            }))
                            setNewRouteRole('')
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm"
                      >
                        <option value="">役職を選択...</option>
                        {(settings?.approval_roles || [])
                          .filter(r => !routeForm.roles.includes(r))
                          .map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))
                        }
                      </select>
                      <button
                        onClick={handleAddRouteRole}
                        disabled={!newRouteRole}
                        className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      システム設定の「承認者役職リスト」から選択できます
                    </p>
                  </div>

                  {/* デフォルト設定 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">デフォルトルート</p>
                      <p className="text-xs text-gray-500">日報作成時に自動選択されます</p>
                    </div>
                    <button
                      onClick={() => setRouteForm({ ...routeForm, isDefault: !routeForm.isDefault })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        routeForm.isDefault ? 'bg-indigo-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          routeForm.isDefault ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* ボタン */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveRoute}
                      disabled={routeLoading}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {routeLoading ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={() => setShowRouteModal(false)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

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
        </div>
      </main>
    </div>
  )
}
