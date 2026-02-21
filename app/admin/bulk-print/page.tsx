'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  Printer,
  Users,
  Calendar,
  Search,
  FileText,
  ArrowLeft,
  X,
  CheckSquare,
  Square,
  MinusSquare,
  Briefcase,
  Wrench,
  FolderKanban,
} from 'lucide-react'

interface User {
  id: string
  name: string
  role: string
}

interface ManagedUser {
  id: string
  name: string
  username: string
  position?: string
  role: string
  isActive?: boolean
}

// 作業日報の型
interface WorkerRecord {
  name: string
  startTime?: string
  endTime?: string
  workHours?: number
  workType?: string
  details?: string
  dailyHours?: number
  totalHours?: number
  order: number
}

interface MaterialRecord {
  name: string
  volume?: string
  volumeUnit?: string
  quantity?: number
  unitPrice?: number
  amount?: number
  subcontractor?: string
  order: number
}

interface SubcontractorRecord {
  name: string
  workerCount?: number
  workContent?: string
  order: number
}

// 営業日報の型
interface VisitRecord {
  destination: string
  contactPerson?: string
  startTime?: string
  endTime?: string
  content?: string
  expense?: number
  order: number
}

interface Approval {
  id: string
  approverRole: string
  status: string
  approverUserId?: string
  approvedAt?: string
  approver?: { name: string; position?: string }
}

// 統合レポート型
interface Report {
  id: string
  date: string
  userId: string
  userName: string
  reportType: 'work' | 'sales'
  // 作業日報
  projectName?: string
  projectType?: string
  projectId?: string
  weather?: string
  contactNotes?: string
  remoteDepartureTime?: string
  remoteArrivalTime?: string
  remoteDepartureTime2?: string
  remoteArrivalTime2?: string
  trafficGuardCount?: number
  trafficGuardStart?: string
  trafficGuardEnd?: string
  workerRecords?: WorkerRecord[]
  materialRecords?: MaterialRecord[]
  subcontractorRecords?: SubcontractorRecord[]
  // 営業日報
  userPosition?: string
  specialNotes?: string
  visitRecords?: VisitRecord[]
  approvals?: Approval[]
}

type ReportTypeFilter = 'all' | 'work' | 'sales'

const ROLE_LABELS: Record<string, string> = {
  chairman: '会長', president: '社長', vice_president: '副社長',
  executive_vice_president: '専務', managing_director: '常務',
  director: '取締役', department_manager: '部長', deputy_manager: '次長',
  section_manager: '課長', subsection_chief: '係長', chief: '主任',
  会長: '会長', 社長: '社長', 副社長: '副社長', 専務: '専務', 常務: '常務',
  取締役: '取締役', 部長: '部長', 次長: '次長', 課長: '課長', 係長: '係長', 主任: '主任',
}

