'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlertCircle,
  Route,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Star,
  Save,
  X,
} from 'lucide-react'
import { adminApi } from '@/lib/api'

interface ApprovalRouteItem {
  id: string
  name: string
  roles: string[]
  isDefault: boolean
  isActive: boolean
  order: number
}

interface ApprovalRoutesSectionProps {
  approvalRoles: string[]
}

export function ApprovalRoutesSection({ approvalRoles }: ApprovalRoutesSectionProps) {
  const [expanded, setExpanded] = useState(true)
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
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const fetchApprovalRoutes = useCallback(async () => {
    try {
      const data = await adminApi.fetchApprovalRoutes() as any
      setApprovalRoutes(data.routes || [])
    } catch (err) {
      console.error('承認ルート取得エラー:', err)
    }
  }, [])

  useEffect(() => {
    fetchApprovalRoutes()
  }, [fetchApprovalRoutes])

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
      showMessage('error', 'ルート名を入力してください')
      return
    }
    if (routeForm.roles.length === 0) {
      showMessage('error', '承認者役職を1つ以上追加してください')
      return
    }

    setRouteLoading(true)
    try {
      if (editingRoute) {
        await adminApi.updateApprovalRoute({ id: editingRoute.id, ...routeForm })
      } else {
        await adminApi.createApprovalRoute(routeForm)
      }
      setShowRouteModal(false)
      await fetchApprovalRoutes()
      showMessage('success', '承認ルートを保存しました')
    } catch (err: any) {
      showMessage('error', err.message || '保存に失敗しました')
    } finally {
      setRouteLoading(false)
    }
  }

  const handleToggleRouteActive = async (route: ApprovalRouteItem) => {
    try {
      await adminApi.updateApprovalRoute({ id: route.id, isActive: !route.isActive })
      showMessage('success', route.isActive ? '無効化しました' : '有効化しました')
      fetchApprovalRoutes()
    } catch {
      showMessage('error', '更新に失敗しました')
    }
  }

  const handleSetDefaultRoute = async (route: ApprovalRouteItem) => {
    try {
      await adminApi.updateApprovalRoute({ id: route.id, isDefault: true })
      showMessage('success', `「${route.name}」をデフォルトに設定しました`)
      fetchApprovalRoutes()
    } catch {
      showMessage('error', '更新に失敗しました')
    }
  }

  const handleDeleteRoute = async (route: ApprovalRouteItem) => {
    if (!confirm(`「${route.name}」を削除しますか？`)) return
    try {
      const data = await adminApi.deleteApprovalRoute(route.id) as any
      showMessage('success', data.message)
      fetchApprovalRoutes()
    } catch (err: any) {
      showMessage('error', err.message || '削除に失敗しました')
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setExpanded(prev => !prev)}
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
                    {approvalRoles
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
    </>
  )
}
