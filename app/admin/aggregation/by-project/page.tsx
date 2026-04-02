'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Package,
  Truck,
  Download,
  BarChart3,
  Calendar,
  ArrowLeft,
  Loader2,
  Building2,
  Search,
  Filter,
  X,
} from 'lucide-react'
import { apiGet, apiPost, ApiError } from '@/lib/api'

// ========== 型定義 ==========

interface LaborItem {
  name: string
  weekdayNormal: number
  weekdayOvertime: number
  weekdayLateNight: number
  weekdaySubtotal: number
  sundayNormal: number
  sundayOvertime: number
  sundayLateNight: number
  sundaySubtotal: number
  total: number
  travelTime: number
}

interface MaterialItem {
  name: string
  volume: string
  volumeUnit: string
  unitPrice: number
  totalQuantity: number
  totalAmount: number
}

interface SubcontractorItem {
  name: string
  totalWorkerCount: number
  totalDays: number
}

interface ProjectData {
  projectRefId: string
  projectName: string
  projectType: string
  projectCode: string
  reportCount: number
  labor: LaborItem[]
  materials: MaterialItem[]
  subcontractors: SubcontractorItem[]
  totals: {
    laborHours: number
    materialAmount: number
    subcontractorCount: number
  }
}

interface ByProjectData {
  period: {
    start: string
    end: string
    label: string
  }
  projects: ProjectData[]
  grandTotals: {
    laborHours: number
    materialAmount: number
    subcontractorCount: number
  }
}

type TabType = 'labor' | 'materials' | 'subcontractors'

// ========== メインコンポーネント ==========

