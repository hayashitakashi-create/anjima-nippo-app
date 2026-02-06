'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  FileText,
  Plus,
  List,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  Bell,
  Search,
  LogOut,
  User,
  Building2
} from 'lucide-react'

interface User {
  id: string
  name: string
  position?: string
  role: string
  defaultReportType: string
}

interface RecentReport {
  id: string
  date: string
  destination?: string
  status: 'draft' | 'submitted' | 'approved'
}

interface Stats {
  totalReports: number
  thisMonth: number
  pendingApproval: number
  approved: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<'sales' | 'work'>('work')
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [stats, setStats] = useState<Stats>({
    totalReports: 0,
    thisMonth: 0,
    pendingApproval: 0,
    approved: 0
  })

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
          setReportType(data.user.defaultReportType === 'sales' ? 'sales' : 'work')
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('ユーザー取得エラー:', error)
        router.push('/login')
      })

    // 最近の日報取得
    fetch('/api/nippo/list')
      .then(res => res.json())
      .then(data => {
        if (data && data.reports) {
          // 最新5件を取得
          const recent = data.reports.slice(0, 5).map((report: any) => ({
            id: report.id,
            date: report.date,
            destination: report.visitRecords?.[0]?.destination,
            status: 'submitted' as const
          }))
          setRecentReports(recent)

          // 統計を計算
          const total = data.reports.length
          const thisMonth = data.reports.filter((r: any) => {
            const reportDate = new Date(r.date)
            const now = new Date()
            return reportDate.getMonth() === now.getMonth() &&
                   reportDate.getFullYear() === now.getFullYear()
          }).length

          setStats({
            totalReports: total,
            thisMonth: thisMonth,
            pendingApproval: Math.floor(thisMonth * 0.3), // 仮の数値
            approved: Math.floor(thisMonth * 0.7) // 仮の数値
          })
        }
      })
      .catch(error => {
        console.error('日報取得エラー:', error)
      })
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-gray-600 text-lg"
        >
          読み込み中...
        </motion.div>
      </div>
    )
  }

  const reportTypeName = reportType === 'sales' ? '営業日報' : '作業日報'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            承認済み
          </span>
        )
      case 'submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            承認待ち
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle className="w-3 h-3 mr-1" />
            下書き
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50">
      {/* 固定トップナビ */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* 左側: ロゴ + 会社名 + タブ */}
            <div className="flex items-center space-x-2 sm:space-x-8">
              {/* ロゴ + 会社名 */}
              <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">安島工業株式会社</h1>
                  <p className="text-xs text-gray-500">日報システム</p>
                </div>
              </Link>

              {/* タブ切り替え */}
              <div className="flex bg-slate-100 rounded-lg p-0.5 sm:p-1">
                <button
                  onClick={() => setReportType('sales')}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    reportType === 'sales'
                      ? 'bg-white text-emerald-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  営業<span className="hidden sm:inline">日報</span>
                </button>
                <button
                  onClick={() => setReportType('work')}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                    reportType === 'work'
                      ? 'bg-white text-emerald-600 shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  作業<span className="hidden sm:inline">日報</span>
                </button>
              </div>
            </div>

            {/* 右側: アイコン + ユーザー情報 */}
            <div className="flex items-center space-x-1 sm:space-x-4">
              {/* 検索 */}
              <button className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                <Search className="w-5 h-5" />
              </button>

              {/* 通知 */}
              <button className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* ユーザー情報 */}
              <div className="flex items-center space-x-2 sm:space-x-3 pl-2 sm:pl-4 border-l border-slate-200">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
                  <p className="text-xs text-gray-500">{currentUser?.position || '一般社員'}</p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white font-semibold">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>

              {/* ログアウト */}
              <button
                onClick={handleLogout}
                className="hidden sm:block p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="pt-16 sm:pt-24 pb-12 px-3 sm:px-6">
        <div className="max-w-[1600px] mx-auto">
          {/* ウェルカムメッセージ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 sm:mb-8"
          >
            <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
              おはようございます、{currentUser?.name}さん
            </h2>
            <p className="text-sm sm:text-base text-gray-600">今日も一日頑張りましょう！</p>
          </motion.div>

          {/* 12列グリッド */}
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            {/* 左8列 */}
            <div className="col-span-12 lg:col-span-8 space-y-4 sm:space-y-6">
              {/* クイックアクション（2列） */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
              >
                {/* 新規日報作成 */}
                <Link
                  href="/nippo-improved"
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl transition-transform group-hover:scale-105"></div>
                  <div className="relative p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Plus className="w-6 h-6" />
                      </div>
                      <motion.div
                        whileHover={{ rotate: 90 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Plus className="w-6 h-6 text-white/60" />
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">新規日報作成</h3>
                    <p className="text-emerald-100 text-sm">
                      新しい{reportTypeName}を作成します
                    </p>
                  </div>
                </Link>

                {/* 日報一覧 */}
                <Link
                  href="/nippo"
                  className="group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white rounded-xl border-2 border-slate-200 transition-all group-hover:border-emerald-300 group-hover:shadow-lg"></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                        <List className="w-6 h-6 text-white" />
                      </div>
                      <FileText className="w-6 h-6 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">日報一覧</h3>
                    <p className="text-gray-600 text-sm">
                      過去の{reportTypeName}を閲覧・編集
                    </p>
                  </div>
                </Link>
              </motion.div>

              {/* 最近の日報 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                    最近の日報
                  </h3>
                  <Link
                    href="/nippo"
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    すべて表示 →
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentReports.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">まだ日報が登録されていません</p>
                  ) : (
                    recentReports.map((report, index) => (
                      <motion.div
                        key={report.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link
                          href={`/nippo/${report.id}`}
                          className="block p-4 rounded-lg border border-slate-200 hover:border-emerald-300 transition-all group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                                  {formatDate(report.date)}の日報
                                </p>
                                {report.destination && (
                                  <p className="text-sm text-gray-500">{report.destination}</p>
                                )}
                              </div>
                            </div>
                            {getStatusBadge(report.status)}
                          </div>
                        </Link>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </div>

            {/* 右4列 */}
            <div className="col-span-12 lg:col-span-4 space-y-4 sm:space-y-6">
              {/* 統計カード */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-emerald-600" />
                  今月の実績
                </h3>

                <div className="space-y-6">
                  {/* 作成済み */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">作成済み</span>
                      <span className="text-2xl font-bold text-emerald-600">{stats.thisMonth}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.thisMonth / 30) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">目標: 月30件</p>
                  </div>

                  {/* 承認待ち */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">承認待ち</span>
                      <span className="text-2xl font-bold text-orange-600">{stats.pendingApproval}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.pendingApproval / stats.thisMonth) * 100}%` }}
                        transition={{ duration: 1, delay: 0.7 }}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                      />
                    </div>
                  </div>

                  {/* 承認済み */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">承認済み</span>
                      <span className="text-2xl font-bold text-emerald-600">{stats.approved}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.approved / stats.thisMonth) * 100}%` }}
                        transition={{ duration: 1, delay: 0.9 }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* クイックリンク */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-4">クイックリンク</h3>
                <div className="space-y-2">
                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <Settings className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="text-gray-700 group-hover:text-emerald-600 transition-colors">
                      アカウント設定
                    </span>
                  </Link>
                </div>
              </motion.div>

              {/* 総日報数 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-6 shadow-lg text-white"
              >
                <p className="text-emerald-100 text-sm mb-2">累計日報数</p>
                <p className="text-5xl font-bold mb-1">{stats.totalReports}</p>
                <p className="text-emerald-100 text-sm">件</p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
