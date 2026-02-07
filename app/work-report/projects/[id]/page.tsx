'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  ChevronLeft,
  Edit3,
  Save,
  X,
  Archive,
  RotateCcw,
  Trash2,
  FileText,
  Calendar,
  Clock,
  Users,
  Briefcase,
  MapPin,
  User,
  CloudSun,
  TrendingUp,
  Plus,
  Home,
  Settings,
  Shield,
  LogOut,
} from 'lucide-react'

const PROJECT_TYPES = [
  '建築塗装工事',
  '鋼橋塗装工事',
  '防水工事',
  '建築工事',
  '区画線工事',
  'とび土工工事',
]

interface WorkReport {
  id: string
  date: string
  userId: string
  weather?: string
  projectName: string
  projectType?: string
  contactNotes?: string
  workerRecords: Array<{
    id: string
    name: string
    workType?: string
    workHours?: number
  }>
  materialRecords: Array<{
    id: string
    name: string
    amount?: number
  }>
  subcontractorRecords: Array<{
    id: string
    name: string
    workerCount?: number
  }>
}

interface Project {
  id: string
  name: string
  projectType?: string
  projectCode?: string
  client?: string
  location?: string
  status: string
  progress: number
  startDate?: string
  endDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  workReports: WorkReport[]
  summary: {
    reportCount: number
    totalWorkerHours: number
    totalMaterialCost: number
    totalWorkers: number
    lastReportDate?: string
  }
}

interface CurrentUser {
  id: string
  name: string
  role: string
}