export default function ByProjectAggregationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ByProjectData | null>(null)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState('')
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [projectTabs, setProjectTabs] = useState<Map<string, TabType>>(new Map())
  const [filterProjectType, setFilterProjectType] = useState<string>('')
  const [filterPersonName, setFilterPersonName] = useState<string>('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ offset: offset.toString() })
      const json = await apiGet<any>(`/api/aggregation/by-project?${params}`)
      setData(json)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) { router.push('/login'); return }
      if (err instanceof ApiError && err.status === 403) { router.push('/dashboard'); return }
      setError('現場別集計データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [offset, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    try {
      await apiPost('/api/auth/logout')
      router.push('/login')
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
  }

  const toggleProject = (key: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const getProjectTab = (key: string): TabType => {
    return projectTabs.get(key) || 'labor'
  }

  const setProjectTab = (key: string, tab: TabType) => {
    setProjectTabs(prev => new Map(prev).set(key, tab))
  }

  // フォーマットヘルパー
  const fh = (n: number) => n.toFixed(2)
  const formatNumber = (n: number) => n.toLocaleString('ja-JP', { maximumFractionDigits: 3 })
  const formatCurrency = (n: number) => n.toLocaleString('ja-JP')

  // 労働時間の合計行計算
  const calcLaborTotals = (labor: LaborItem[]) => {
    return labor.reduce(
      (acc, item) => ({
        weekdayNormal: acc.weekdayNormal + item.weekdayNormal,
        weekdayOvertime: acc.weekdayOvertime + item.weekdayOvertime,
        weekdayLateNight: acc.weekdayLateNight + item.weekdayLateNight,
        weekdaySubtotal: acc.weekdaySubtotal + item.weekdaySubtotal,
        sundayNormal: acc.sundayNormal + item.sundayNormal,
        sundayOvertime: acc.sundayOvertime + item.sundayOvertime,
        sundayLateNight: acc.sundayLateNight + item.sundayLateNight,
        sundaySubtotal: acc.sundaySubtotal + item.sundaySubtotal,
        total: acc.total + item.total,
        travelTime: acc.travelTime + item.travelTime,
      }),
      {
        weekdayNormal: 0, weekdayOvertime: 0, weekdayLateNight: 0, weekdaySubtotal: 0,
        sundayNormal: 0, sundayOvertime: 0, sundayLateNight: 0, sundaySubtotal: 0,
        total: 0, travelTime: 0,
      }
    )
  }

  const tabs: { key: TabType; label: string; icon: typeof Clock }[] = [
    { key: 'labor', label: '労働時間', icon: Clock },
    { key: 'materials', label: '材料', icon: Package },
    { key: 'subcontractors', label: '外注', icon: Truck },
  ]

  // ========== フィルター関連 ==========

  // 工事種別の一覧を取得（重複排除）
  const projectTypes = useMemo(() => {
    if (!data) return []
    const types = new Set<string>()
    data.projects.forEach(p => {
      if (p.projectType) types.add(p.projectType)
    })
    return Array.from(types).sort()
  }, [data])

  // 全プロジェクトの作業者名一覧を取得（重複排除）
  const allPersonNames = useMemo(() => {
    if (!data) return []
    const names = new Set<string>()
    data.projects.forEach(p => {
      p.labor.forEach(l => names.add(l.name))
    })
    return Array.from(names).sort()
  }, [data])

  // フィルター適用後のプロジェクト一覧
  const filteredProjects = useMemo(() => {
    if (!data) return []
    let projects = data.projects

    // 工事種別フィルター
    if (filterProjectType) {
      projects = projects.filter(p => p.projectType === filterProjectType)
    }

    // 人名フィルター（その人が労働時間に含まれるプロジェクトのみ表示 + 労働行も絞り込み）
    if (filterPersonName) {
      const keyword = filterPersonName.toLowerCase()
      projects = projects
        .filter(p => p.labor.some(l => l.name.toLowerCase().includes(keyword)))
        .map(p => ({
          ...p,
          labor: p.labor.filter(l => l.name.toLowerCase().includes(keyword)),
          totals: {
            ...p.totals,
            laborHours: p.labor
              .filter(l => l.name.toLowerCase().includes(keyword))
              .reduce((sum, l) => sum + l.total, 0),
          },
        }))
    }

    return projects
  }, [data, filterProjectType, filterPersonName])

  // フィルター後の合計値を再計算
  const filteredGrandTotals = useMemo(() => {
    return {
      laborHours: filteredProjects.reduce((sum, p) => sum + p.totals.laborHours, 0),
      materialAmount: filteredProjects.reduce((sum, p) => sum + p.totals.materialAmount, 0),
      subcontractorCount: filteredProjects.reduce((sum, p) => sum + p.totals.subcontractorCount, 0),
    }
  }, [filteredProjects])

  const isFilterActive = filterProjectType !== '' || filterPersonName !== ''

  const clearFilters = () => {
    setFilterProjectType('')
    setFilterPersonName('')
  }

  // CSV出力（全プロジェクト分）
  const handleExportCSV = () => {
    if (!data) return

    let csvContent = ''
    const bom = '\uFEFF'

    csvContent += `現場別月次集計,${data.period.label}\n\n`

    data.projects.forEach(project => {
      // プロジェクトヘッダー
      csvContent += `"${project.projectName}","${project.projectCode}","${project.projectType}",日報数:${project.reportCount}\n`

      // 労働時間
      csvContent += '\n[労働時間]\n'
      csvContent += '氏名,月〜土 8:00-17:00,月〜土 時間外,月〜土 (うち22:00-5:00),月〜土 小計,日曜 8:00-17:00,日曜 時間外,日曜 (うち22:00-5:00),日曜 小計,合計,移動時間\n'
      project.labor.forEach(item => {
        csvContent += `"${item.name}",${fh(item.weekdayNormal)},${fh(item.weekdayOvertime)},${fh(item.weekdayLateNight)},${fh(item.weekdaySubtotal)},${fh(item.sundayNormal)},${fh(item.sundayOvertime)},${fh(item.sundayLateNight)},${fh(item.sundaySubtotal)},${fh(item.total)},${fh(item.travelTime)}\n`
      })
      const lt = calcLaborTotals(project.labor)
      csvContent += `"小計",${fh(lt.weekdayNormal)},${fh(lt.weekdayOvertime)},${fh(lt.weekdayLateNight)},${fh(lt.weekdaySubtotal)},${fh(lt.sundayNormal)},${fh(lt.sundayOvertime)},${fh(lt.sundayLateNight)},${fh(lt.sundaySubtotal)},${fh(lt.total)},${fh(lt.travelTime)}\n`

      // 材料
      csvContent += '\n[材料]\n'
      csvContent += '使用材料・消耗品,容量,単価,数量,金額\n'
      project.materials.forEach(item => {
        const vol = item.volume ? `${item.volume}${item.volumeUnit}` : ''
        csvContent += `"${item.name}","${vol}",${item.unitPrice},${item.totalQuantity},${item.totalAmount}\n`
      })
      csvContent += `"小計",,,,${project.totals.materialAmount}\n`

      // 外注
      csvContent += '\n[外注]\n'
      csvContent += '(外注)会社名,工数,延べ日数\n'
      project.subcontractors.forEach(item => {
        csvContent += `"${item.name}",${item.totalWorkerCount},${item.totalDays}\n`
      })
      csvContent += `"小計",${project.totals.subcontractorCount}\n`

      csvContent += '\n---\n\n'
    })

    // 全体合計
    csvContent += '[全体合計]\n'
    csvContent += `労働時間合計,${fh(data.grandTotals.laborHours)}\n`
    csvContent += `材料費合計,${formatCurrency(data.grandTotals.materialAmount)}\n`
    csvContent += `外注工数合計,${formatNumber(data.grandTotals.subcontractorCount)}\n`

    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `現場別集計_${data.period.label.replace(/\//g, '-').replace(/ /g, '')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">現場別月次集計</h1>
                <p className="text-xs text-gray-500 hidden sm:block">プロジェクト別 労働時間・材料・外注</p>
              </div>
            </div>
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

      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6">
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link href="/admin" className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            管理画面に戻る
          </Link>
        </div>

        {/* 期間セレクター */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-purple-600 shrink-0" />
              <span className="text-sm font-medium text-gray-600">該当月</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setOffset(prev => prev - 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  title="前月"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-bold text-gray-900 min-w-[220px] text-center">
                  {data ? data.period.label : '読み込み中...'}
                </span>
                <button
                  onClick={() => setOffset(prev => prev + 1)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  title="翌月"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              {offset !== 0 && (
                <button
                  onClick={() => setOffset(0)}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium bg-purple-50 px-2 py-1 rounded"
                >
                  今月に戻る
                </button>
              )}
            </div>

            <button
              onClick={handleExportCSV}
              disabled={loading || !data}
              className="inline-flex items-center px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
            >
              <Download className="w-4 h-4 mr-1.5" />
              CSV出力
            </button>
          </div>
        </div>

        {/* フィルター */}
        {data && !loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-600 shrink-0">
                <Filter className="w-4 h-4 text-purple-600" />
                <span>絞り込み</span>
              </div>

              {/* 工事種別フィルター */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-500 mb-1">工事種別</label>
                <select
                  value={filterProjectType}
                  onChange={(e) => setFilterProjectType(e.target.value)}
                  className="w-full sm:w-auto min-w-[180px] px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                >
                  <option value="">すべて</option>
                  {projectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* 人名検索 */}
              <div className="flex-1 min-w-0">
                <label className="block text-xs font-medium text-gray-500 mb-1">作業者名</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filterPersonName}
                    onChange={(e) => setFilterPersonName(e.target.value)}
                    placeholder="氏名で検索..."
                    list="person-name-list"
                    className="w-full sm:w-auto min-w-[180px] pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                  <datalist id="person-name-list">
                    {allPersonNames.map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* フィルタークリア */}
              {isFilterActive && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  クリア
                </button>
              )}
            </div>

            {/* フィルター結果の件数表示 */}
            {isFilterActive && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-gray-500">
                {filteredProjects.length} / {data.projects.length} 件の物件を表示中
                {filterProjectType && <span className="ml-2 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">種別: {filterProjectType}</span>}
                {filterPersonName && <span className="ml-2 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">氏名: {filterPersonName}</span>}
              </div>
            )}
          </div>
        )}

        {/* サマリーカード */}
        {data && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">物件数{isFilterActive ? '(絞込)' : ''}</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredProjects.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">日報数合計{isFilterActive ? '(絞込)' : ''}</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredProjects.reduce((sum, p) => sum + p.reportCount, 0)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">労働時間合計{isFilterActive ? '(絞込)' : ''}</p>
                  <p className="text-2xl font-bold text-gray-900">{fh(filteredGrandTotals.laborHours)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">材料費合計{isFilterActive ? '(絞込)' : ''}</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(filteredGrandTotals.materialAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* ローディング */}
        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
            <span className="ml-3 text-gray-600">集計中...</span>
          </div>
        )}

        {/* プロジェクト一覧 */}
        {!loading && data && (
          <div className="space-y-4">
            {filteredProjects.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-gray-500">
                {isFilterActive ? 'フィルター条件に一致するデータがありません' : '該当期間のデータがありません'}
              </div>
            ) : (
              filteredProjects.map(project => {
                const projectKey = project.projectRefId || project.projectName
                const isExpanded = expandedProjects.has(projectKey)
                const activeTab = getProjectTab(projectKey)

                return (
                  <div key={projectKey} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* プロジェクトヘッダー */}
                    <button
                      onClick={() => toggleProject(projectKey)}
                      className="w-full px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 text-left min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{project.projectName}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            {project.projectCode && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{project.projectCode}</span>
                            )}
                            {project.projectType && (
                              <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{project.projectType}</span>
                            )}
                            <span className="text-xs text-gray-500">日報 {project.reportCount}件</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 shrink-0 ml-3">
                        <div className="hidden sm:flex items-center space-x-4 text-xs">
                          <div className="text-right">
                            <p className="text-gray-500">労働時間</p>
                            <p className="font-mono font-bold text-blue-700">{fh(project.totals.laborHours)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500">材料費</p>
                            <p className="font-mono font-bold text-emerald-700">{formatCurrency(project.totals.materialAmount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-500">外注工数</p>
                            <p className="font-mono font-bold text-indigo-700">{formatNumber(project.totals.subcontractorCount)}</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* モバイル: サマリー（折りたたみ時も表示） */}
                    <div className="sm:hidden px-4 pb-3 flex items-center justify-between text-xs border-t border-slate-100 pt-2">
                      <div>
                        <span className="text-gray-500">労働 </span>
                        <span className="font-mono font-bold text-blue-700">{fh(project.totals.laborHours)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">材料 </span>
                        <span className="font-mono font-bold text-emerald-700">{formatCurrency(project.totals.materialAmount)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">外注 </span>
                        <span className="font-mono font-bold text-indigo-700">{formatNumber(project.totals.subcontractorCount)}</span>
                      </div>
                    </div>

                    {/* 展開コンテンツ */}
                    {isExpanded && (
                      <div className="border-t border-slate-200">
                        {/* タブ切り替え */}
                        <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-gray-50/50">
                          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                            {tabs.map(tab => {
                              const Icon = tab.icon
                              return (
                                <button
                                  key={tab.key}
                                  onClick={() => setProjectTab(projectKey, tab.key)}
                                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                    activeTab === tab.key
                                      ? 'bg-white shadow text-gray-900'
                                      : 'text-gray-600 hover:text-gray-900'
                                  }`}
                                >
                                  <Icon className="w-3.5 h-3.5" />
                                  <span>{tab.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* ① 労働時間タブ */}
                        {activeTab === 'labor' && (
                          <>
                            {project.labor.length === 0 ? (
                              <div className="p-6 text-center text-gray-500 text-sm">
                                労働時間データなし
                              </div>
                            ) : (
                              <>
                                {/* PC表示: Excel形式テーブル */}
                                <div className="hidden lg:block overflow-x-auto">
                                  <table className="w-full min-w-[1000px] text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-300">
                                        <th rowSpan={2} className="px-3 py-2 text-left font-medium text-gray-700 bg-gray-50 border-r border-slate-200 sticky left-0 z-[1] min-w-[80px]">
                                          氏名
                                        </th>
                                        <th colSpan={4} className="px-2 py-1.5 text-center font-bold text-white bg-green-700 border-r border-green-600">
                                          月曜日から土曜日
                                        </th>
                                        <th colSpan={4} className="px-2 py-1.5 text-center font-bold text-white bg-red-700 border-r border-red-600">
                                          日曜日
                                        </th>
                                        <th rowSpan={2} className="px-2 py-2 text-center font-bold text-gray-700 bg-blue-100 border-r border-blue-200 min-w-[70px]">
                                          合計
                                        </th>
                                        <th rowSpan={2} className="px-2 py-2 text-center font-bold text-gray-700 bg-gray-100 min-w-[70px]">
                                          移動時間
                                        </th>
                                      </tr>
                                      <tr className="border-b-2 border-slate-300 bg-gray-50">
                                        <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[80px]">8:00~17:00</th>
                                        <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[80px]">8:00~17:00以外</th>
                                        <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[90px]">(うち22:00~5:00)</th>
                                        <th className="px-2 py-1.5 text-center font-bold text-green-800 bg-green-50 border-r border-slate-300 min-w-[70px]">小計</th>
                                        <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[80px]">8:00~17:00</th>
                                        <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[80px]">8:00~17:00以外</th>
                                        <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[90px]">(うち22:00~5:00)</th>
                                        <th className="px-2 py-1.5 text-center font-bold text-red-800 bg-red-50 border-r border-slate-300 min-w-[70px]">小計</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {project.labor.map(item => (
                                        <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-3 py-2 font-medium text-gray-900 bg-white border-r border-slate-200 sticky left-0 z-[1]">{item.name}</td>
                                          <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(item.weekdayNormal)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(item.weekdayOvertime)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(item.weekdayLateNight)}</td>
                                          <td className="px-2 py-2 text-right font-mono font-bold text-green-800 bg-green-50/50 border-r border-slate-300">{fh(item.weekdaySubtotal)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(item.sundayNormal)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(item.sundayOvertime)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(item.sundayLateNight)}</td>
                                          <td className="px-2 py-2 text-right font-mono font-bold text-red-800 bg-red-50/50 border-r border-slate-300">{fh(item.sundaySubtotal)}</td>
                                          <td className="px-2 py-2 text-right font-mono font-bold text-blue-800 bg-blue-50/50 border-r border-slate-200">{fh(item.total)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-gray-600">{fh(item.travelTime)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      {(() => {
                                        const t = calcLaborTotals(project.labor)
                                        return (
                                          <tr className="border-t-2 border-slate-400 bg-yellow-50 font-bold">
                                            <td className="px-3 py-2 text-gray-900 bg-yellow-50 border-r border-slate-200 sticky left-0 z-[1]">合計</td>
                                            <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(t.weekdayNormal)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(t.weekdayOvertime)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(t.weekdayLateNight)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-green-800 bg-green-100 border-r border-slate-300">{fh(t.weekdaySubtotal)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(t.sundayNormal)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(t.sundayOvertime)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-gray-900 border-r border-slate-100">{fh(t.sundayLateNight)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-red-800 bg-red-100 border-r border-slate-300">{fh(t.sundaySubtotal)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-blue-800 bg-blue-100 border-r border-slate-200">{fh(t.total)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-gray-700">{fh(t.travelTime)}</td>
                                          </tr>
                                        )
                                      })()}
                                    </tfoot>
                                  </table>
                                </div>

                                {/* タブレット表示 (md) */}
                                <div className="hidden md:block lg:hidden overflow-x-auto">
                                  <table className="w-full min-w-[700px] text-xs">
                                    <thead className="bg-gray-50 border-b-2 border-slate-300">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-medium text-gray-700">氏名</th>
                                        <th className="px-2 py-2 text-center font-bold text-green-800 bg-green-50">月〜土 小計</th>
                                        <th className="px-2 py-2 text-center font-bold text-red-800 bg-red-50">日曜 小計</th>
                                        <th className="px-2 py-2 text-center font-bold text-blue-800 bg-blue-50">合計</th>
                                        <th className="px-2 py-2 text-center font-medium text-gray-600">移動時間</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {project.labor.map(item => (
                                        <tr key={item.name} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                                          <td className="px-2 py-2 text-right font-mono text-green-800">{fh(item.weekdaySubtotal)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-red-800">{fh(item.sundaySubtotal)}</td>
                                          <td className="px-2 py-2 text-right font-mono font-bold text-blue-800">{fh(item.total)}</td>
                                          <td className="px-2 py-2 text-right font-mono text-gray-600">{fh(item.travelTime)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      {(() => {
                                        const t = calcLaborTotals(project.labor)
                                        return (
                                          <tr className="border-t-2 border-slate-400 bg-yellow-50 font-bold">
                                            <td className="px-3 py-2 text-gray-900">合計</td>
                                            <td className="px-2 py-2 text-right font-mono text-green-800">{fh(t.weekdaySubtotal)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-red-800">{fh(t.sundaySubtotal)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-blue-800">{fh(t.total)}</td>
                                            <td className="px-2 py-2 text-right font-mono text-gray-700">{fh(t.travelTime)}</td>
                                          </tr>
                                        )
                                      })()}
                                    </tfoot>
                                  </table>
                                </div>

                                {/* モバイル表示 */}
                                <div className="md:hidden divide-y divide-slate-100">
                                  {project.labor.map(item => (
                                    <div key={item.name} className="p-4">
                                      <p className="font-medium text-gray-900 mb-2">{item.name}</p>
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-green-700">月〜土 小計</span>
                                          <span className="font-mono font-bold text-green-800">{fh(item.weekdaySubtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-red-700">日曜 小計</span>
                                          <span className="font-mono font-bold text-red-800">{fh(item.sundaySubtotal)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-blue-700">合計</span>
                                          <span className="font-mono font-bold text-blue-800">{fh(item.total)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500">移動時間</span>
                                          <span className="font-mono text-gray-600">{fh(item.travelTime)}</span>
                                        </div>
                                      </div>
                                      <details className="mt-2">
                                        <summary className="text-xs text-purple-600 cursor-pointer">詳細を表示</summary>
                                        <div className="mt-1 bg-gray-50 rounded p-2 text-xs space-y-1">
                                          <div className="font-medium text-green-700 mb-0.5">月〜土:</div>
                                          <div className="flex justify-between pl-2">
                                            <span className="text-gray-600">8:00~17:00</span>
                                            <span className="font-mono">{fh(item.weekdayNormal)}</span>
                                          </div>
                                          <div className="flex justify-between pl-2">
                                            <span className="text-gray-600">時間外</span>
                                            <span className="font-mono">{fh(item.weekdayOvertime)}</span>
                                          </div>
                                          <div className="flex justify-between pl-2">
                                            <span className="text-gray-600">(うち22:00~5:00)</span>
                                            <span className="font-mono">{fh(item.weekdayLateNight)}</span>
                                          </div>
                                          <div className="font-medium text-red-700 mt-1 mb-0.5">日曜:</div>
                                          <div className="flex justify-between pl-2">
                                            <span className="text-gray-600">8:00~17:00</span>
                                            <span className="font-mono">{fh(item.sundayNormal)}</span>
                                          </div>
                                          <div className="flex justify-between pl-2">
                                            <span className="text-gray-600">時間外</span>
                                            <span className="font-mono">{fh(item.sundayOvertime)}</span>
                                          </div>
                                          <div className="flex justify-between pl-2">
                                            <span className="text-gray-600">(うち22:00~5:00)</span>
                                            <span className="font-mono">{fh(item.sundayLateNight)}</span>
                                          </div>
                                        </div>
                                      </details>
                                    </div>
                                  ))}
                                  <div className="p-4 bg-yellow-50">
                                    <div className="flex justify-between items-center font-bold">
                                      <span className="text-gray-900">合計</span>
                                      <span className="font-mono text-blue-800">{fh(project.totals.laborHours)}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {/* ② 材料タブ */}
                        {activeTab === 'materials' && (
                          <>
                            {project.materials.length === 0 ? (
                              <div className="p-6 text-center text-gray-500 text-sm">
                                材料データなし
                              </div>
                            ) : (
                              <>
                                {/* PC表示 */}
                                <div className="hidden md:block overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-slate-200">
                                      <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用材料・消耗品</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">容量</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">単価</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">数量</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">金額</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {project.materials.map((item, i) => (
                                        <tr key={`${item.name}-${item.volume}-${item.unitPrice}-${i}`} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                          <td className="px-6 py-3 text-sm text-center text-gray-600">
                                            {item.volume ? `${item.volume}${item.volumeUnit}` : '-'}
                                          </td>
                                          <td className="px-6 py-3 text-sm text-right font-mono text-gray-600">
                                            {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                                          </td>
                                          <td className="px-6 py-3 text-sm text-right font-mono text-gray-900">
                                            {item.totalQuantity ? formatNumber(item.totalQuantity) : '-'}
                                          </td>
                                          <td className="px-6 py-3 text-sm text-right font-mono font-medium text-gray-900">
                                            {item.totalAmount ? formatCurrency(item.totalAmount) : '-'}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-emerald-50 border-t-2 border-emerald-200">
                                      <tr>
                                        <td className="px-6 py-3 text-sm font-bold text-gray-900">小計</td>
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3 text-sm text-right font-mono font-bold text-emerald-700">
                                          {formatCurrency(project.totals.materialAmount)}
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                                {/* モバイル表示 */}
                                <div className="md:hidden divide-y divide-slate-100">
                                  {project.materials.map((item, i) => (
                                    <div key={`${item.name}-${item.volume}-${item.unitPrice}-${i}`} className="p-4">
                                      <p className="font-medium text-gray-900 mb-1">{item.name}</p>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                          <span className="text-gray-500">容量: </span>
                                          <span className="text-gray-700">{item.volume ? `${item.volume}${item.volumeUnit}` : '-'}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-gray-500">単価: </span>
                                          <span className="font-mono text-gray-700">{item.unitPrice ? formatCurrency(item.unitPrice) : '-'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">数量: </span>
                                          <span className="font-mono text-gray-700">{item.totalQuantity ? formatNumber(item.totalQuantity) : '-'}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-gray-500">金額: </span>
                                          <span className="font-mono font-bold text-gray-900">{item.totalAmount ? formatCurrency(item.totalAmount) : '-'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="p-4 bg-emerald-50">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-gray-900">金額小計</span>
                                      <span className="font-mono font-bold text-emerald-700">{formatCurrency(project.totals.materialAmount)}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}

                        {/* ③ 外注タブ */}
                        {activeTab === 'subcontractors' && (
                          <>
                            {project.subcontractors.length === 0 ? (
                              <div className="p-6 text-center text-gray-500 text-sm">
                                外注データなし
                              </div>
                            ) : (
                              <>
                                {/* PC表示 */}
                                <div className="hidden md:block overflow-x-auto">
                                  <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-slate-200">
                                      <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">(外注)会社名</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">工数</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">延べ日数</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {project.subcontractors.map((item, i) => (
                                        <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-6 py-3 text-sm text-gray-400">{i + 1}</td>
                                          <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                          <td className="px-6 py-3 text-sm text-right font-mono text-gray-900">{formatNumber(item.totalWorkerCount)}</td>
                                          <td className="px-6 py-3 text-sm text-right font-mono text-gray-600">{item.totalDays}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot className="bg-indigo-50 border-t-2 border-indigo-200">
                                      <tr>
                                        <td className="px-6 py-3"></td>
                                        <td className="px-6 py-3 text-sm font-bold text-gray-900">小計</td>
                                        <td className="px-6 py-3 text-sm text-right font-mono font-bold text-indigo-700">{formatNumber(project.totals.subcontractorCount)}</td>
                                        <td className="px-6 py-3"></td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>

                                {/* モバイル表示 */}
                                <div className="md:hidden divide-y divide-slate-100">
                                  {project.subcontractors.map((item, i) => (
                                    <div key={item.name} className="p-4">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-xs text-gray-400 w-6">{i + 1}</span>
                                          <span className="font-medium text-gray-900">{item.name}</span>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-mono font-bold text-gray-900">{formatNumber(item.totalWorkerCount)}</p>
                                          <p className="text-xs text-gray-500">{item.totalDays}日</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="p-4 bg-indigo-50">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-gray-900">工数小計</span>
                                      <span className="font-mono font-bold text-indigo-700">{formatNumber(project.totals.subcontractorCount)}</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
