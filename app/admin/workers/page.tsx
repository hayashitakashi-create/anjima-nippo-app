'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  Users,
  Plus,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Pencil,
  Check,
  GripVertical,
} from 'lucide-react'

interface User {
  id: string
  name: string
  role: string
}

interface WorkerName {
  id: string
  name: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export default function WorkersPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [workers, setWorkers] = useState<WorkerName[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // 新規追加フォーム
  const [newWorker, setNewWorker] = useState('')
  const [addingNew, setAddingNew] = useState(false)

  // 編集用
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // ドラッグ&ドロップ用
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // デフォルト作業者リスト
  const defaultWorkers = [
    '古藤　英紀', '矢野　誠', '山内　正和', '大塚　崇', '中原　稔', '三嶋　晶',
    '伊藤　勝', '古曳　正樹', '松本　太', '佐野　弘和', '満田　純一', '齊藤　慰丈',
    '井原　晃', '松本　誠', '加藤　光', '堀内　光雄', '梶谷　純', '金藤　恵子',
    '安島　圭介', '山﨑　伸一', '足立　憲吉', '福田　誠', '安島　隆', '金山　昭徳',
    '安島　篤志', '松本　倫典', '田邊　沙帆', '古川　一彦', '内田　邦男', '藤原　秀夫',
    '田中　剛士', '小林　敬博', '福代　司', '池野　大樹', '中谷　凜大', '安部　倫太朗',
  ]

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
          if (!data.user.permissions?.manage_masters) {
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
    fetchWorkers()
  }, [currentUser])

  // 初回ロード時にデフォルトデータがなければ自動登録
  useEffect(() => {
    if (workers.length === 0 && !loading) {
      loadDefaultsAutomatically()
    }
  }, [workers, loading])

  const loadDefaultsAutomatically = async () => {
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workers: defaultWorkers }),
      })
      if (res.ok) {
        await fetchWorkers()
      }
    } catch (err) {
      console.error('デフォルト作業者名自動登録エラー:', err)
    }
  }

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/admin/workers')
      if (res.ok) {
        const data = await res.json()
        setWorkers(data.workers)
      } else if (res.status === 403) {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('作業者名一覧取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorker = async () => {
    if (!newWorker.trim()) {
      setError('作業者名を入力してください')
      return
    }

    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorker }),
      })
      if (res.ok) {
        const data = await res.json()
        setWorkers(prev => [...prev, data.worker])
        setNewWorker('')
        setAddingNew(false)
        setMessage('作業者名を追加しました')
      } else {
        const data = await res.json()
        setError(data.error || '追加に失敗しました')
      }
    } catch {
      setError('追加に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この作業者名を削除しますか？')) return

    setError('')
    try {
      const res = await fetch(`/api/admin/workers?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setWorkers(prev => prev.filter(w => w.id !== id))
        setMessage('作業者名を削除しました')
      } else {
        const data = await res.json()
        setError(data.error || '削除に失敗しました')
      }
    } catch {
      setError('削除に失敗しました')
    }
  }

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setError('')
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentActive }),
      })
      if (res.ok) {
        setWorkers(prev =>
          prev.map(w => (w.id === id ? { ...w, isActive: !currentActive } : w))
        )
        setMessage(currentActive ? '作業者名を無効化しました' : '作業者名を有効化しました')
      } else {
        const data = await res.json()
        setError(data.error || '更新に失敗しました')
      }
    } catch {
      setError('更新に失敗しました')
    }
  }

  const handleEditName = async (id: string) => {
    if (!editingName.trim()) {
      setError('作業者名を入力してください')
      return
    }
    setError('')
    try {
      const res = await fetch('/api/admin/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editingName }),
      })
      if (res.ok) {
        setWorkers(prev =>
          prev.map(w => (w.id === id ? { ...w, name: editingName.trim() } : w))
        )
        setEditingId(null)
        setEditingName('')
        setMessage('作業者名を更新しました')
      } else {
        const data = await res.json()
        setError(data.error || '更新に失敗しました')
      }
    } catch {
      setError('更新に失敗しました')
    }
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }

    const newList = [...workers]
    const [moved] = newList.splice(dragIndex, 1)
    newList.splice(index, 0, moved)

    const reorder = newList.map((w, i) => ({ id: w.id, sortOrder: i }))
    setWorkers(newList)
    setDragIndex(null)
    setDragOverIndex(null)

    try {
      await fetch('/api/admin/workers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder }),
      })
    } catch {
      setWorkers(workers)
      setError('並び替えに失敗しました')
    }
  }

  const handleDragEnd = () => {
    setDragIndex(null)
    setDragOverIndex(null)
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
            <Link href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-600 flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">作業者名管理</h1>
                <p className="text-xs text-gray-500 hidden sm:block">作業者名マスタの登録・管理</p>
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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            管理画面に戻る
          </Link>
        </div>

        {/* メッセージ */}
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{message}</span>
            <button onClick={() => setMessage('')} className="text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 作業者名リスト */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-teal-600" />
              作業者名リスト ({workers.length}件)
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setAddingNew(!addingNew)
                  setNewWorker('')
                  setError('')
                }}
                className="inline-flex items-center px-3 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                新規追加
              </button>
            </div>
          </div>

          {/* 新規追加フォーム */}
          {addingNew && (
            <div className="px-4 sm:px-6 py-4 bg-teal-50 border-b border-teal-200">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    作業者名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newWorker}
                    onChange={e => setNewWorker(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddWorker() }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="例: 山田　太郎"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => {
                    setAddingNew(false)
                    setNewWorker('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleAddWorker}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}

          {/* テーブル */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-slate-200">
                <tr>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">順序</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">作業者名</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">状態</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-48">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-2">作業者名が登録されていません</p>
                      <p className="text-sm text-gray-400">「新規追加」から登録してください</p>
                    </td>
                  </tr>
                ) : (
                  workers.map((worker, index) => (
                    <tr
                      key={worker.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors ${
                        !worker.isActive ? 'opacity-50' : ''
                      } ${dragIndex === index ? 'opacity-30 bg-teal-50' : 'hover:bg-gray-50'} ${
                        dragOverIndex === index && dragIndex !== index ? 'border-t-2 border-teal-500' : ''
                      }`}
                    >
                      <td className="px-2 py-3 text-center cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4 text-gray-400 mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        {editingId === worker.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={e => setEditingName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleEditName(worker.id)
                                if (e.key === 'Escape') { setEditingId(null); setEditingName('') }
                              }}
                              className="flex-1 px-2 py-1 border border-teal-300 rounded focus:ring-2 focus:ring-teal-500 focus:outline-none text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => handleEditName(worker.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="保存"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditingName('') }}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                              title="キャンセル"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-900">{worker.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            worker.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {worker.isActive ? '有効' : '無効'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              setEditingId(worker.id)
                              setEditingName(worker.name)
                            }}
                            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="名前を編集"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(worker.id, worker.isActive)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                              worker.isActive
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {worker.isActive ? '無効化' : '有効化'}
                          </button>
                          <button
                            onClick={() => handleDelete(worker.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