export default function ProjectDetailPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // 編集フォーム
  const [editForm, setEditForm] = useState({
    name: '',
    projectType: '',
    projectCode: '',
    client: '',
    location: '',
    progress: 0,
    startDate: '',
    endDate: '',
    notes: '',
  })

  // 確認ダイアログ
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => {
        if (data?.user) setCurrentUser(data.user)
      })
      .catch(() => router.push('/login'))

    fetchProject()
  }, [projectId, router])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) {
        if (res.status === 404) {
          alert('物件が見つかりません')
          router.push('/work-report/projects')
        }
        return
      }
      const data = await res.json()
      setProject(data)

      // 編集フォーム初期化
      setEditForm({
        name: data.name || '',
        projectType: data.projectType || '',
        projectCode: data.projectCode || '',
        client: data.client || '',
        location: data.location || '',
        progress: data.progress || 0,
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
        endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        notes: data.notes || '',
      })
    } catch (error) {
      console.error('物件取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      alert('工事名は必須です')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          projectType: editForm.projectType || null,
          projectCode: editForm.projectCode || null,
          client: editForm.client || null,
          location: editForm.location || null,
          progress: editForm.progress,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          notes: editForm.notes || null,
        }),
      })
      if (!res.ok) throw new Error('更新失敗')
      await fetchProject()
      setEditing(false)
    } catch (error) {
      console.error('更新エラー:', error)
      alert('物件の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    try {
      const newStatus = project?.status === 'archived' ? 'active' : 'archived'
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('更新失敗')
      await fetchProject()
      setShowArchiveConfirm(false)
    } catch (error) {
      console.error('アーカイブエラー:', error)
      alert('ステータスの変更に失敗しました')
    }
  }

  const handleComplete = async () => {
    try {
      const newStatus = project?.status === 'completed' ? 'active' : 'completed'
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          progress: newStatus === 'completed' ? 100 : project?.progress,
        }),
      })
      if (!res.ok) throw new Error('更新失敗')
      await fetchProject()
    } catch (error) {
      console.error('完了エラー:', error)
      alert('ステータスの変更に失敗しました')
    }
  }

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || '削除に失敗しました')
        setShowDeleteConfirm(false)
        return
      }
      router.push('/work-report/projects')
    } catch (error) {
      console.error('削除エラー:', error)
      alert('削除に失敗しました')
    }
  }

  const handleProgressChange = async (newProgress: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      })
      if (!res.ok) throw new Error('更新失敗')
      await fetchProject()
    } catch (error) {
      console.error('進捗更新エラー:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatDateFull = (dateString: string) => {
    const date = new Date(dateString)
    const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
    return `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAYS[date.getDay()]}）`
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return '進行中'
      case 'completed': return '完了'
      case 'archived': return 'アーカイブ'
      default: return status
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-emerald-100 text-emerald-700'
      case 'archived': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-emerald-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 20) return 'bg-amber-500'
    return 'bg-gray-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">物件が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* アーカイブ確認ダイアログ */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              {project.status === 'archived' ? 'アーカイブ解除' : 'アーカイブ'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {project.status === 'archived'
                ? 'この物件をアクティブに戻しますか？'
                : 'この物件をアーカイブしますか？物件一覧から非表示になりますが、データは保持されます。'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleArchive}
                className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800"
              >
                {project.status === 'archived' ? '解除する' : 'アーカイブ'}
              </button>
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-red-600 mb-3">物件を削除</h3>
            <p className="text-sm text-gray-600 mb-6">
              この物件を完全に削除しますか？この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                削除する
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/work-report/projects')}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <Link href="/dashboard" className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0E3091] to-[#1a4ab8] flex items-center justify-center hover:opacity-80 transition-opacity">
                <Building2 className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-gray-900 truncate max-w-[200px] sm:max-w-none">
                  {project.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                  {project.projectType && (
                    <span className="text-xs text-gray-500">{project.projectType}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Link href="/dashboard" className="p-2 text-[#0E3091] hover:bg-blue-50 rounded-lg transition-colors" title="TOP画面">
                <Home className="h-5 w-5" />
              </Link>
              {currentUser?.role === 'admin' && (
                <Link href="/admin" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="管理画面">
                  <Shield className="h-5 w-5" />
                </Link>
              )}
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

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {/* 進捗バー */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              進捗率
            </h3>
            <span className="text-2xl font-bold text-gray-900">{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(project.progress)}`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
              <button
                key={v}
                onClick={() => handleProgressChange(v)}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${
                  project.progress === v
                    ? 'bg-[#0E3091] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        {/* 集計サマリー */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <FileText className="w-5 h-5 text-[#0E3091] mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{project.summary.reportCount}</p>
            <p className="text-xs text-gray-500">日報数</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Clock className="w-5 h-5 text-[#0E3091] mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{project.summary.totalWorkerHours.toFixed(1)}</p>
            <p className="text-xs text-gray-500">総工数(h)</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Users className="w-5 h-5 text-[#0E3091] mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">{project.summary.totalWorkers}</p>
            <p className="text-xs text-gray-500">作業者数</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <TrendingUp className="w-5 h-5 text-[#0E3091] mx-auto mb-1" />
            <p className="text-2xl font-bold text-gray-900">
              {project.summary.totalMaterialCost > 0
                ? `${(project.summary.totalMaterialCost / 10000).toFixed(1)}万`
                : '0'}
            </p>
            <p className="text-xs text-gray-500">材料費</p>
          </div>
        </div>

        {/* 物件情報カード */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-700">物件情報</h3>
            <div className="flex items-center gap-2">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#0E3091] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  編集
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0E3091] rounded-lg hover:bg-[#0a2470] disabled:bg-gray-400 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? '保存中...' : '保存'}
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      // フォームリセット
                      if (project) {
                        setEditForm({
                          name: project.name || '',
                          projectType: project.projectType || '',
                          projectCode: project.projectCode || '',
                          client: project.client || '',
                          location: project.location || '',
                          progress: project.progress || 0,
                          startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
                          endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
                          notes: project.notes || '',
                        })
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    キャンセル
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-4">
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">工事名 *</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">工事種別</label>
                    <select
                      value={editForm.projectType}
                      onChange={(e) => setEditForm(prev => ({ ...prev, projectType: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                    >
                      <option value="">選択してください</option>
                      {PROJECT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">工事番号</label>
                    <input
                      type="text"
                      value={editForm.projectCode}
                      onChange={(e) => setEditForm(prev => ({ ...prev, projectCode: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">発注者</label>
                    <input
                      type="text"
                      value={editForm.client}
                      onChange={(e) => setEditForm(prev => ({ ...prev, client: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">現場住所</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">工期開始日</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">工期終了日</label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">備考</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">工事種別</p>
                    <p className="text-sm text-gray-900 font-medium">{project.projectType || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">工事番号</p>
                    <p className="text-sm text-gray-900 font-medium">{project.projectCode || '-'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">発注者</p>
                    <p className="text-sm text-gray-900 font-medium flex items-center gap-1">
                      {project.client ? (
                        <><User className="w-3.5 h-3.5 text-gray-400" />{project.client}</>
                      ) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">現場住所</p>
                    <p className="text-sm text-gray-900 font-medium flex items-center gap-1">
                      {project.location ? (
                        <><MapPin className="w-3.5 h-3.5 text-gray-400" />{project.location}</>
                      ) : '-'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">工期</p>
                    <p className="text-sm text-gray-900 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {project.startDate || project.endDate
                        ? `${formatDate(project.startDate)} 〜 ${formatDate(project.endDate)}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">最終日報</p>
                    <p className="text-sm text-gray-900 font-medium">{formatDate(project.summary.lastReportDate)}</p>
                  </div>
                </div>
                {project.notes && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">備考</p>
                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{project.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/work-report/new?projectId=${project.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0E3091] rounded-lg hover:bg-[#0a2470] transition-colors"
          >
            <Plus className="w-4 h-4" />
            日報作成
          </Link>
          {project.status !== 'completed' ? (
            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              工事完了
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              進行中に戻す
            </button>
          )}
          <button
            onClick={() => setShowArchiveConfirm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {project.status === 'archived' ? (
              <><RotateCcw className="w-4 h-4" />アーカイブ解除</>
            ) : (
              <><Archive className="w-4 h-4" />アーカイブ</>
            )}
          </button>
          {project.summary.reportCount === 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              削除
            </button>
          )}
        </div>

        {/* 日報一覧 */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              作業日報一覧（{project.workReports.length}件）
            </h3>
          </div>

          {project.workReports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">この物件の日報はまだありません</p>
              <Link
                href={`/work-report/new?projectId=${project.id}`}
                className="inline-flex items-center gap-1 mt-3 text-sm text-[#0E3091] font-medium hover:underline"
              >
                <Plus className="w-4 h-4" />
                最初の日報を作成する
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {project.workReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/work-report/${report.id}`}
                  className="block p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-900">
                          {formatDateFull(report.date)}
                        </p>
                        {report.weather && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
                            <CloudSun className="w-3 h-3" />
                            {report.weather}
                          </span>
                        )}
                      </div>

                      {/* 作業者 */}
                      {report.workerRecords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {report.workerRecords.slice(0, 4).map((worker) => (
                            <span
                              key={worker.id}
                              className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5"
                            >
                              {worker.name}
                              {worker.workType && ` (${worker.workType})`}
                            </span>
                          ))}
                          {report.workerRecords.length > 4 && (
                            <span className="text-xs text-gray-400">+{report.workerRecords.length - 4}名</span>
                          )}
                        </div>
                      )}

                      {report.contactNotes && (
                        <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{report.contactNotes}</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 ml-3">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        {report.workerRecords.length}名
                      </div>
                      {report.materialRecords.length > 0 && (
                        <div className="text-xs text-gray-400">
                          材料{report.materialRecords.length}件
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
