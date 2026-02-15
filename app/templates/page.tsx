'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  FileText,
  Plus,
  Trash2,
  Edit,
  Copy,
  Users,
  Package,
  Truck,
  Clock,
  X,
  Save,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface Template {
  id: string
  userId: string
  name: string
  projectRefId?: string
  projectName?: string
  projectType?: string
  remoteDepartureTime?: string
  remoteArrivalTime?: string
  remoteDepartureTime2?: string
  remoteArrivalTime2?: string
  trafficGuardCount?: number
  trafficGuardStart?: string
  trafficGuardEnd?: string
  workerRecords?: string
  materialRecords?: string
  subcontractorRecords?: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates', { credentials: 'include' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates)
      }
    } catch (err) {
      console.error('テンプレート取得エラー:', err)
      setError('テンプレートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/templates?id=${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setTemplates(prev => prev.filter(t => t.id !== deleteTarget.id))
        setMessage('テンプレートを削除しました')
        setDeleteTarget(null)
      } else {
        const data = await res.json()
        setError(data.error || '削除に失敗しました')
      }
    } catch {
      setError('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  const parseJson = (str: string | undefined | null): unknown[] => {
    if (!str) return []
    try {
      return JSON.parse(str)
    } catch {
      return []
    }
  }

  if (loading) {
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
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-600 flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">テンプレート管理</h1>
                <p className="text-xs text-gray-500 hidden sm:block">日報テンプレートの管理</p>
              </div>
            </div>
            <Link href="/dashboard" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="TOP画面">
              <Home className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6">
        {/* メッセージ */}
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

        {/* 説明 */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-amber-800 mb-2">テンプレート機能について</h3>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>- よく使う日報パターンをテンプレートとして保存できます</li>
            <li>- 日報作成時にテンプレートを選択して入力を簡略化</li>
            <li>- 共有テンプレートは全ユーザーが利用可能です</li>
          </ul>
        </div>

        {/* テンプレート一覧 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              テンプレート一覧 ({templates.length}件)
            </h2>
            <Link
              href="/work-report/new?saveAsTemplate=true"
              className="inline-flex items-center px-3 py-2 text-sm font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              新規作成
            </Link>
          </div>

          {templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>テンプレートがありません</p>
              <p className="text-sm mt-1">日報作成画面から「テンプレートとして保存」できます</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {templates.map(template => {
                const workers = parseJson(template.workerRecords) as { name?: string }[]
                const materials = parseJson(template.materialRecords) as { name?: string }[]
                const subcontractors = parseJson(template.subcontractorRecords) as { name?: string }[]
                const isExpanded = expandedId === template.id

                return (
                  <div key={template.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-gray-900">{template.name}</h3>
                          {template.isShared && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Share2 className="w-3 h-3 mr-1" />
                              共有
                            </span>
                          )}
                        </div>
                        {template.projectName && (
                          <p className="text-sm text-gray-600 mt-1">
                            物件: {template.projectName}
                            {template.projectType && ` (${template.projectType})`}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                          {workers.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded">
                              <Users className="w-3 h-3 mr-1" />
                              作業者 {workers.length}名
                            </span>
                          )}
                          {materials.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded">
                              <Package className="w-3 h-3 mr-1" />
                              材料 {materials.length}件
                            </span>
                          )}
                          {subcontractors.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-700 rounded">
                              <Truck className="w-3 h-3 mr-1" />
                              外注先 {subcontractors.length}件
                            </span>
                          )}
                          {(template.remoteDepartureTime || template.remoteArrivalTime) && (
                            <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded">
                              <Clock className="w-3 h-3 mr-1" />
                              時刻設定あり
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : template.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="詳細"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <Link
                          href={`/work-report/new?templateId=${template.id}`}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                          title="このテンプレートで日報作成"
                        >
                          <Copy className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(template)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 展開時の詳細 */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                        {workers.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">作業者</p>
                            <div className="flex flex-wrap gap-1">
                              {workers.map((w, i) => (
                                <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{w.name || '名前なし'}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {materials.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">材料</p>
                            <div className="flex flex-wrap gap-1">
                              {materials.map((m, i) => (
                                <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{m.name || '名前なし'}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {subcontractors.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">外注先</p>
                            <div className="flex flex-wrap gap-1">
                              {subcontractors.map((s, i) => (
                                <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{s.name || '名前なし'}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {(template.remoteDepartureTime || template.remoteArrivalTime || template.remoteDepartureTime2 || template.remoteArrivalTime2) && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">遠隔地時刻</p>
                            <div className="text-xs text-gray-600">
                              {template.remoteDepartureTime && <span>出発: {template.remoteDepartureTime}</span>}
                              {template.remoteArrivalTime && <span className="ml-2">現場着: {template.remoteArrivalTime}</span>}
                              {template.remoteDepartureTime2 && <span className="ml-2">現場発: {template.remoteDepartureTime2}</span>}
                              {template.remoteArrivalTime2 && <span className="ml-2">会社着: {template.remoteArrivalTime2}</span>}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          更新日: {new Date(template.updatedAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* 削除確認モーダル */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">テンプレート削除</h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{deleteTarget.name}</span> を削除しますか？
              </p>
              <p className="text-xs text-red-600 mt-2">この操作は取り消せません</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">キャンセル</button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400">
                {deleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
