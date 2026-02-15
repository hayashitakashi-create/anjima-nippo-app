'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  FileText,
  Users,
  Package,
  Briefcase,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  Settings,
  Shield,
  LogOut,
  Download,
} from 'lucide-react'

interface CurrentUser {
  id: string
  name: string
  role: string
}

interface TotalSummary {
  totalReports: number
  totalManHours: number
  totalDailyHours: number
  totalProjects: number
  totalWorkers: number
}

interface ProjectData {
  projectName: string
  projectType: string
  totalManHours: number
  totalDailyHours: number
  workerCount: number
  reportCount: number
}

interface WorkerData {
  name: string
  totalManHours: number
  totalDailyHours: number
  projectCount: number
  reportCount: number
}

interface MaterialSummary {
  totalMaterialTypes: number
  totalQuantity: number
  totalAmount: number
  totalUsageCount: number
}

interface MaterialData {
  name: string
  totalQuantity: number
  totalAmount: number
  usageCount: number
  avgUnitPrice: number
  volumeUnits: string[]
  projectCount: number
}

interface SubcontractorSummary {
  totalSubcontractors: number
  totalWorkerCount: number
  totalDays: number
  avgWorkerPerDay: number
}

interface SubcontractorData {
  name: string
  totalWorkerCount: number
  totalDays: number
  avgWorkerPerDay: number
  workContents: string[]
  projectCount: number
  projects: string[]
}

type TabType = 'monthly' | 'materials' | 'subcontractors'

