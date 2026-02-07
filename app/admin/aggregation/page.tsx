'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
  Truck,
  Download,
  BarChart3,
  Calendar,
  ArrowLeft,
  Loader2,
  Filter,
} from 'lucide-react'

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

interface ProjectOption {
  id: string
  name: string
}

interface AggregationData {
  period: {
    start: string
    end: string
    label: string
  }
  reportCount: number
  labor: LaborItem[]
  materials: MaterialItem[]
  subcontractors: SubcontractorItem[]
  projects: ProjectOption[]
  totals: {
    laborHours: number
    materialAmount: number
    subcontractorCount: number
  }
}

type TabType = 'labor' | 'materials' | 'subcontractors'

export default function AggregationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AggregationData | null>(null)
  const [offset, setOffset] = useState(0)
  const [activeTab, setActiveTab] = useState<TabType>('labor')
  const [projectFilter, setProjectFilter] = useState('')
  const [error, setError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        offset: offset.toString(),
      })
      if (projectFilter) {
        params.set('projectRefId', projectFilter)
      }
      const res = await fetch(`/api/aggregation?${params}`)
      if (!res.ok) {
        if (res.status === 401) { router.push('/login'); return }
        if (res.status === 403) { router.push('/dashboard'); return }
        throw new Error('取得失敗')
      }
      const json = await res.json()
      setData(json)
    } catch {
      setError('集計データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [offset, projectFilter, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      console.error('ログアウトエラー:', err)
    }
  }

  // CSV出力
  const handleExportCSV = () => {
    if (!data) return

    let csvContent = ''
    const bom = '\uFEFF'

    if (activeTab === 'labor') {
      csvContent = '氏名,月〜土 8:00-17:00,月〜土 時間外,月〜土 (うち22:00-5:00),月〜土 小計,日曜 8:00-17:00,日曜 時間外,日曜 (うち22:00-5:00),日曜 小計,合計,移動時間\n'
      data.labor.forEach(item => {
        csvContent += `"${item.name}",${fh(item.weekdayNormal)},${fh(item.weekdayOvertime)},${fh(item.weekdayLateNight)},${fh(item.weekdaySubtotal)},${fh(item.sundayNormal)},${fh(item.sundayOvertime)},${fh(item.sundayLateNight)},${fh(item.sundaySubtotal)},${fh(item.total)},${fh(item.travelTime)}\n`
      })
      const totals = calcLaborTotals(data.labor)
      csvContent += `"合計",${fh(totals.weekdayNormal)},${fh(totals.weekdayOvertime)},${fh(totals.weekdayLateNight)},${fh(totals.weekdaySubtotal)},${fh(totals.sundayNormal)},${fh(totals.sundayOvertime)},${fh(totals.sundayLateNight)},${fh(totals.sundaySubtotal)},${fh(totals.total)},${fh(totals.travelTime)}\n`
    } else if (activeTab === 'materials') {
      csvContent = '使用材料・消耗品,容量,単価,数量,金額\n'
      data.materials.forEach(item => {
        const vol = item.volume ? `${item.volume}${item.volumeUnit}` : ''
        csvContent += `"${item.name}","${vol}",${item.unitPrice},${item.totalQuantity},${item.totalAmount}\n`
      })
      csvContent += `"合計",,,,${data.totals.materialAmount}\n`
    } else {
      csvContent = '(外注)会社名,工数\n'
      data.subcontractors.forEach(item => {
        csvContent += `"${item.name}",${item.totalWorkerCount}\n`
      })
      csvContent += `"合計",${data.totals.subcontractorCount}\n`
    }

    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const tabLabel = activeTab === 'labor' ? '労働時間' : activeTab === 'materials' ? '材料' : '外注'
    link.download = `${tabLabel}集計_${data.period.label.replace(/\//g, '-').replace(/ /g, '')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const tabs: { key: TabType; label: string; icon: typeof Clock }[] = [
    { key: 'labor', label: '労働時間', icon: Clock },
    { key: 'materials', label: '材料', icon: Package },
    { key: 'subcontractors', label: '外注', icon: Truck },
  ]

  // 時間表示フォーマット（小数2桁、0.00は0.00と表示）
  const fh = (n: number) => n.toFixed(2)

  const formatNumber = (n: number) => {
    return n.toLocaleString('ja-JP', { maximumFractionDigits: 3 })
  }

  const formatCurrency = (n: number) => {
    return n.toLocaleString('ja-JP')
  }

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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">月次集計</h1>
                <p className="text-xs text-gray-500 hidden sm:block">労働時間・材料・外注</p>
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

            {/* 物件フィルタ */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none max-w-[200px] sm:max-w-[280px]"
              >
                <option value="">全物件</option>
                {data?.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* サマリーカード */}
        {data && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">日報数</p>
                  <p className="text-2xl font-bold text-gray-900">{data.reportCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">労働時間合計</p>
                  <p className="text-2xl font-bold text-gray-900">{fh(data.totals.laborHours)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">材料費合計</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(data.totals.materialAmount)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">外注工数合計</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(data.totals.subcontractorCount)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* タブ切り替え + CSV出力 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white shadow text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
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

        {/* コンテンツ */}
        {!loading && data && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            {/* ① 労働時間タブ */}
            {activeTab === 'labor' && (
              <>
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-blue-50/50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    労働時間集計
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">{data.period.label} / {data.labor.length}名</p>
                </div>

                {data.labor.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    該当期間のデータがありません
                  </div>
                ) : (
                  <>
                    {/* PC表示: Excel形式テーブル */}
                    <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full min-w-[1000px] text-xs">
                        <thead>
                          {/* グループヘッダー行 */}
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
                          {/* サブヘッダー行 */}
                          <tr className="border-b-2 border-slate-300 bg-gray-50">
                            <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[80px]">
                              8:00~17:00
                            </th>
                            <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[80px]">
                              8:00~17:00以外
                            </th>
                            <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[90px]">
                              (うち22:00~5:00)
                            </th>
                            <th className="px-2 py-1.5 text-center font-bold text-green-800 bg-green-50 border-r border-slate-300 min-w-[70px]">
                              小計
                            </th>
                            <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[80px]">
                              8:00~17:00
                            </th>
                            <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[80px]">
                              8:00~17:00以外
                            </th>
                            <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-r border-slate-200 min-w-[90px]">
                              (うち22:00~5:00)
                            </th>
                            <th className="px-2 py-1.5 text-center font-bold text-red-800 bg-red-50 border-r border-slate-300 min-w-[70px]">
                              小計
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.labor.map((item, i) => (
                            <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-2 font-medium text-gray-900 bg-white border-r border-slate-200 sticky left-0 z-[1]">
                                {item.name}
                              </td>
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
                            const t = calcLaborTotals(data.labor)
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
                          {data.labor.map((item) => (
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
                            const t = calcLaborTotals(data.labor)
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
                      {data.labor.map((item) => (
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
                          {/* 詳細展開 */}
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
                          <span className="font-mono text-blue-800">{fh(data.totals.laborHours)}</span>
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
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-emerald-50/50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-emerald-600" />
                    材料集計
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">{data.period.label} / {data.materials.length}品目</p>
                </div>

                {data.materials.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    該当期間のデータがありません
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
                          {data.materials.map((item, i) => (
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
                            <td className="px-6 py-3 text-sm font-bold text-gray-900">合計</td>
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3"></td>
                            <td className="px-6 py-3 text-sm text-right font-mono font-bold text-emerald-700">
                              {formatCurrency(data.totals.materialAmount)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* モバイル表示 */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {data.materials.map((item, i) => (
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
                          <span className="font-bold text-gray-900">金額合計</span>
                          <span className="font-mono font-bold text-emerald-700">{formatCurrency(data.totals.materialAmount)}</span>
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
                <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-indigo-50/50">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-indigo-600" />
                    外注集計
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">{data.period.label} / {data.subcontractors.length}社</p>
                </div>

                {data.subcontractors.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    該当期間のデータがありません
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
                          {data.subcontractors.map((item, i) => (
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
                            <td className="px-6 py-3 text-sm font-bold text-gray-900">合計</td>
                            <td className="px-6 py-3 text-sm text-right font-mono font-bold text-indigo-700">{formatNumber(data.totals.subcontractorCount)}</td>
                            <td className="px-6 py-3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* モバイル表示 */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {data.subcontractors.map((item, i) => (
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
                          <span className="font-bold text-gray-900">工数合計</span>
                          <span className="font-mono font-bold text-indigo-700">{formatNumber(data.totals.subcontractorCount)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
