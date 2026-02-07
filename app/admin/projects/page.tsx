'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Archive,
  X,
  Calendar,
  MapPin,
  User,
  FileText,
  TrendingUp,
  Building2,
  Hash,
  ArrowLeft,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  projectType?: string
  projectCode?: string
  client?: string
  location?: string
  status: string
  progress?: number
  startDate?: string | null
  endDate?: string | null
  notes?: string | null
  reportCount?: number
  lastReportDate?: string | null
  createdAt: string
  updatedAt: string
}

interface CurrentUser {
  id: string
  name: string
  role: string
}

type FilterTab = 'all' | 'active' | 'completed' | 'archived'

function getStatusLabel(status: string) {
  switch (status) {
    case 'active': return '進行中'
    case 'completed': return '完了'
    case 'archived': return 'アーカイブ'
    default: return status
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'completed':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'archived':
      return 'bg-gray-100 text-gray-700 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

export default function AdminProjectsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    projectType: '',
    projectCode: '',
    client: '',
    location: '',
    status: 'active' as 'active' | 'completed' | 'archived',
    progress: 0,
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [creating, setCreating] = useState(false)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    projectType: '',
    projectCode: '',
    client: '',
    location: '',
    status: 'active' as 'active' | 'completed' | 'archived',
    progress: 0,
    startDate: '',
    endDate: '',
    notes: '',
  })
  const [updating, setUpdating] = useState(false)

  // Auth check
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => {
        if (data && data.user) {
          if (data.user.role !== 'admin') { router.push('/dashboard'); return }
          setCurrentUser(data.user)
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  // Fetch projects
  useEffect(() => {
    if (!currentUser) return
    fetchProjects()
  }, [currentUser, filter])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const statusParam = filter === 'all' ? 'all' : filter
      const res = await fetch(`/api/projects?status=${statusParam}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      } else {
        setError('案件の取得に失敗しました')
      }
    } catch (err) {
      console.error('案件取得エラー:', err)
      setError('案件の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // Create project
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...createForm,
          startDate: createForm.startDate || null,
          endDate: createForm.endDate || null,
          progress: Number(createForm.progress),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('案件を作成しました')
        setShowCreateModal(false)
        setCreateForm({
          name: '',
          projectType: '',
          projectCode: '',
          client: '',
          location: '',
          status: 'active',
          progress: 0,
          startDate: '',
          endDate: '',
          notes: '',
        })
        fetchProjects()
      } else {
        setError(data.error || '案件の作成に失敗しました')
      }
    } catch (err) {
      console.error('案件作成エラー:', err)
      setError('案件の作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  // Edit project
  const openEditModal = (project: Project) => {
    setEditingProject(project)
    setEditForm({
      name: project.name,
      projectType: project.projectType || '',
      projectCode: project.projectCode || '',
      client: project.client || '',
      location: project.location || '',
      status: project.status as 'active' | 'completed' | 'archived',
      progress: project.progress || 0,
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      notes: project.notes || '',
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject) return

    setUpdating(true)
    setMessage('')
    setError('')

    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
          progress: Number(editForm.progress),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('案件を更新しました')
        setShowEditModal(false)
        setEditingProject(null)
        fetchProjects()
      } else {
        setError(data.error || '案件の更新に失敗しました')
      }
    } catch (err) {
      console.error('案件更新エラー:', err)
      setError('案件の更新に失敗しました')
    } finally {
      setUpdating(false)
    }
  }

  // Change status
  const handleStatusChange = async (projectId: string, newStatus: 'active' | 'completed' | 'archived') => {
    if (!confirm(`ステータスを「${getStatusLabel(newStatus)}」に変更しますか？`)) return

    setMessage('')
    setError('')

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`ステータスを更新しました`)
        fetchProjects()
      } else {
        setError(data.error || 'ステータスの更新に失敗しました')
      }
    } catch (err) {
      console.error('ステータス更新エラー:', err)
      setError('ステータスの更新に失敗しました')
    }
  }

  // Delete project
  const handleDelete = async (project: Project) => {
    if (project.reportCount && project.reportCount > 0) {
      alert(`この案件には${project.reportCount}件の日報が紐づいているため削除できません。アーカイブをご利用ください。`)
      return
    }

    if (!confirm(`案件「${project.name}」を削除しますか？この操作は取り消せません。`)) return

    setMessage('')
    setError('')

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('案件を削除しました')
        fetchProjects()
      } else {
        setError(data.error || '案件の削除に失敗しました')
      }
    } catch (err) {
      console.error('案件削除エラー:', err)
      setError('案件の削除に失敗しました')
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

  // Filter and search
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const query = searchQuery.toLowerCase()
      return (
        project.name.toLowerCase().includes(query) ||
        project.projectCode?.toLowerCase().includes(query) ||
        project.client?.toLowerCase().includes(query) ||
        project.location?.toLowerCase().includes(query)
      )
    })
  }, [projects, searchQuery])

  // Statistics
  const stats = useMemo(() => {
    const allProjects = projects
    const total = allProjects.length
    const active = allProjects.filter(p => p.status === 'active').length
    const completed = allProjects.filter(p => p.status === 'completed').length
    const archived = allProjects.filter(p => p.status === 'archived').length
    return { total, active, completed, archived }
  }, [projects])

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">案件管理</h1>
                <p className="text-xs text-gray-500 hidden sm:block">工事案件・物件の管理</p>
              </div>
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link
                href="/dashboard"
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="TOP画面"
              >
                <Home className="h-5 w-5" />
              </Link>
              <Link
                href="/admin"
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="管理画面"
              >
                <Shield className="h-5 w-5" />
              </Link>
              <Link
                href="/settings"
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="設定"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="ログアウト"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {/* Back button */}
        <div className="mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            管理画面に戻る
          </Link>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {message}
            </div>
            <button onClick={() => setMessage('')} className="text-green-700 hover:text-green-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <X className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
            <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">総案件数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">進行中</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">完了</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">アーカイブ</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </div>
              <Archive className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="案件名・工事番号・発注者・住所で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新規案件作成
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'active' as const, label: '進行中', count: stats.active, color: 'emerald' },
            { key: 'all' as const, label: 'すべて', count: stats.total, color: 'purple' },
            { key: 'completed' as const, label: '完了', count: stats.completed, color: 'blue' },
            { key: 'archived' as const, label: 'アーカイブ', count: stats.archived, color: 'gray' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key
                  ? tab.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                    : tab.color === 'blue' ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                    : tab.color === 'gray' ? 'bg-gray-200 text-gray-700 border-2 border-gray-400'
                    : 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                filter === tab.key ? 'bg-white/50' : 'bg-gray-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">該当する案件はありません</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate mb-1">
                        {project.name}
                      </h3>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(project.status)}`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4 text-sm">
                    {project.projectType && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{project.projectType}</span>
                      </div>
                    )}
                    {project.projectCode && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Hash className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{project.projectCode}</span>
                      </div>
                    )}
                    {project.client && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{project.client}</span>
                      </div>
                    )}
                    {project.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    )}
                    {(project.startDate || project.endDate) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(project.startDate)} 〜 {formatDate(project.endDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {project.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">進捗率</span>
                        <span className="text-xs font-bold text-purple-600">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Report Count */}
                  {project.reportCount !== undefined && (
                    <div className="mb-4 text-xs text-gray-600">
                      紐づく日報: {project.reportCount}件
                      {project.lastReportDate && (
                        <span className="ml-2">
                          (最終: {formatDate(project.lastReportDate)})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => openEditModal(project)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      編集
                    </button>

                    {project.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(project.id, 'completed')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        完了
                      </button>
                    )}

                    {project.status !== 'archived' && (
                      <button
                        onClick={() => handleStatusChange(project.id, 'archived')}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white text-xs font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        保管
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(project)}
                      disabled={!!project.reportCount && project.reportCount > 0}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      title={project.reportCount && project.reportCount > 0 ? '日報が紐づいているため削除できません' : ''}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">新規案件作成</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工事名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工事種別</label>
                  <input
                    type="text"
                    value={createForm.projectType}
                    onChange={(e) => setCreateForm({ ...createForm, projectType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工事番号</label>
                  <input
                    type="text"
                    value={createForm.projectCode}
                    onChange={(e) => setCreateForm({ ...createForm, projectCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">発注者</label>
                <input
                  type="text"
                  value={createForm.client}
                  onChange={(e) => setCreateForm({ ...createForm, client: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">現場住所</label>
                <input
                  type="text"
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="active">進行中</option>
                    <option value="completed">完了</option>
                    <option value="archived">アーカイブ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">進捗率 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={createForm.progress}
                    onChange={(e) => setCreateForm({ ...createForm, progress: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工期（開始）</label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工期（終了）</label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                <textarea
                  rows={3}
                  value={createForm.notes}
                  onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  {creating ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">案件編集</h2>
              <button
                onClick={() => { setShowEditModal(false); setEditingProject(null) }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  工事名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工事種別</label>
                  <input
                    type="text"
                    value={editForm.projectType}
                    onChange={(e) => setEditForm({ ...editForm, projectType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工事番号</label>
                  <input
                    type="text"
                    value={editForm.projectCode}
                    onChange={(e) => setEditForm({ ...editForm, projectCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">発注者</label>
                <input
                  type="text"
                  value={editForm.client}
                  onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">現場住所</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="active">進行中</option>
                    <option value="completed">完了</option>
                    <option value="archived">アーカイブ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">進捗率 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(e) => setEditForm({ ...editForm, progress: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工期（開始）</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">工期（終了）</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingProject(null) }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
                >
                  {updating ? '更新中...' : '更新'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
