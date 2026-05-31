'use client'

import { useState, useEffect } from 'react'
import { X, Shield } from 'lucide-react'
import { adminApi } from '@/lib/api'

interface Props {
  projectTypeId: string
  projectTypeName: string
  onClose: () => void
}

interface SimpleUser {
  id: string
  name: string
  position?: string | null
}

// 工種別の追加承認者(部長など)を設定するモーダル (田邊様5/28 FB①)
// 常務・専務・社長は全工種で自動的に承認枠に入るため、ここでは追加分のみ選ぶ
export function ProjectTypeApproverModal({ projectTypeId, projectTypeName, onClose }: Props) {
  const [users, setUsers] = useState<SimpleUser[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      adminApi.fetchUsers(),
      adminApi.fetchProjectTypeApprovers(projectTypeId),
    ])
      .then(([uData, aData]) => {
        const list = (uData.users as any[])
          .filter((u) => u.isActive !== false && !['社長', '専務', '常務'].includes(u.position || ''))
          .map((u) => ({ id: u.id, name: u.name, position: u.position }))
        setUsers(list)
        setSelectedIds(new Set((aData.approvers || []).map((a: any) => a.userId)))
      })
      .catch(() => setError('データの取得に失敗しました'))
      .finally(() => setLoading(false))
  }, [projectTypeId])

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setDone(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const approvers = [...selectedIds].map((userId, idx) => ({
        userId,
        approverRole: '部長',
        order: idx,
      }))
      await adminApi.saveProjectTypeApprovers(projectTypeId, approvers)
      setDone(true)
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            承認者設定: {projectTypeName}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          <p className="text-xs text-gray-500 mb-3">
            この工種の作業日報は <span className="font-medium">常務・専務・社長</span> が自動で承認枠に入ります。
            追加で承認する社員（部長など）を選んでください。
          </p>
          {loading ? (
            <p className="text-sm text-gray-400 py-4 text-center">読み込み中...</p>
          ) : (
            <div className="space-y-1">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u.id)}
                    onChange={() => toggle(u.id)}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-900">{u.name}</span>
                  {u.position && <span className="text-xs text-gray-400">{u.position}</span>}
                </label>
              ))}
            </div>
          )}
          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
          {done && <p className="text-xs text-emerald-700 mt-2">保存しました。</p>}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-200">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
            閉じる
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 text-sm font-medium">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
