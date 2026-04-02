'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Loader2,
  Search,
  TrendingUp,
  CheckCircle2,
  Archive,
  Briefcase,
  User,
  MapPin,
  FileText,
} from 'lucide-react'
import {
  WorkerRecord,
  MaterialRecord,
  SubcontractorRecord,
  INITIAL_WORKER_RECORD,
  INITIAL_MATERIAL_RECORD,
  INITIAL_SUBCONTRACTOR_RECORD,
  calculateManHoursFromTime,
} from '../new/types'
import {
  MAX_WORKER_RECORDS,
  MAX_MATERIAL_RECORDS,
  MAX_SUBCONTRACTOR_RECORDS,
  DEFAULT_PROJECT_TYPES,
  DEFAULT_VOLUME_UNITS,
  DEFAULT_SUBCONTRACTORS,
} from '../new/constants'

// 既存コンポーネントを再利用
import {
  WorkerRecordsCard,
  MaterialRecordsCard,
  SubcontractorCard,
  RemoteTrafficCard,
  ContactNotesCard,
} from '../new/components'
import { useAuth } from '@/hooks/useAuth'
import { adminApi, apiGet, apiPost } from '@/lib/api'

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

interface ExistingReport {
  id: string
  date: string
  projectName: string
}

export default function BulkCreatePage() {
  const router = useRouter()
  const { loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [existingReports, setExistingReports] = useState<Map<string, ExistingReport>>(new Map())
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    createdCount?: number
    skippedCount?: number
    skippedDates?: string[]
  } | null>(null)
  const [error, setError] = useState('')

  // 物件選択
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterProjectType, setFilterProjectType] = useState('')
  const [statusTab, setStatusTab] = useState<'active' | 'completed' | 'archived'>('active')
  const [projectTypesList, setProjectTypesList] = useState<string[]>(DEFAULT_PROJECT_TYPES)

  // マスタデータ
  const [materialMasterList, setMaterialMasterList] = useState<{ name: string; unitPrice: number }[]>([])
  const [unitMasterList, setUnitMasterList] = useState<string[]>(DEFAULT_VOLUME_UNITS)
  const [subcontractorMasterList, setSubcontractorMasterList] = useState<string[]>(DEFAULT_SUBCONTRACTORS)

  // 作業者記録
  const [workerRecords, setWorkerRecords] = useState<WorkerRecord[]>([{ ...INITIAL_WORKER_RECORD }])

  // 使用材料記録
  const [materialRecords, setMaterialRecords] = useState<MaterialRecord[]>([{ ...INITIAL_MATERIAL_RECORD }])

  // 外注先記録
  const [subcontractorRecords, setSubcontractorRecords] = useState<SubcontractorRecord[]>([{ ...INITIAL_SUBCONTRACTOR_RECORD }])

  // 遠隔地・交通誘導警備員
  const [remoteDepartureTime, setRemoteDepartureTime] = useState('')
  const [remoteArrivalTime, setRemoteArrivalTime] = useState('')
  const [remoteDepartureTime2, setRemoteDepartureTime2] = useState('')
  const [remoteArrivalTime2, setRemoteArrivalTime2] = useState('')
  const [trafficGuardCount, setTrafficGuardCount] = useState(0)
  const [trafficGuardStart, setTrafficGuardStart] = useState('')
  const [trafficGuardEnd, setTrafficGuardEnd] = useState('')

  // 連絡事項
  const [contactNotes, setContactNotes] = useState('')

  // 金額合計
  const totalAmount = materialRecords.reduce((sum, r) => sum + (r.quantity * r.unitPrice), 0)

  useEffect(() => {
    if (!authLoading) setLoading(false)
  }, [authLoading])

  useEffect(() => {
    // マスタデータ取得
    Promise.all([
      adminApi.fetchProjectTypes().catch(() => null),
      adminApi.fetchMaterials().catch(() => null),
      adminApi.fetchSubcontractors().catch(() => null),
      adminApi.fetchUnits().catch(() => null),
    ]).then(([ptData, matData, subData, unitData]) => {
      if (ptData?.projectTypes) {
        const activeTypes = ptData.projectTypes.filter((pt: any) => pt.isActive).map((pt: any) => pt.name)
        if (activeTypes.length > 0) setProjectTypesList(activeTypes)
      }
      if (matData?.materials) {
        setMaterialMasterList(matData.materials.filter((m: any) => m.isActive).map((m: any) => ({ name: m.name, unitPrice: m.defaultUnitPrice || 0 })))
      }
      if (subData?.subcontractors) {
        const activeNames = subData.subcontractors.filter((s: any) => s.isActive).map((s: any) => s.name)
        if (activeNames.length > 0) setSubcontractorMasterList(activeNames)
      }
      if (unitData?.units) {
        const activeUnits = unitData.units.filter((u: any) => u.isActive).map((u: any) => u.name)
        if (activeUnits.length > 0) setUnitMasterList(activeUnits)
      }
    }).catch(err => console.error('マスタデータ取得エラー:', err))

    // 物件一覧取得
    fetchProjects('active')
  }, [router])

  useEffect(() => { fetchProjects(statusTab) }, [statusTab])
  useEffect(() => { fetchExistingReports() }, [currentMonth])

  const fetchProjects = (status: string) => {
    apiGet<any>(`/api/projects?status=${status}`)
      .then(data => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setProjects([]))
  }

  const fetchExistingReports = async () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
    try {
      const data = await apiGet<any>(`/api/work-reports/bulk?startDate=${startDate}&endDate=${endDate}`)
      const map = new Map<string, ExistingReport>()
      data.reports.forEach((r: ExistingReport) => map.set(r.date, r))
      setExistingReports(map)
    } catch (err) { console.error('既存日報確認エラー:', err) }
  }

  const filteredProjects = projects.filter(p => {
    const matchesSearch = searchQuery === '' || (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    const matchesType = filterProjectType === '' || p.projectType === filterProjectType
    return matchesSearch && matchesType
  })

  // 作業者記録の操作
  const handleAddWorkerRecord = useCallback(() => {
    if (workerRecords.length >= MAX_WORKER_RECORDS) return
    const maxId = Math.max(...workerRecords.map(r => parseInt(r.id) || 0), 0)
    setWorkerRecords(prev => [...prev, { ...INITIAL_WORKER_RECORD, id: (maxId + 1).toString() }])
  }, [workerRecords.length])

  const handleDeleteWorkerRecord = useCallback((id: string) => {
    if (workerRecords.length === 1) return
    setWorkerRecords(prev => prev.filter(r => r.id !== id))
  }, [workerRecords.length])

  // 使用材料記録の操作
  const handleAddMaterialRecord = useCallback(() => {
    if (materialRecords.length >= MAX_MATERIAL_RECORDS) return
    const maxId = Math.max(...materialRecords.map(r => parseInt(r.id) || 0), 0)
    setMaterialRecords(prev => [...prev, { ...INITIAL_MATERIAL_RECORD, id: (maxId + 1).toString() }])
  }, [materialRecords.length])

  const handleDeleteMaterialRecord = useCallback((id: string) => {
    setMaterialRecords(prev => prev.filter(r => r.id !== id))
  }, [])

  // 外注先記録の操作
  const handleAddSubcontractorRecord = useCallback(() => {
    if (subcontractorRecords.length >= MAX_SUBCONTRACTOR_RECORDS) return
    const maxId = Math.max(...subcontractorRecords.map(r => parseInt(r.id) || 0), 0)
    setSubcontractorRecords(prev => [...prev, { ...INITIAL_SUBCONTRACTOR_RECORD, id: (maxId + 1).toString() }])
  }, [subcontractorRecords.length])

  const handleDeleteSubcontractorRecord = useCallback((id: string) => {
    setSubcontractorRecords(prev => prev.filter(r => r.id !== id))
  }, [])

  // 送信
  const handleCreate = async () => {
    if (!selectedProject) { setError('物件を選択してください'); return }
    if (selectedDates.size === 0) { setError('日付を選択してください'); return }

    setCreating(true)
    setError('')
    setResult(null)

    try {
      const templateData = {
        projectRefId: selectedProject.id,
        projectName: selectedProject.name,
        projectType: selectedProject.projectType || null,
        remoteDepartureTime: remoteDepartureTime || null,
        remoteArrivalTime: remoteArrivalTime || null,
        remoteDepartureTime2: remoteDepartureTime2 || null,
        remoteArrivalTime2: remoteArrivalTime2 || null,
        trafficGuardCount: trafficGuardCount || null,
        trafficGuardStart: trafficGuardStart || null,
        trafficGuardEnd: trafficGuardEnd || null,
        contactNotes: contactNotes || null,
        workerRecords: workerRecords
          .filter(r => r.name.trim() !== '')
          .map((r, i) => ({
            name: r.name,
            startTime: r.startTime,
            endTime: r.endTime,
            workHours: r.manHours || calculateManHoursFromTime(r.startTime, r.endTime),
            workType: r.workType,
            details: r.details,
            dailyHours: r.dailyHours,
            totalHours: r.totalHours,
            order: i,
          })),
        materialRecords: materialRecords
          .filter(r => r.name.trim() !== '')
          .map((r, i) => ({
            name: r.name,
            volume: r.volume,
            volumeUnit: r.volumeUnit,
            quantity: r.quantity,
            unitPrice: r.unitPrice,
            amount: r.quantity * r.unitPrice,
            subcontractor: r.subcontractor,
            order: i,
          })),
        subcontractorRecords: subcontractorRecords
          .filter(r => r.name.trim() !== '')
          .map((r, i) => ({
            name: r.name,
            workerCount: r.workerCount,
            workContent: r.workContent,
            order: i,
          })),
      }

      const data = await apiPost<any>('/api/work-reports/bulk', {
        dates: Array.from(selectedDates).sort(),
        template: templateData,
      })

      setResult({ success: true, createdCount: data.createdCount, skippedCount: data.skippedCount, skippedDates: data.skippedDates })
      setSelectedDates(new Set())
      fetchExistingReports()
    } catch (err) {
      setError('作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  // カレンダー操作
  const toggleDate = (dateStr: string) => {
    const newSet = new Set(selectedDates)
    if (newSet.has(dateStr)) newSet.delete(dateStr)
    else newSet.add(dateStr)
    setSelectedDates(newSet)
  }

  const selectWeekdays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const newSet = new Set<string>()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dow = date.getDay()
      const dateStr = date.toISOString().split('T')[0]
      if (dow !== 0 && dow !== 6 && !existingReports.has(dateStr)) newSet.add(dateStr)
    }
    setSelectedDates(newSet)
  }

  const selectAll = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const newSet = new Set<string>()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      if (!existingReports.has(dateStr)) newSet.add(dateStr)
    }
    setSelectedDates(newSet)
  }

  const clearSelection = () => setSelectedDates(new Set())
  const prevMonth = () => { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)); setSelectedDates(new Set()) }
  const nextMonth = () => { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)); setSelectedDates(new Set()) }

  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: { date: Date | null; dateStr: string }[] = []
    for (let i = 0; i < firstDay; i++) days.push({ date: null, dateStr: '' })
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({ date, dateStr: date.toISOString().split('T')[0] })
    }
    return days
  }

  const calendar = generateCalendar()

  // 前日コピーのダミー（一括作成では不使用）
  const noop = () => {}

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
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">一括日報作成</h1>
                <p className="text-xs text-gray-500 hidden sm:block">物件を選択して複数日分の日報をまとめて作成</p>
              </div>
            </div>
            <Link href="/dashboard" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="TOP画面">
              <Home className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-4">
        {/* 結果メッセージ */}
        {result && result.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2" />
              <span className="font-medium">{result.createdCount}件の日報を作成しました</span>
            </div>
            {result.skippedCount && result.skippedCount > 0 && (
              <p className="text-sm mt-1">{result.skippedCount}件はすでに日報が存在するためスキップしました</p>
            )}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* 物件選択セクション */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-[#0E3091]" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">物件選択</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">日報を作成する物件を選択してください</p>
          </div>

          {selectedProject && (
            <div className="mx-4 sm:mx-6 mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0E3091] to-[#1a4ab8] flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-bold text-gray-900">{selectedProject.name}</span>
                  {selectedProject.projectType && (
                    <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-blue-100 text-[#0E3091] rounded-full font-medium">{selectedProject.projectType}</span>
                  )}
                </div>
              </div>
              <button onClick={() => setSelectedProject(null)} className="text-gray-500 hover:text-red-600 p-1" title="選択解除">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-4 sm:p-6">
            <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4 w-fit">
              {([['active', '進行中', TrendingUp], ['completed', '完了', CheckCircle2], ['archived', 'アーカイブ', Archive]] as const).map(([key, label, Icon]) => (
                <button key={key} onClick={() => setStatusTab(key as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${statusTab === key ? 'bg-white text-[#0E3091] shadow' : 'text-gray-600 hover:text-gray-900'}`}>
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                  placeholder="物件名・発注者・住所で検索..." />
              </div>
              <select value={filterProjectType} onChange={(e) => setFilterProjectType(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white text-gray-700 min-w-[140px]">
                <option value="">全ての工事種別</option>
                {projectTypesList.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">{searchQuery || filterProjectType ? '検索結果がありません' : '物件が登録されていません'}</p>
                </div>
              ) : (
                filteredProjects.map(project => (
                  <button key={project.id} type="button" onClick={() => setSelectedProject(project)}
                    className={`w-full text-left rounded-lg border p-3 transition-all ${selectedProject?.id === project.id ? 'border-[#0E3091] bg-indigo-50 ring-2 ring-[#0E3091]/20' : 'border-gray-200 hover:border-[#0E3091]/30 hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0E3091] to-[#1a4ab8] flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{project.name}</h3>
                          {project.projectType && <span className="inline-block px-2 py-0.5 text-[10px] bg-blue-50 text-[#0E3091] rounded-full font-medium flex-shrink-0">{project.projectType}</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                          {project.projectCode && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{project.projectCode}</span>}
                          {project.client && <span className="flex items-center gap-1"><User className="w-3 h-3" />{project.client}</span>}
                          {project.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project.location}</span>}
                          <span className="flex items-center gap-1"><FileText className="w-3 h-3" />日報 {project.reportCount}件</span>
                        </div>
                      </div>
                      {selectedProject?.id === project.id && <Check className="w-5 h-5 text-[#0E3091] flex-shrink-0" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 作業者記録 */}
        <WorkerRecordsCard
          workerRecords={workerRecords}
          setWorkerRecords={setWorkerRecords}
          onAdd={handleAddWorkerRecord}
          onDelete={handleDeleteWorkerRecord}
          onCopyPrevious={noop}
          copyLoading=""
          projectTypesList={projectTypesList}
        />

        {/* 使用材料・消耗品 */}
        <MaterialRecordsCard
          materialRecords={materialRecords}
          setMaterialRecords={setMaterialRecords}
          onAdd={handleAddMaterialRecord}
          onDelete={handleDeleteMaterialRecord}
          onCopyPrevious={noop}
          copyLoading=""
          materialMasterList={materialMasterList}
          unitMasterList={unitMasterList}
          totalAmount={totalAmount}
        />

        {/* 外注先 */}
        <SubcontractorCard
          subcontractorRecords={subcontractorRecords}
          setSubcontractorRecords={setSubcontractorRecords}
          onAdd={handleAddSubcontractorRecord}
          onDelete={handleDeleteSubcontractorRecord}
          onCopyPrevious={noop}
          copyLoading=""
          subcontractorMasterList={subcontractorMasterList}
        />

        {/* 遠隔地・交通誘導警備員 */}
        <RemoteTrafficCard
          remoteDepartureTime={remoteDepartureTime}
          setRemoteDepartureTime={setRemoteDepartureTime}
          remoteArrivalTime={remoteArrivalTime}
          setRemoteArrivalTime={setRemoteArrivalTime}
          remoteDepartureTime2={remoteDepartureTime2}
          setRemoteDepartureTime2={setRemoteDepartureTime2}
          remoteArrivalTime2={remoteArrivalTime2}
          setRemoteArrivalTime2={setRemoteArrivalTime2}
          trafficGuardCount={trafficGuardCount}
          setTrafficGuardCount={setTrafficGuardCount}
          trafficGuardStart={trafficGuardStart}
          setTrafficGuardStart={setTrafficGuardStart}
          trafficGuardEnd={trafficGuardEnd}
          setTrafficGuardEnd={setTrafficGuardEnd}
          onCopyPrevious={noop}
          copyLoading=""
        />

        {/* 連絡事項 */}
        <ContactNotesCard
          contactNotes={contactNotes}
          setContactNotes={setContactNotes}
        />

        {/* カレンダー */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-[#0E3091]" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">日付選択</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">日報を作成する日付を選択してください</p>
          </div>

          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
            <h2 className="text-lg font-bold text-gray-900">{currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
          </div>

          <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap gap-2">
            <button onClick={selectWeekdays} className="px-3 py-1.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">平日を選択</button>
            <button onClick={selectAll} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">全日選択</button>
            <button onClick={clearSelection} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">選択解除</button>
            <span className="ml-auto text-sm text-gray-500 self-center">{selectedDates.size}日選択中</span>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日', '月', '火', '水', '木', '金', '土'].map((dow, i) => (
                <div key={dow} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{dow}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendar.map((item, i) => {
                if (!item.date) return <div key={i} className="aspect-square" />
                const dateStr = item.dateStr
                const existing = existingReports.get(dateStr)
                const isSelected = selectedDates.has(dateStr)
                const dow = item.date.getDay()
                const isToday = dateStr === new Date().toISOString().split('T')[0]
                return (
                  <button key={i} type="button"
                    onClick={() => existing ? router.push(`/work-report/${existing.id}`) : toggleDate(dateStr)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all
                      ${existing ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer'
                        : isSelected ? 'bg-indigo-600 text-white'
                        : dow === 0 ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : dow === 6 ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'hover:bg-gray-100 text-gray-700'}
                      ${isToday && !existing && !isSelected ? 'ring-2 ring-indigo-400' : ''}`}
                    title={existing ? `日報あり: ${existing.projectName}（クリックで表示）` : undefined}>
                    <span>{item.date.getDate()}</span>
                    {existing && <span className="text-[10px]">済</span>}
                    {isSelected && <Check className="w-3 h-3 mt-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center"><span className="w-3 h-3 rounded bg-blue-100 mr-1"></span>日報あり</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded bg-indigo-600 mr-1"></span>選択中</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded ring-2 ring-indigo-400 mr-1"></span>今日</span>
          </div>
        </div>

        {/* 作成ボタン */}
        <div className="flex justify-center pb-6">
          <button onClick={handleCreate}
            disabled={creating || selectedDates.size === 0 || !selectedProject}
            className="inline-flex items-center px-6 py-3 text-lg font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
            {creating ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />作成中...</>
            ) : (
              <><Calendar className="w-5 h-5 mr-2" />{selectedDates.size}日分の日報を作成</>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
