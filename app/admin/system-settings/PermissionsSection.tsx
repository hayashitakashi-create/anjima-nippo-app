'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Save,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

const PERMISSION_DEFINITIONS = [
  { key: 'view_all_reports', label: '全員の日報閲覧', description: '他ユーザーの日報を閲覧可能' },
  { key: 'edit_all_reports', label: '全員の日報編集', description: '他ユーザーの日報を編集可能' },
  { key: 'approve_reports', label: '日報の承認', description: '日報を承認・差し戻し可能' },
  { key: 'manage_users', label: 'ユーザー管理', description: 'ユーザーの追加・編集・削除' },
  { key: 'manage_masters', label: 'マスタ管理', description: '案件・材料・外注先等の管理' },
  { key: 'system_settings', label: 'システム設定', description: 'システム全体の設定変更' },
  { key: 'view_audit_log', label: '操作ログ閲覧', description: '操作ログの閲覧' },
  { key: 'bulk_print', label: '一括印刷', description: '日報の一括印刷' },
  { key: 'view_aggregation', label: '集計閲覧', description: '労働時間・現場別集計の閲覧' },
  { key: 'view_all_analytics', label: '全社分析', description: '全社員の分析データ閲覧' },
] as const

const ADMIN_LOCKED_KEYS = ['system_settings', 'manage_users']

interface PermissionsSectionProps {
  initialPermissions: Record<string, Record<string, boolean>>
  onSaved: () => void
}

export function PermissionsSection({ initialPermissions, onSaved }: PermissionsSectionProps) {
  const [expanded, setExpanded] = useState(true)
  const [permissionsForm, setPermissionsForm] = useState(initialPermissions)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleTogglePermission = (role: string, key: string) => {
    if (role === 'admin' && ADMIN_LOCKED_KEYS.includes(key)) return
    setPermissionsForm(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key],
      },
    }))
  }

  const handleSavePermissions = async () => {
    setSaving(true)
    try {
      await adminApi.saveSystemSetting('role_permissions', permissionsForm)
      showMessage('success', '権限設定を保存しました')
      onSaved()
    } catch (err: any) {
      showMessage('error', err.message || '保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-left">
            <h2 className="text-lg font-bold text-gray-900">権限設定</h2>
            <p className="text-xs text-gray-500">ロールごとの機能アクセス権限を管理</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 sm:px-6 pb-6 border-t border-slate-200">
          {message && (
            <div className={`mt-4 p-3 rounded-lg flex items-start space-x-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-4">
              各ロールがどの機能にアクセスできるかをトグルで設定します。
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-700">機能</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700 w-24">管理者</th>
                    <th className="text-center py-3 px-2 font-medium text-gray-700 w-24">一般</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_DEFINITIONS.map((perm) => {
                    const isAdminLocked = ADMIN_LOCKED_KEYS.includes(perm.key)
                    return (
                      <tr key={perm.key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2">
                          <div className="font-medium text-gray-900">{perm.label}</div>
                          <div className="text-xs text-gray-500">{perm.description}</div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center">
                            {isAdminLocked ? (
                              <div className="flex items-center gap-1 text-gray-400" title="管理者は常にON">
                                <Lock className="w-3.5 h-3.5" />
                                <span className="text-xs">常時ON</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleTogglePermission('admin', perm.key)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  permissionsForm.admin?.[perm.key] ? 'bg-purple-600' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    permissionsForm.admin?.[perm.key] ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleTogglePermission('user', perm.key)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                permissionsForm.user?.[perm.key] ? 'bg-purple-600' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  permissionsForm.user?.[perm.key] ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  管理者の「システム設定」と「ユーザー管理」は常にONです（ロックアウト防止のため変更できません）。
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
