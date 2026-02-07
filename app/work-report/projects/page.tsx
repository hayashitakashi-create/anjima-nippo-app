'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  Building2,
  Plus,
  FileText,
  MapPin,
  Calendar,
  ChevronRight,
  Search,
  LogOut,
  User,
  X,
  Save,
  Briefcase,
  Home,
  Settings,
  Shield,
  Archive,
  CheckCircle2,
  TrendingUp,
  Info,
} from 'lucide-react'

interface Project {
  id: string
  name: string
  projectType?: string
  projectCode?: string
  client?: string
  location?: string
  status: string
  progress: number
  reportCount: number
  lastReportDate?: string
}

interface CurrentUser {
  id: string
  name: string
  position?: string
  role: string
}

const PROJECT_TYPES = [
  '建築塗装工事',
  '鋼橋塗装工事',
  '防水工事',
  '建築工事',
  '区画線工事',
  'とび土工工事'
]

export default function ProjectListPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [statusTab, setStatusTab] = useState<'active' | 'completed' | 'archived'>('active')

  // 新規物件フォーム
  const [newProject, setNewProject] = useState({
    name: '',
    projectType: '',
    projectCode: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // ユーザー情報取得
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (data && data.user) {
          setCurrentUser(data.user)
        }
      })
      .catch(() => router.push('/login'))

    // 物件一覧取得
    fetchProjects('active')
  }, [router])

  // タブ切り替え時
  useEffect(() => {
    fetchProjects(statusTab)
  }, [statusTab])

  const fetchProjects = (status: string) => {
    setLoading(true)
    fetch(`/api/projects?status=${status}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProjects(data)
        } else {
          console.error('物件データが不正です:', data)
          setProjects([])
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('物件取得エラー:', error)
        setProjects([])
        setLoading(false)
      })
  }

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      alert('工事名を入力してください')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      })

      if (!res.ok) throw new Error('登録失敗')

      const created = await res.json()
      setShowNewProjectModal(false)
      setNewProject({ name: '', projectType: '', projectCode: '' })

      // 作成した物件の日報作成画面へ遷移
      router.push(`/work-report/new?projectId=${created.id}`)
    } catch (error) {
      console.error('物件登録エラー:', error)
      alert('物件の登録に失敗しました')
    } finally {
      setSaving(false)
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

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.projectCode?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 新規物件登録モーダル */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4"
          >
            <div className="bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  新規物件登録
                </h3>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* 工事名 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  工事名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="例: ○○ビル外壁塗装工事"
                />
              </div>

              {/* 工事種別 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">工事種別</label>
                <select
                  value={newProject.projectType}
                  onChange={(e) => setNewProject(prev => ({ ...prev, projectType: e.target.value }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                >
                  <option value="">選択してください</option>
                  {PROJECT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* 工事番号 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">工事番号</label>
                <input
                  type="text"
                  value={newProject.projectCode}
                  onChange={(e) => setNewProject(prev => ({ ...prev, projectCode: e.target.value }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="工事番号"
                />
              </div>

              {/* ボタン */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateProject}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] text-white rounded-lg hover:from-[#0a2470] hover:to-[#0E3091] disabled:from-gray-400 disabled:to-gray-400 font-bold shadow-lg transition-all"
                >
                  <Save className="w-5 h-5" />
                  {saving ? '登録中...' : '登録して日報作成'}
                </button>
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-bold transition-all"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#0E3091] to-[#1a4ab8] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">物件一覧</h1>
                <p className="text-xs text-gray-500 hidden sm:block">現場を選択して日報を作成</p>
              </div>
            </Link>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link
                href="/dashboard"
                className="p-2 text-[#0E3091] hover:bg-blue-50 rounded-lg transition-colors"
                title="TOP画面"
              >
                <Home className="h-5 w-5" />
              </Link>
              {currentUser?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="管理画面"
                >
                  <Shield className="h-5 w-5" />
                </Link>
              )}
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

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* ステータスタブ */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4 w-fit">
          <button
            onClick={() => setStatusTab('active')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusTab === 'active' ? 'bg-white text-[#0E3091] shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            進行中
          </button>
          <button
            onClick={() => setStatusTab('completed')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusTab === 'completed' ? 'bg-white text-emerald-600 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            完了
          </button>
          <button
            onClick={() => setStatusTab('archived')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
              statusTab === 'archived' ? 'bg-white text-gray-700 shadow' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            アーカイブ
          </button>
        </div>

        {/* 検索 + 新規登録 */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
              placeholder="物件名・発注者・住所で検索..."
            />
          </div>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] text-white rounded-lg hover:from-[#0a2470] hover:to-[#0E3091] font-bold shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>新規物件登録</span>
          </button>
        </div>

        {/* 物件リスト */}
        <div className="space-y-3">
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {searchQuery ? '検索結果がありません' : 'まだ物件が登録されていません'}
              </p>
              <p className="text-gray-400 text-sm mb-6">
                {searchQuery ? '検索条件を変えてお試しください' : '「新規物件登録」から物件を追加してください'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] font-medium transition-all"
                >
                  <Plus className="w-5 h-5" />
                  最初の物件を登録する
                </button>
              )}
            </div>
          ) : (
            filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="bg-white rounded-xl border border-gray-200 hover:border-[#0E3091]/30 hover:shadow-md transition-all">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      {/* 左：物件情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0E3091] to-[#1a4ab8] flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{project.name}</h3>
                            {project.projectType && (
                              <span className="inline-block px-2 py-0.5 text-xs bg-blue-50 text-[#0E3091] rounded-full font-medium">
                                {project.projectType}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 進捗バー */}
                        <div className="ml-12 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  project.progress >= 80 ? 'bg-emerald-500' :
                                  project.progress >= 50 ? 'bg-blue-500' :
                                  project.progress >= 20 ? 'bg-amber-500' : 'bg-gray-400'
                                }`}
                                style={{ width: `${project.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-600 w-10 text-right">{project.progress || 0}%</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500 ml-12">
                          {project.projectCode && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5" />
                              {project.projectCode}
                            </span>
                          )}
                          {project.client && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {project.client}
                            </span>
                          )}
                          {project.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {project.location}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 mt-2 ml-12 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            日報 {project.reportCount}件
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            最終: {formatDate(project.lastReportDate)}
                          </span>
                        </div>
                      </div>

                      {/* 右：ボタン群 */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Link
                          href={`/work-report/projects/${project.id}`}
                          className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs sm:text-sm font-medium transition-all"
                        >
                          <Info className="w-4 h-4" />
                          <span className="hidden sm:inline">詳細</span>
                        </Link>
                        <Link
                          href={`/work-report/new?projectId=${project.id}`}
                          className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] text-white rounded-lg hover:from-[#0a2470] hover:to-[#0E3091] text-xs sm:text-sm font-bold shadow-md transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="hidden sm:inline">日報作成</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