export default function BulkPrintPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  // 絞り込み条件
  const [selectedUserId, setSelectedUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportTypeFilter, setReportTypeFilter] = useState<ReportTypeFilter>('all')
  const [projectNameFilter, setProjectNameFilter] = useState('')

  // 検索結果
  const [reports, setReports] = useState<Report[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // チェック選択
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // 印刷モード
  const [isPrintMode, setIsPrintMode] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null }
        return res.json()
      })
      .then(data => {
        if (data?.user) {
          if (data.user.role !== 'admin') { router.push('/dashboard'); return }
          setCurrentUser(data.user)
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!currentUser) return
    fetchUsers()
  }, [currentUser])

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users.filter((u: ManagedUser) => u.isActive !== false))
      }
    } catch (err) {
      console.error('ユーザー一覧取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!startDate && !endDate && !selectedUserId) {
      alert('少なくとも1つの絞り込み条件を指定してください')
      return
    }

    setSearching(true)
    setHasSearched(true)
    setSelectedIds(new Set())

    try {
      const params = new URLSearchParams()
      if (selectedUserId) params.append('userId', selectedUserId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      params.append('reportType', reportTypeFilter)
      if (projectNameFilter) params.append('projectName', projectNameFilter)

      const res = await fetch(`/api/admin/bulk-reports?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports)
      } else {
        setReports([])
      }
    } catch (err) {
      console.error('日報検索エラー:', err)
      setReports([])
    } finally {
      setSearching(false)
    }
  }

  // チェック操作
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === reports.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(reports.map(r => r.id)))
    }
  }

  const selectedReports = reports.filter(r => selectedIds.has(r.id))

  const handlePrint = () => {
    if (selectedIds.size === 0) {
      alert('印刷する日報を選択してください')
      return
    }
    setIsPrintMode(true)
    setTimeout(() => { window.print() }, 100)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`
  }

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  // ===== 印刷モード =====
  if (isPrintMode) {
    return (
      <>
        <style>{`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 landscape; margin: 6mm; }
            .page-break { page-break-before: always; }
          }
          @media screen { body { background: #f3f4f6; } }
          .print-table { border-collapse: collapse; width: 100%; }
          .print-table th, .print-table td {
            border: 1px solid #333; padding: 2px 4px; font-size: 10px; vertical-align: middle;
          }
          .print-table th {
            background-color: #f0f0f0; font-weight: bold; text-align: center; white-space: nowrap;
          }
          .section-title { font-size: 11px; font-weight: bold; margin: 6px 0 2px 0; }
        `}</style>

        {/* 印刷操作バー */}
        <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsPrintMode(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                戻る
              </button>
              <span className="text-sm text-gray-600">一括印刷プレビュー（{selectedReports.length}件）</span>
            </div>
            <button onClick={() => window.print()}
              className="px-6 py-2 text-sm font-bold text-white bg-[#0E3091] rounded-lg hover:bg-[#0a2470] shadow-sm">
              印刷 / PDF保存
            </button>
          </div>
        </div>

        {/* 印刷コンテンツ */}
        {selectedReports.map((report, reportIndex) => (
          <div key={report.id} className={`max-w-[1100px] mx-auto p-4 ${reportIndex > 0 ? 'page-break' : ''}`}>
            <div className="bg-white p-5 shadow-sm print:shadow-none print:p-0">
              {report.reportType === 'work' ? (
                <WorkReportPrint report={report} formatDate={formatDate} />
              ) : (
                <SalesReportPrint report={report} formatDate={formatDate} />
              )}
            </div>
          </div>
        ))}
      </>
    )
  }

  // ===== 通常モード =====
  const allSelected = reports.length > 0 && selectedIds.size === reports.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < reports.length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <Link href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-600 flex items-center justify-center">
                <Printer className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">一括日報印刷</h1>
                <p className="text-xs text-gray-500 hidden sm:block">絞り込んで一括印刷</p>
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
        <div className="mb-4">
          <Link href="/admin" className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            管理画面に戻る
          </Link>
        </div>

        {/* 絞り込み条件 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center">
              <Search className="w-5 h-5 mr-2 text-teal-600" />
              絞り込み条件
            </h2>
          </div>
          <div className="p-4 sm:p-6">
            {/* 1行目: 日報種別 */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                日報種別
              </label>
              <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
                {([
                  { key: 'all', label: 'すべて', icon: FileText },
                  { key: 'work', label: '作業日報', icon: Wrench },
                  { key: 'sales', label: '営業日報', icon: Briefcase },
                ] as const).map(item => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.key}
                      onClick={() => setReportTypeFilter(item.key)}
                      className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        reportTypeFilter === item.key
                          ? 'bg-white shadow text-gray-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2行目: ユーザー、開始日、終了日 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  ユーザー
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">全てのユーザー</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  開始日
                </label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  終了日
                </label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none" />
              </div>
            </div>

            {/* 3行目: 工事名（作業日報のみ） */}
            {reportTypeFilter !== 'sales' && (
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <FolderKanban className="w-4 h-4 text-gray-500" />
                  工事名
                </label>
                <input
                  type="text"
                  value={projectNameFilter}
                  onChange={(e) => setProjectNameFilter(e.target.value)}
                  placeholder="工事名で絞り込み（部分一致）"
                  className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={handleSearch} disabled={searching}
                className="inline-flex items-center px-6 py-2 text-sm font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors">
                <Search className="w-4 h-4 mr-2" />
                {searching ? '検索中...' : '検索'}
              </button>
            </div>
          </div>
        </div>

        {/* 検索結果 */}
        {hasSearched && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-teal-600" />
                検索結果 ({reports.length}件)
                {selectedIds.size > 0 && (
                  <span className="ml-2 text-sm font-medium text-teal-600">{selectedIds.size}件選択中</span>
                )}
              </h2>
              {reports.length > 0 && (
                <button onClick={handlePrint} disabled={selectedIds.size === 0}
                  className="inline-flex items-center px-4 py-2 text-sm font-bold bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-400 transition-colors">
                  <Printer className="w-4 h-4 mr-2" />
                  選択した日報を印刷（{selectedIds.size}件）
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              {reports.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">該当する日報がありません</p>
                  <p className="text-sm text-gray-400">絞り込み条件を変更してください</p>
                </div>
              ) : (
                <>
                  {/* PC表示 */}
                  <table className="w-full hidden md:table">
                    <thead className="bg-gray-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-center w-12">
                          <button onClick={toggleSelectAll} className="text-gray-500 hover:text-teal-600 transition-colors">
                            {allSelected ? <CheckSquare className="w-5 h-5 text-teal-600" /> :
                             someSelected ? <MinusSquare className="w-5 h-5 text-teal-500" /> :
                             <Square className="w-5 h-5" />}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-20">種別</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">工事名 / 訪問先</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">天候 / 備考</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.map(report => (
                        <tr key={report.id} onClick={() => toggleSelect(report.id)}
                          className={`cursor-pointer transition-colors ${selectedIds.has(report.id) ? 'bg-teal-50 hover:bg-teal-100' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-4 text-center">
                            {selectedIds.has(report.id) ? <CheckSquare className="w-5 h-5 text-teal-600 mx-auto" /> : <Square className="w-5 h-5 text-gray-400 mx-auto" />}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {report.reportType === 'work' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Wrench className="w-3 h-3 mr-0.5" />作業
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                <Briefcase className="w-3 h-3 mr-0.5" />営業
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{formatDate(report.date)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{report.userName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-900">
                              {report.reportType === 'work'
                                ? report.projectName || '-'
                                : report.visitRecords && report.visitRecords.length > 0
                                  ? report.visitRecords.map(v => v.destination).filter(Boolean).join(', ') || '-'
                                  : '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {report.reportType === 'work'
                                ? report.weather || '-'
                                : report.visitRecords
                                  ? `${report.visitRecords.length}件訪問`
                                  : '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* モバイル表示 */}
                  <div className="md:hidden">
                    <div className="px-4 py-2 border-b border-slate-200 bg-gray-50 flex items-center justify-between">
                      <button onClick={toggleSelectAll} className="inline-flex items-center text-sm text-gray-600 hover:text-teal-600">
                        {allSelected ? <CheckSquare className="w-4 h-4 mr-1.5 text-teal-600" /> :
                         someSelected ? <MinusSquare className="w-4 h-4 mr-1.5 text-teal-500" /> :
                         <Square className="w-4 h-4 mr-1.5" />}
                        {allSelected ? '全解除' : '全選択'}
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {reports.map(report => (
                        <div key={report.id} onClick={() => toggleSelect(report.id)}
                          className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${selectedIds.has(report.id) ? 'bg-teal-50' : ''}`}>
                          <div className="pt-0.5 shrink-0">
                            {selectedIds.has(report.id) ? <CheckSquare className="w-5 h-5 text-teal-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              {report.reportType === 'work' ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">作業</span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">営業</span>
                              )}
                              <span className="text-sm font-medium text-gray-900">{formatDate(report.date)}</span>
                            </div>
                            <p className="text-xs text-gray-500">{report.userName}</p>
                            <p className="text-xs text-gray-600 mt-0.5">
                              {report.reportType === 'work'
                                ? report.projectName || '-'
                                : report.visitRecords?.map(v => v.destination).filter(Boolean).join(', ') || '-'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ===== 作業日報印刷コンポーネント =====
function WorkReportPrint({ report, formatDate }: { report: Report; formatDate: (d: string) => string }) {
  const paddedWorkers: (WorkerRecord | null)[] = [...(report.workerRecords || [])]
  while (paddedWorkers.length < 11) paddedWorkers.push(null)

  const paddedMaterials: (MaterialRecord | null)[] = [...(report.materialRecords || [])]
  while (paddedMaterials.length < 5) paddedMaterials.push(null)

  const paddedSubs: (SubcontractorRecord | null)[] = [...(report.subcontractorRecords || [])]
  while (paddedSubs.length < 3) paddedSubs.push(null)

  const totalAmount = (report.materialRecords || []).reduce(
    (sum, r) => sum + ((r.quantity || 0) * (r.unitPrice || 0)), 0
  )

  return (
    <>
      <div className="text-center mb-3">
        <h1 className="text-lg font-bold tracking-widest">作 業 日 報</h1>
      </div>
      <table className="print-table mb-1">
        <tbody>
          <tr>
            <th style={{ width: '70px' }}>日付</th>
            <td style={{ width: '160px' }}>{formatDate(report.date)}</td>
            <th style={{ width: '55px' }}>天候</th>
            <td style={{ width: '80px' }}>{report.weather || ''}</td>
            <th style={{ width: '55px' }}>氏名</th>
            <td style={{ width: '120px' }}>{report.userName}</td>
            <th style={{ width: '60px' }}>工事名</th>
            <td>{report.projectName}</td>
          </tr>
          <tr>
            <th>工事種別</th>
            <td>{report.projectType || ''}</td>
            <th>工事番号</th>
            <td colSpan={5}>{report.projectId || ''}</td>
          </tr>
        </tbody>
      </table>

      <div className="section-title">作業者記録</div>
      <table className="print-table mb-1">
        <thead>
          <tr>
            <th style={{ width: '25px' }}>No</th>
            <th style={{ width: '100px' }}>氏名</th>
            <th style={{ width: '50px' }}>開始</th>
            <th style={{ width: '50px' }}>終了</th>
            <th style={{ width: '45px' }}>工数</th>
            <th style={{ width: '80px' }}>工種</th>
            <th>内容</th>
            <th style={{ width: '45px' }}>当日</th>
            <th style={{ width: '45px' }}>累計</th>
          </tr>
        </thead>
        <tbody>
          {paddedWorkers.map((record, i) => (
            <tr key={i}>
              <td className="text-center">{i + 1}</td>
              <td>{record?.name || ''}</td>
              <td className="text-center">{record?.startTime || ''}</td>
              <td className="text-center">{record?.endTime || ''}</td>
              <td className="text-center">{record?.workHours || ''}</td>
              <td>{record?.workType || ''}</td>
              <td style={{ fontSize: '9px', whiteSpace: 'pre-wrap' }}>{record?.details || ''}</td>
              <td className="text-center">{record?.dailyHours || ''}</td>
              <td className="text-center">{record?.totalHours || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: '1' }}>
          <div className="section-title">使用材料・消耗品</div>
          <table className="print-table">
            <thead>
              <tr>
                <th style={{ width: '20px' }}>No</th>
                <th>材料名</th>
                <th style={{ width: '50px' }}>容量</th>
                <th style={{ width: '40px' }}>数量</th>
                <th style={{ width: '55px' }}>単価</th>
                <th style={{ width: '65px' }}>金額</th>
                <th style={{ width: '70px' }}>外注先</th>
              </tr>
            </thead>
            <tbody>
              {paddedMaterials.map((record, i) => {
                const amt = (record?.quantity || 0) * (record?.unitPrice || 0)
                return (
                  <tr key={i}>
                    <td className="text-center">{i + 1}</td>
                    <td>{record?.name || ''}</td>
                    <td className="text-center">{record?.volume || ''}{record?.volumeUnit || ''}</td>
                    <td className="text-right">{record?.quantity || ''}</td>
                    <td className="text-right">{record?.unitPrice ? `¥${record.unitPrice.toLocaleString()}` : ''}</td>
                    <td className="text-right">{amt > 0 ? `¥${amt.toLocaleString()}` : ''}</td>
                    <td>{record?.subcontractor || ''}</td>
                  </tr>
                )
              })}
              <tr>
                <td colSpan={5} className="text-right font-bold">合計</td>
                <td className="text-right font-bold">{totalAmount > 0 ? `¥${totalAmount.toLocaleString()}` : ''}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ width: '300px', flexShrink: 0 }}>
          <div className="section-title">外注先</div>
          <table className="print-table mb-1">
            <thead>
              <tr>
                <th style={{ width: '20px' }}>No</th>
                <th>外注先名</th>
                <th style={{ width: '35px' }}>人数</th>
                <th>作業内容</th>
              </tr>
            </thead>
            <tbody>
              {paddedSubs.map((record, i) => (
                <tr key={i}>
                  <td className="text-center">{i + 1}</td>
                  <td>{record?.name || ''}</td>
                  <td className="text-center">{record?.workerCount || ''}</td>
                  <td>{record?.workContent || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="section-title">遠隔地・交通誘導警備員</div>
          <table className="print-table">
            <tbody>
              <tr>
                <th style={{ width: '55px' }}>出発</th>
                <td>{report.remoteDepartureTime || '-'}</td>
                <th style={{ width: '55px' }}>現場着</th>
                <td>{report.remoteArrivalTime || '-'}</td>
              </tr>
              <tr>
                <th>現場発</th>
                <td>{report.remoteDepartureTime2 || '-'}</td>
                <th>会社着</th>
                <td>{report.remoteArrivalTime2 || '-'}</td>
              </tr>
              <tr>
                <th>警備員</th>
                <td>{report.trafficGuardCount || 0}名</td>
                <th>時間</th>
                <td>{report.trafficGuardStart || '-'} 〜 {report.trafficGuardEnd || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <table className="print-table mt-1">
        <tbody>
          <tr>
            <th style={{ width: '80px' }}>連絡事項</th>
            <td style={{ minHeight: '30px', whiteSpace: 'pre-wrap', fontSize: '10px', padding: '4px 6px' }}>
              {report.contactNotes || ''}
            </td>
          </tr>
        </tbody>
      </table>
      <div className="mt-2 text-right text-xs text-gray-500">安島工業株式会社</div>
    </>
  )
}

// ===== 営業日報印刷コンポーネント =====
function SalesReportPrint({ report, formatDate }: { report: Report; formatDate: (d: string) => string }) {
  const paddedVisitRecords: (VisitRecord | null)[] = [...(report.visitRecords || [])]
  while (paddedVisitRecords.length < 6) paddedVisitRecords.push(null)

  const totalExpense = (report.visitRecords || []).reduce((sum, r) => sum + (r.expense || 0), 0)

  return (
    <>
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold tracking-widest">営 業 日 報</h1>
      </div>

      <table className="print-table mb-1" style={{ width: '100%' }}>
        <tbody>
          <tr>
            <th style={{ width: '80px' }}>日付</th>
            <td style={{ width: '220px' }}>{formatDate(report.date)}</td>
            <th style={{ width: '80px' }}>氏名</th>
            <td style={{ width: '180px' }}>
              {report.userName}
              {report.userPosition && <span className="ml-1 text-xs">({report.userPosition})</span>}
            </td>
            <th style={{ width: '60px' }}>承認</th>
            {report.approvals && report.approvals.length > 0 ? (
              report.approvals.map(approval => (
                <td key={approval.id} className="text-center" style={{ width: '80px' }}>
                  <div className="text-[10px] text-gray-500">{ROLE_LABELS[approval.approverRole] || approval.approverRole}</div>
                  <div className="text-xs font-medium">
                    {approval.status === 'approved' ? '✓' : approval.status === 'rejected' ? '×' : ''}
                  </div>
                </td>
              ))
            ) : (
              <td colSpan={4} className="text-center text-xs text-gray-400">-</td>
            )}
          </tr>
        </tbody>
      </table>

      <table className="print-table mb-1">
        <thead>
          <tr>
            <th style={{ width: '30px' }}>No</th>
            <th style={{ width: '180px' }}>訪問先</th>
            <th style={{ width: '120px' }}>面接者ご氏名</th>
            <th style={{ width: '60px' }}>開始</th>
            <th style={{ width: '60px' }}>終了</th>
            <th>営業内容</th>
            <th style={{ width: '80px' }}>支出経費</th>
          </tr>
        </thead>
        <tbody>
          {paddedVisitRecords.map((record, i) => (
            <tr key={i}>
              <td className="text-center">{i + 1}</td>
              <td>{record?.destination || ''}</td>
              <td>{record?.contactPerson || ''}</td>
              <td className="text-center">{record?.startTime || ''}</td>
              <td className="text-center">{record?.endTime || ''}</td>
              <td style={{ minHeight: '28px', whiteSpace: 'pre-wrap', fontSize: '10px' }}>{record?.content || ''}</td>
              <td className="text-right">{record?.expense ? `¥${record.expense.toLocaleString()}` : ''}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={6} className="text-right font-bold">経費合計</td>
            <td className="text-right font-bold">{totalExpense > 0 ? `¥${totalExpense.toLocaleString()}` : ''}</td>
          </tr>
        </tbody>
      </table>

      <table className="print-table">
        <tbody>
          <tr>
            <th style={{ width: '120px' }}>連絡事項・備考</th>
            <td style={{ minHeight: '50px', whiteSpace: 'pre-wrap', fontSize: '11px', padding: '6px 8px' }}>
              {report.specialNotes || ''}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  )
}