export default function ReportsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('monthly')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(true)

  // 月次レポートデータ
  const [monthlySummary, setMonthlySummary] = useState<TotalSummary | null>(null)
  const [projectData, setProjectData] = useState<ProjectData[]>([])
  const [workerData, setWorkerData] = useState<WorkerData[]>([])

  // 材料レポートデータ
  const [materialSummary, setMaterialSummary] = useState<MaterialSummary | null>(null)
  const [materialData, setMaterialData] = useState<MaterialData[]>([])

  // 外注先レポートデータ
  const [subcontractorSummary, setSubcontractorSummary] = useState<SubcontractorSummary | null>(null)
  const [subcontractorData, setSubcontractorData] = useState<SubcontractorData[]>([])

  // ユーザー認証
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
          setCurrentUser(data.user)
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  // データ取得
  useEffect(() => {
    if (!currentUser) return

    const fetchData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'monthly') {
          const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}`, {
            credentials: 'include',
          })
          if (res.ok) {
            const data = await res.json()
            setMonthlySummary(data.totalSummary)
            setProjectData(data.projectData)
            setWorkerData(data.workerData)
          }
        } else if (activeTab === 'materials') {
          const res = await fetch(`/api/reports/materials?year=${year}&month=${month}`, {
            credentials: 'include',
          })
          if (res.ok) {
            const data = await res.json()
            setMaterialSummary(data.totalSummary)
            setMaterialData(data.materialData)
          }
        } else if (activeTab === 'subcontractors') {
          const res = await fetch(`/api/reports/subcontractors?year=${year}&month=${month}`, {
            credentials: 'include',
          })
          if (res.ok) {
            const data = await res.json()
            setSubcontractorSummary(data.totalSummary)
            setSubcontractorData(data.subcontractorData)
          }
        }
      } catch (error) {
        console.error('データ取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser, activeTab, year, month])

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  // CSV出力
  const handleExportCSV = () => {
    let csvContent = ''
    let filename = ''

    if (activeTab === 'monthly') {
      filename = `月次集計_${year}年${month}月.csv`
      csvContent = '物件別集計\n'
      csvContent += '物件名,工事種別,総工数,日報数,作業者数\n'
      projectData.forEach(p => {
        csvContent += `"${p.projectName}","${p.projectType}",${p.totalManHours},${p.reportCount},${p.workerCount}\n`
      })
      csvContent += '\n作業者別集計\n'
      csvContent += '氏名,総工数,日報数,物件数\n'
      workerData.forEach(w => {
        csvContent += `"${w.name}",${w.totalManHours},${w.reportCount},${w.projectCount}\n`
      })
    } else if (activeTab === 'materials') {
      filename = `材料使用量_${year}年${month}月.csv`
      csvContent = '材料名,数量,金額,使用回数,平均単価,物件数\n'
      materialData.forEach(m => {
        csvContent += `"${m.name}",${m.totalQuantity},${m.totalAmount},${m.usageCount},${m.avgUnitPrice},${m.projectCount}\n`
      })
    } else if (activeTab === 'subcontractors') {
      filename = `外注先集計_${year}年${month}月.csv`
      csvContent = '外注先名,延べ人数,稼働日数,平均人数/日,物件数,作業内容\n'
      subcontractorData.forEach(s => {
        csvContent += `"${s.name}",${s.totalWorkerCount},${s.totalDays},${s.avgWorkerPerDay},${s.projectCount},"${s.workContents.join(', ')}"\n`
      })
    }

    const bom = new Uint8Array([0xef, 0xbb, 0xbf])
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'monthly' as TabType, label: '月次集計', icon: BarChart3 },
    { id: 'materials' as TabType, label: '材料使用量', icon: Package },
    { id: 'subcontractors' as TabType, label: '外注先集計', icon: Briefcase },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#0E3091] to-[#1a4ab8] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">レポート・分析</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
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

      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* 月選択 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0E3091]" />
              <span className="text-lg font-bold text-gray-900">{year}年{month}月</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* タブ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#0E3091] border-b-2 border-[#0E3091] bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* CSV出力ボタン */}
          <div className="flex justify-end p-3 border-b bg-gray-50">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0E3091] bg-white border border-[#0E3091] rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV出力
            </button>
          </div>

          {/* コンテンツ */}
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : (
              <>
                {/* 月次集計 */}
                {activeTab === 'monthly' && (
                  <div className="space-y-6">
                    {/* サマリーカード */}
                    {monthlySummary && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-blue-600 font-medium">日報数</p>
                          <p className="text-2xl font-bold text-blue-900">{monthlySummary.totalReports}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-green-600 font-medium">総工数</p>
                          <p className="text-2xl font-bold text-green-900">{monthlySummary.totalManHours.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <p className="text-xs text-purple-600 font-medium">物件数</p>
                          <p className="text-2xl font-bold text-purple-900">{monthlySummary.totalProjects}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <p className="text-xs text-orange-600 font-medium">作業者数</p>
                          <p className="text-2xl font-bold text-orange-900">{monthlySummary.totalWorkers}</p>
                        </div>
                      </div>
                    )}

                    {/* 物件別集計 */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#0E3091]" />
                        物件別工数集計
                      </h3>
                      {projectData.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">データがありません</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">物件名</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">工事種別</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">総工数</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">日報数</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">作業者数</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {projectData.map((p, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">{p.projectName}</td>
                                  <td className="px-4 py-3 text-gray-600">{p.projectType || '-'}</td>
                                  <td className="px-4 py-3 text-right font-bold text-[#0E3091]">{p.totalManHours.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{p.reportCount}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{p.workerCount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 作業者別集計 */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#0E3091]" />
                        作業者別工数集計
                      </h3>
                      {workerData.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">データがありません</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">氏名</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">総工数</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">日報数</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">物件数</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {workerData.map((w, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                                  <td className="px-4 py-3 text-right font-bold text-[#0E3091]">{w.totalManHours.toLocaleString()}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{w.reportCount}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{w.projectCount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 材料使用量 */}
                {activeTab === 'materials' && (
                  <div className="space-y-6">
                    {/* サマリーカード */}
                    {materialSummary && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-blue-600 font-medium">材料種類</p>
                          <p className="text-2xl font-bold text-blue-900">{materialSummary.totalMaterialTypes}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-green-600 font-medium">総数量</p>
                          <p className="text-2xl font-bold text-green-900">{materialSummary.totalQuantity.toLocaleString()}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <p className="text-xs text-purple-600 font-medium">総金額</p>
                          <p className="text-2xl font-bold text-purple-900">{materialSummary.totalAmount.toLocaleString()}円</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <p className="text-xs text-orange-600 font-medium">使用回数</p>
                          <p className="text-2xl font-bold text-orange-900">{materialSummary.totalUsageCount}</p>
                        </div>
                      </div>
                    )}

                    {/* 材料別集計 */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#0E3091]" />
                        材料別使用量
                      </h3>
                      {materialData.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">データがありません</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">材料名</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">数量</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">金額</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">平均単価</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">使用回数</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">物件数</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {materialData.map((m, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">
                                    {m.totalQuantity.toLocaleString()}
                                    {m.volumeUnits.length > 0 && <span className="text-xs ml-1">{m.volumeUnits[0]}</span>}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-[#0E3091]">{m.totalAmount.toLocaleString()}円</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{m.avgUnitPrice.toLocaleString()}円</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{m.usageCount}</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{m.projectCount}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 金額トップ5のバーグラフ */}
                    {materialData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">金額トップ5</h3>
                        <div className="space-y-3">
                          {materialData.slice(0, 5).map((m, i) => {
                            const maxAmount = materialData[0].totalAmount
                            const percentage = maxAmount > 0 ? (m.totalAmount / maxAmount) * 100 : 0
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-24 text-sm text-gray-700 truncate">{m.name}</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] h-full rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${percentage}%` }}
                                  >
                                    {percentage > 30 && (
                                      <span className="text-xs text-white font-medium">{m.totalAmount.toLocaleString()}円</span>
                                    )}
                                  </div>
                                </div>
                                {percentage <= 30 && (
                                  <span className="text-xs text-gray-600 w-20 text-right">{m.totalAmount.toLocaleString()}円</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 外注先集計 */}
                {activeTab === 'subcontractors' && (
                  <div className="space-y-6">
                    {/* サマリーカード */}
                    {subcontractorSummary && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-blue-600 font-medium">外注先数</p>
                          <p className="text-2xl font-bold text-blue-900">{subcontractorSummary.totalSubcontractors}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <p className="text-xs text-green-600 font-medium">延べ人数</p>
                          <p className="text-2xl font-bold text-green-900">{subcontractorSummary.totalWorkerCount.toLocaleString()}人</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                          <p className="text-xs text-purple-600 font-medium">稼働日数</p>
                          <p className="text-2xl font-bold text-purple-900">{subcontractorSummary.totalDays}日</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                          <p className="text-xs text-orange-600 font-medium">平均人数/日</p>
                          <p className="text-2xl font-bold text-orange-900">{subcontractorSummary.avgWorkerPerDay}人</p>
                        </div>
                      </div>
                    )}

                    {/* 外注先別集計 */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[#0E3091]" />
                        外注先別稼働実績
                      </h3>
                      {subcontractorData.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">データがありません</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">外注先名</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">延べ人数</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">稼働日数</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">平均人数/日</th>
                                <th className="px-4 py-3 text-right font-medium text-gray-700">物件数</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-700">作業内容</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {subcontractorData.map((s, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                                  <td className="px-4 py-3 text-right font-bold text-[#0E3091]">{s.totalWorkerCount.toLocaleString()}人</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{s.totalDays}日</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{s.avgWorkerPerDay}人</td>
                                  <td className="px-4 py-3 text-right text-gray-600">{s.projectCount}</td>
                                  <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate">{s.workContents.slice(0, 3).join(', ')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 稼働人数トップ5のバーグラフ */}
                    {subcontractorData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">稼働人数トップ5</h3>
                        <div className="space-y-3">
                          {subcontractorData.slice(0, 5).map((s, i) => {
                            const maxCount = subcontractorData[0].totalWorkerCount
                            const percentage = maxCount > 0 ? (s.totalWorkerCount / maxCount) * 100 : 0
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-32 text-sm text-gray-700 truncate">{s.name}</div>
                                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#0E3091] to-[#1a4ab8] h-full rounded-full flex items-center justify-end pr-2"
                                    style={{ width: `${percentage}%` }}
                                  >
                                    {percentage > 30 && (
                                      <span className="text-xs text-white font-medium">{s.totalWorkerCount}人</span>
                                    )}
                                  </div>
                                </div>
                                {percentage <= 30 && (
                                  <span className="text-xs text-gray-600 w-16 text-right">{s.totalWorkerCount}人</span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
