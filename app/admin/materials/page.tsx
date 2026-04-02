'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  Package,
  Plus,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Pencil,
  Check,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { adminApi, ApiError } from '@/lib/api'

interface Material {
  id: string
  name: string
  defaultVolume: string | null
  defaultUnitPrice: number
  isActive: boolean
}

export default function MaterialsPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading, logout: handleLogout } = useAuth({ requiredPermission: 'manage_masters' })
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [newName, setNewName] = useState('')
  const [newVolume, setNewVolume] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingVolume, setEditingVolume] = useState('')

  const defaultMaterials = [
    'キクテック キクスイライン KL-115 白',
    'キクテック キクスイライン KL-215 黄',
    'キクテック ユニピースUB-108L',
    'トウペ トアライナー M用プライマー',
    'トウペ トアライナー P 黒',
    'トウペ トアライナーMR+α 黄NL',
    '昌和ペイント ラッカーシンナー 80シンナー',
    '大和ブロック 車止めブロック',
  ]

  useEffect(() => {
    if (!currentUser) return
    fetchMaterials()
  }, [currentUser])

  useEffect(() => {
    if (materials.length === 0 && !loading) {
      loadDefaultsAutomatically()
    }
  }, [materials, loading])

  const loadDefaultsAutomatically = async () => {
    try {
      await adminApi.loadDefaultMaterials()
      await fetchMaterials()
    } catch (err) {
      console.error('デフォルト材料自動登録エラー:', err)
    }
  }

  const fetchMaterials = async () => {
    try {
      const data = await adminApi.fetchMaterials()
      setMaterials(data.materials)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        router.push('/dashboard')
      } else {
        console.error('材料一覧取得エラー:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!newName.trim()) { setError('材料名を入力してください'); return }
    setSaving(true)
    setError('')
    try {
      const data = await adminApi.createMaterial({ name: newName, defaultVolume: newVolume || null }) as any
      setMaterials(prev => [...prev, data.material])
      setNewName('')
      setNewVolume('')
      setAddingNew(false)
      setMessage('材料を追加しました')
    } catch { setError('追加に失敗しました') }
    finally { setSaving(false) }
  }

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) { setError('材料名を入力してください'); return }
    setError('')
    try {
      await adminApi.updateMaterial({ id, name: editingName, defaultVolume: editingVolume || null })
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, name: editingName.trim(), defaultVolume: editingVolume.trim() || null } : m))
      setEditingId(null)
      setMessage('材料を更新しました')
    } catch { setError('更新に失敗しました') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この材料を削除しますか？')) return
    setError('')
    try {
      await adminApi.deleteMaterial({ id })
      setMaterials(prev => prev.filter(m => m.id !== id))
      setMessage('材料を削除しました')
    } catch { setError('削除に失敗しました') }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setError('')
    try {
      await adminApi.updateMaterial({ id, isActive: !currentActive })
      setMaterials(prev => prev.map(m => m.id === id ? { ...m, isActive: !currentActive } : m))
      setMessage(currentActive ? '材料を無効化しました' : '材料を有効化しました')
    } catch { setError('更新に失敗しました') }
  }

  if (authLoading || loading || !currentUser) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">読み込み中...</p></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-cyan-600 flex items-center justify-center">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">使用材料管理</h1>
                <p className="text-xs text-gray-500 hidden sm:block">材料マスタの登録・管理</p>
              </div>
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link href="/admin" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="管理画面"><Shield className="h-5 w-5" /></Link>
              <Link href="/dashboard" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="TOP画面"><Home className="h-5 w-5" /></Link>
              <Link href="/settings" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="設定"><Settings className="h-5 w-5" /></Link>
              <button onClick={handleLogout} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="ログアウト"><LogOut className="h-5 w-5" /></button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        <div className="mb-4">
          <Link href="/admin" className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />管理画面に戻る
          </Link>
        </div>

        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-green-500 hover:text-green-700"><X className="w-4 h-4" /></button>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Package className="w-5 h-5 mr-2 text-cyan-600" />
              使用材料リスト ({materials.length}件)
            </h2>
            <button
              onClick={() => { setAddingNew(!addingNew); setNewName(''); setNewVolume(''); setError('') }}
              className="inline-flex items-center px-3 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />新規追加
            </button>
          </div>

          {addingNew && (
            <div className="px-4 sm:px-6 py-4 bg-cyan-50 border-b border-cyan-200">
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">材料名 <span className="text-red-500">*</span></label>
                  <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="例: キクテック キクスイライン KL-115 白" autoFocus />
                </div>
                <div className="w-full sm:w-40">
                  <label className="block text-sm font-medium text-gray-700 mb-1">容量</label>
                  <input type="text" value={newVolume} onChange={e => setNewVolume(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    placeholder="例: 16ℓ" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => { setAddingNew(false); setNewName(''); setNewVolume('') }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">キャンセル</button>
                <button onClick={handleAdd} disabled={saving}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:bg-gray-400">
                  <Save className="w-4 h-4 mr-1" />{saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">材料名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">容量</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">状態</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-48">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">材料が登録されていません</p>
                    </td>
                  </tr>
                ) : (
                  materials.map(material => (
                    <tr key={material.id} className={`hover:bg-gray-50 transition-colors ${!material.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        {editingId === material.id ? (
                          <input type="text" value={editingName} onChange={e => setEditingName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleEdit(material.id); if (e.key === 'Escape') setEditingId(null) }}
                            className="w-full px-2 py-1 border border-cyan-300 rounded focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm" autoFocus />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{material.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === material.id ? (
                          <input type="text" value={editingVolume} onChange={e => setEditingVolume(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleEdit(material.id); if (e.key === 'Escape') setEditingId(null) }}
                            className="w-full px-2 py-1 border border-cyan-300 rounded focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                            placeholder="例: 16ℓ" />
                        ) : (
                          <span className="text-sm text-gray-600">{material.defaultVolume || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${material.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {material.isActive ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {editingId === material.id ? (
                            <>
                              <button onClick={() => handleEdit(material.id)} className="p-1 text-green-600 hover:bg-green-50 rounded" title="保存"><Check className="w-4 h-4" /></button>
                              <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="キャンセル"><X className="w-4 h-4" /></button>
                            </>
                          ) : (
                            <button onClick={() => { setEditingId(material.id); setEditingName(material.name); setEditingVolume(material.defaultVolume || '') }}
                              className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors" title="編集"><Pencil className="w-4 h-4" /></button>
                          )}
                          <button onClick={() => handleToggleActive(material.id, material.isActive)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${material.isActive ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                            {material.isActive ? '無効化' : '有効化'}
                          </button>
                          <button onClick={() => handleDelete(material.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="削除"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
