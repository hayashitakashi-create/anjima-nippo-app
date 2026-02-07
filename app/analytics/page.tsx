'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Settings,
  LogOut,
  Building2,
  Shield,
  TrendingUp,
  BarChart3,
  MapPin,
  Wrench,
  Package,
  FolderOpen,
  Users,
  FileText,
  Clock,
  DollarSign,
  ChevronDown,
} from 'lucide-react'

interface User {
  id: string
  name: string
  position?: string
  role: string
}

interface Summary {
  totalNippo: number
  totalWork: number
  totalReports: number
  totalWorkHours: number
  totalMaterialCost: number
  totalExpense: number
}

interface MonthlyTrend {
  month: string
  label: string
  nippoCount: number
  workCount: number
  total: number
}

interface RankingItem {
  name: string
  count: number
  totalExpense?: number
  totalHours?: number
  totalAmount?: number
}

interface ProjectItem {
  name: string
  reportCount: number
  totalHours: number
  totalCost: number
}

interface UserItem {
  name: string
  nippoCount: number
  workCount: number
  total: number
}

interface AnalyticsData {
  summary: Summary
  monthlyTrend: MonthlyTrend[]
  visitRanking: RankingItem[]
  workTypeRanking: RankingItem[]
  materialRanking: RankingItem[]
  projectRanking: ProjectItem[]
  userRanking: UserItem[]
  isAdmin: boolean
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(6)
  const [viewMode, setViewMode] = useState<'personal' | 'all'>('personal')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null }
        return res.json()
      })
      .then(d => {
        if (d?.user) setCurrentUser(d.user)
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)

    const userParam = currentUser.role === 'admin' && viewMode === 'all' ? 'all' : currentUser.id
    fetch(`/api/analytics?months=${months}&userId=${userParam}`)
      .then(res => {
        if (!res.ok) throw new Error('取得失敗')
        return res.json()
      })
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        console.error('分析データ取得エラー:', err)
        setLoading(false)
      })
  }, [currentUser, months, viewMode])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">分析データを読み込み中...</p>
      </div>
    )
  }

  // 棒グラフの最大値
  const maxMonthlyTotal = Math.max(...data.monthlyTrend.map(m => m.total), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">分析ダッシュボード</h1>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link href="/dashboard" className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="TOP画面">
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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {/* フィルター */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">期間:</label>
            <select
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={3}>過去3ヶ月</option>
              <option value={6}>過去6ヶ月</option>
              <option value={12}>過去12ヶ月</option>
            </select>
          </div>
          {data.isAdmin && (
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('personal')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'personal' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'
                }`}
              >
                個人
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'all' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'
                }`}
              >
                全社
              </button>
            </div>
          )}
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <SummaryCard icon={<FileText className="w-5 h-5" />} label="営業日報" value={data.summary.totalNippo} unit="件" color="emerald" />
          <SummaryCard icon={<Wrench className="w-5 h-5" />} label="作業日報" value={data.summary.totalWork} unit="件" color="blue" />
          <SummaryCard icon={<TrendingUp className="w-5 h-5" />} label="合計" value={data.summary.totalReports} unit="件" color="indigo" />
          <SummaryCard icon={<Clock className="w-5 h-5" />} label="総工数" value={data.summary.totalWorkHours} unit="h" color="orange" />
          <SummaryCard icon={<Package className="w-5 h-5" />} label="材料費" value={data.summary.totalMaterialCost} unit="円" isCurrency color="red" />
          <SummaryCard icon={<DollarSign className="w-5 h-5" />} label="経費" value={data.summary.totalExpense} unit="円" isCurrency color="purple" />
        </div>

        {/* 月別推移グラフ */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            月別日報件数推移
          </h2>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-2 min-w-[400px]" style={{ height: '200px' }}>
              {data.monthlyTrend.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div className="w-full flex flex-col items-center gap-0.5 flex-1 justify-end">
                    {/* 件数ラベル */}
                    {m.total > 0 && (
                      <span className="text-xs text-gray-500 font-medium">{m.total}</span>
                    )}
                    {/* 作業日報バー */}
                    {m.workCount > 0 && (
                      <div
                        className="w-full max-w-[40px] bg-[#0E3091] rounded-t-sm mx-auto"
                        style={{ height: `${(m.workCount / maxMonthlyTotal) * 140}px` }}
                        title={`作業日報: ${m.workCount}件`}
                      />
                    )}
                    {/* 営業日報バー */}
                    {m.nippoCount > 0 && (
                      <div
                        className="w-full max-w-[40px] bg-emerald-500 rounded-t-sm mx-auto"
                        style={{ height: `${(m.nippoCount / maxMonthlyTotal) * 140}px` }}
                        title={`営業日報: ${m.nippoCount}件`}
                      />
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" /> 営業日報</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#0E3091] rounded-sm inline-block" /> 作業日報</span>
          </div>
        </div>

        {/* 2カラムレイアウト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 訪問先ランキング */}
          <RankingSection
            title="訪問先ランキング"
            icon={<MapPin className="w-5 h-5 text-emerald-600" />}
            items={data.visitRanking}
            columns={[
              { label: '訪問先', key: 'name' },
              { label: '回数', key: 'count', align: 'right' },
              { label: '経費合計', key: 'totalExpense', align: 'right', format: 'currency' },
            ]}
            emptyText="訪問記録がありません"
            accentColor="emerald"
          />

          {/* 案件別集計 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              案件別集計
            </h2>
            {data.projectRanking.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">作業日報がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-gray-500 font-medium">案件名</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-medium">日報数</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-medium">工数</th>
                      <th className="text-right py-2 px-2 text-gray-500 font-medium">材料費</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.projectRanking.map((item, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium text-gray-900 max-w-[200px] truncate">{item.name}</td>
                        <td className="py-2 px-2 text-right text-gray-700">{item.reportCount}</td>
                        <td className="py-2 px-2 text-right text-gray-700">{Math.round(item.totalHours * 10) / 10}h</td>
                        <td className="py-2 px-2 text-right text-gray-700">{item.totalCost > 0 ? `¥${Math.round(item.totalCost).toLocaleString()}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 工種別集計 */}
          <RankingSection
            title="工種別工数集計"
            icon={<Wrench className="w-5 h-5 text-orange-600" />}
            items={data.workTypeRanking}
            columns={[
              { label: '工種', key: 'name' },
              { label: '件数', key: 'count', align: 'right' },
              { label: '工数合計', key: 'totalHours', align: 'right', format: 'hours' },
            ]}
            emptyText="作業記録がありません"
            accentColor="orange"
          />

          {/* 材料ランキング */}
          <RankingSection
            title="材料費ランキング"
            icon={<Package className="w-5 h-5 text-red-600" />}
            items={data.materialRanking}
            columns={[
              { label: '材料名', key: 'name' },
              { label: '使用回数', key: 'count', align: 'right' },
              { label: '金額合計', key: 'totalAmount', align: 'right', format: 'currency' },
            ]}
            emptyText="材料記録がありません"
            accentColor="red"
          />
        </div>

        {/* ユーザー別集計（管理者・全社モード時） */}
        {data.isAdmin && viewMode === 'all' && data.userRanking.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              社員別日報件数
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 text-gray-500 font-medium">氏名</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">営業日報</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">作業日報</th>
                    <th className="text-right py-2 px-2 text-gray-500 font-medium">合計</th>
                  </tr>
                </thead>
                <tbody>
                  {data.userRanking.map((item, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium text-gray-900">{item.name}</td>
                      <td className="py-2 px-2 text-right text-gray-700">{item.nippoCount}</td>
                      <td className="py-2 px-2 text-right text-gray-700">{item.workCount}</td>
                      <td className="py-2 px-2 text-right font-bold text-indigo-600">{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// サマリーカードコンポーネント
function SummaryCard({ icon, label, value, unit, color, isCurrency }: {
  icon: React.ReactNode
  label: string
  value: number
  unit: string
  color: string
  isCurrency?: boolean
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-[#0E3091]',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  const formatted = isCurrency
    ? `¥${Math.round(value).toLocaleString()}`
    : value.toLocaleString()

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${colorMap[color] || colorMap.indigo}`}>
        {icon}
      </div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">
        {formatted}
        {!isCurrency && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

// ランキングセクションコンポーネント
function RankingSection({ title, icon, items, columns, emptyText, accentColor }: {
  title: string
  icon: React.ReactNode
  items: any[]
  columns: { label: string; key: string; align?: string; format?: string }[]
  emptyText: string
  accentColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-8">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {columns.map((col, i) => (
                  <th key={i} className={`py-2 px-2 text-gray-500 font-medium ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  {columns.map((col, j) => {
                    let displayVal = item[col.key]
                    if (col.format === 'currency' && displayVal) {
                      displayVal = `¥${Math.round(displayVal).toLocaleString()}`
                    } else if (col.format === 'hours' && displayVal) {
                      displayVal = `${Math.round(displayVal * 10) / 10}h`
                    }
                    return (
                      <td
                        key={j}
                        className={`py-2 px-2 ${col.align === 'right' ? 'text-right text-gray-700' : 'font-medium text-gray-900 max-w-[200px] truncate'}`}
                      >
                        {displayVal || '-'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
