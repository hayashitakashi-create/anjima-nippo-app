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
  Building2,
  Shield,
  BarChart3
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
  type: 'sales' | 'work'
}

interface Stats {
  totalReports: number
  thisMonth: number
  pendingApproval: number
  approved: number
}

interface UnsubmittedData {
  salesUnsubmitted: Array<{ id: string; name: string }>
  workUnsubmitted: Array<{ id: string; name: string }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<'sales' | 'work'>('work')
  const [salesReports, setSalesReports] = useState<RecentReport[]>([])
  const [workReports, setWorkReports] = useState<RecentReport[]>([])
  const [salesStats, setSalesStats] = useState<Stats>({
    totalReports: 0,
    thisMonth: 0,
    pendingApproval: 0,
    approved: 0
  })
  const [workStats, setWorkStats] = useState<Stats>({
    totalReports: 0,
    thisMonth: 0,
    pendingApproval: 0,
    approved: 0
  })
  const [unreadCount, setUnreadCount] = useState(0)
  const [unsubmitted, setUnsubmitted] = useState<UnsubmittedData | null>(null)

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

    // 営業日報取得
    fetch('/api/nippo/list')
      .then(res => {
        if (!res.ok) return null
        return res.json()
      })
      .then(data => {
        if (data && data.reports) {
          const recent = data.reports.slice(0, 5).map((report: any) => ({
            id: report.id,
            date: report.date,
            destination: report.visitRecords?.[0]?.destination,
            status: 'submitted' as const,
            type: 'sales' as const
          }))
          setSalesReports(recent)

          const total = data.reports.length
          const thisMonth = data.reports.filter((r: any) => {
            const reportDate = new Date(r.date)
            const now = new Date()
            return reportDate.getMonth() === now.getMonth() &&
                   reportDate.getFullYear() === now.getFullYear()
          }).length

          setSalesStats({
            totalReports: total,
            thisMonth: thisMonth,
            pendingApproval: Math.floor(thisMonth * 0.3),
            approved: Math.floor(thisMonth * 0.7)
          })
        }
      })
      .catch(error => {
        console.error('営業日報取得エラー:', error)
      })

    // 通知の未読数取得
    fetch('/api/notifications?limit=1')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setUnreadCount(data.unreadCount || 0)
      })
      .catch(() => {})
  }, [router])

  // 作業日報取得 + 管理者向け未提出者情報取得（ユーザー情報取得後）
  useEffect(() => {
    if (!currentUser) return

    // 管理者なら未提出者情報を取得
    if (currentUser.role === 'admin') {
      fetch('/api/notifications/unsubmitted')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setUnsubmitted(data)
        })
        .catch(() => {})
    }

    fetch(`/api/work-report?userId=${currentUser.id}`)
      .then(res => {
        if (!res.ok) return null
        return res.json()
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          const recent = data.slice(0, 5).map((report: any) => ({
            id: report.id,
            date: report.date,
            destination: report.projectName || '',
            status: 'submitted' as const,
            type: 'work' as const
          }))
          setWorkReports(recent)

          const total = data.length
          const thisMonth = data.filter((r: any) => {
            const reportDate = new Date(r.date)
            const now = new Date()
            return reportDate.getMonth() === now.getMonth() &&
                   reportDate.getFullYear() === now.getFullYear()
          }).length

          setWorkStats({
            totalReports: total,
            thisMonth: thisMonth,
            pendingApproval: 0,
            approved: thisMonth
          })
        }
      })
      .catch(error => {
        console.error('作業日報取得エラー:', error)
      })
  }, [currentUser])

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
  const recentReports = reportType === 'sales' ? salesReports : workReports
  const stats = reportType === 'sales' ? salesStats : workStats

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* 左側: ロゴ + 会社名 + タブ */}
            <div className="flex items-center space-x-2 sm:space-x-8">
              {/* ロゴ + 会社名 */}
              <Link href="/dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
                  reportType === 'sales'
                    ? 'bg-emerald-500'
                    : 'bg-[#0E3091]'
                }`}>
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">安島工業株式会社</h1>
                  <p className="text-xs text-gray-500">日報システム</p>
                </div>
              </Link>

              {/* タブ切り替え */}
              <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1">
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
                      ? 'bg-white text-[#0E3091] shadow'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  作業<span className="hidden sm:inline">日報</span>
                </button>
              </div>
            </div>

            {/* 右側: アイコンメニュー */}
            <div className="flex items-center space-x-1 sm:space-x-3">
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
                href="/notifications"
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="通知"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
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

          {/* 管理者向け: 未提出リマインダー */}
          {currentUser?.role === 'admin' && unsubmitted && (
            (unsubmitted.salesUnsubmitted.length > 0 || unsubmitted.workUnsubmitted.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 sm:p-5"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-800 mb-2">本日の日報未提出者</h3>
                    <div className="space-y-2">
                      {unsubmitted.salesUnsubmitted.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-orange-700">営業日報: </span>
                          <span className="text-sm text-orange-600">
                            {unsubmitted.salesUnsubmitted.map(u => u.name).join('、')}
                          </span>
                          <span className="text-xs text-orange-500 ml-1">
                            ({unsubmitted.salesUnsubmitted.length}名)
                          </span>
                        </div>
                      )}
                      {unsubmitted.workUnsubmitted.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-orange-700">作業日報: </span>
                          <span className="text-sm text-orange-600">
                            {unsubmitted.workUnsubmitted.map(u => u.name).join('、')}
                          </span>
                          <span className="text-xs text-orange-500 ml-1">
                            ({unsubmitted.workUnsubmitted.length}名)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          )}

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
                  href={reportType === 'sales' ? '/nippo-improved' : '/work-report/projects'}
                  className="group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 rounded-xl transition-transform group-hover:scale-105 ${
                    reportType === 'sales'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-br from-[#0E3091] to-[#1a4ab8]'
                  }`}></div>
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
                    <h3 className="text-xl font-bold mb-2">{reportType === 'work' ? '物件一覧・日報作成' : '新規日報作成'}</h3>
                    <p className={reportType === 'sales' ? 'text-emerald-100 text-sm' : 'text-blue-100 text-sm'}>
                      {reportType === 'work' ? '物件を選んで作業日報を作成' : `新しい${reportTypeName}を作成します`}
                    </p>
                  </div>
                </Link>

                {/* 日報一覧 */}
                <Link
                  href="/nippo"
                  className="group relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-white rounded-xl border-2 border-slate-200 transition-all group-hover:shadow-lg ${
                    reportType === 'sales' ? 'group-hover:border-emerald-300' : 'group-hover:border-[#0E3091]'
                  }`}></div>
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        reportType === 'sales'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-br from-[#0E3091] to-[#1a4ab8]'
                      }`}>
                        <List className="w-6 h-6 text-white" />
                      </div>
                      <FileText className={`w-6 h-6 text-slate-300 transition-colors ${
                        reportType === 'sales' ? 'group-hover:text-emerald-400' : 'group-hover:text-[#0E3091]'
                      }`} />
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
                    <Calendar className={`w-5 h-5 mr-2 ${reportType === 'sales' ? 'text-emerald-600' : 'text-[#0E3091]'}`} />
                    最近の日報
                  </h3>
                  <Link
                    href="/nippo"
                    className={`text-sm font-medium ${
                      reportType === 'sales'
                        ? 'text-emerald-600 hover:text-emerald-700'
                        : 'text-[#0E3091] hover:text-[#0a2470]'
                    }`}
                  >
                    すべて表示 →
                  </Link>
                </div>

                <div className="space-y-3">
                  {recentReports.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">まだ日報が登録されていません</p>
                  ) : (
                    recentReports.map((report, index) => {
                      const isWork = report.type === 'work'
                      const content = (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              reportType === 'sales'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-blue-50 text-[#0E3091]'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className={`font-medium text-gray-900 transition-colors ${
                                !isWork ? (reportType === 'sales' ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0E3091]') : ''
                              }`}>
                                {formatDate(report.date)}の日報
                              </p>
                              {report.destination && (
                                <p className="text-sm text-gray-500">{report.destination}</p>
                              )}
                            </div>
                          </div>
                          {getStatusBadge(report.status)}
                        </div>
                      )

                      return (
                        <motion.div
                          key={report.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          {isWork ? (
                            <Link
                              href={`/work-report/${report.id}`}
                              className={`block p-4 rounded-lg border border-slate-200 transition-all group hover:border-[#0E3091]`}
                            >
                              {content}
                            </Link>
                          ) : (
                            <Link
                              href={`/nippo/${report.id}`}
                              className={`block p-4 rounded-lg border border-slate-200 transition-all group ${
                                reportType === 'sales' ? 'hover:border-emerald-300' : 'hover:border-[#0E3091]'
                              }`}
                            >
                              {content}
                            </Link>
                          )}
                        </motion.div>
                      )
                    })
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
                  <TrendingUp className={`w-5 h-5 mr-2 ${reportType === 'sales' ? 'text-emerald-600' : 'text-[#0E3091]'}`} />
                  今月の実績
                </h3>

                <div className="space-y-6">
                  {/* 作成済み */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">作成済み</span>
                      <span className={`text-2xl font-bold ${reportType === 'sales' ? 'text-emerald-600' : 'text-[#0E3091]'}`}>{stats.thisMonth}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.thisMonth / 30) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-2 rounded-full ${
                          reportType === 'sales'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-[#0E3091] to-[#1a4ab8]'
                        }`}
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
                        animate={{ width: `${stats.thisMonth > 0 ? (stats.pendingApproval / stats.thisMonth) * 100 : 0}%` }}
                        transition={{ duration: 1, delay: 0.7 }}
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full"
                      />
                    </div>
                  </div>

                  {/* 承認済み */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">承認済み</span>
                      <span className={`text-2xl font-bold ${reportType === 'sales' ? 'text-emerald-600' : 'text-[#0E3091]'}`}>{stats.approved}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stats.thisMonth > 0 ? (stats.approved / stats.thisMonth) * 100 : 0}%` }}
                        transition={{ duration: 1, delay: 0.9 }}
                        className={`h-2 rounded-full ${
                          reportType === 'sales'
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-[#0E3091] to-[#1a4ab8]'
                        }`}
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
                    href="/notifications"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <Bell className={`w-5 h-5 text-gray-400 transition-colors ${
                        reportType === 'sales' ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0E3091]'
                      }`} />
                      <span className={`text-gray-700 transition-colors ${
                        reportType === 'sales' ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0E3091]'
                      }`}>
                        通知
                      </span>
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/analytics"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <BarChart3 className={`w-5 h-5 text-gray-400 transition-colors ${
                      reportType === 'sales' ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0E3091]'
                    }`} />
                    <span className={`text-gray-700 transition-colors ${
                      reportType === 'sales' ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0E3091]'
                    }`}>
                      分析ダッシュボード
                    </span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <Settings className={`w-5 h-5 text-gray-400 transition-colors ${
                      reportType === 'sales' ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0E3091]'
                    }`} />
                    <span className={`text-gray-700 transition-colors ${
                      reportType === 'sales' ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0E3091]'
                    }`}>
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
                className={`rounded-xl p-6 shadow-lg text-white ${
                  reportType === 'sales'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                    : 'bg-gradient-to-br from-[#0E3091] to-[#1a4ab8]'
                }`}
              >
                <p className={`text-sm mb-2 ${
                  reportType === 'sales' ? 'text-emerald-100' : 'text-blue-100'
                }`}>累計日報数</p>
                <p className="text-5xl font-bold mb-1">{stats.totalReports}</p>
                <p className={`text-sm ${
                  reportType === 'sales' ? 'text-emerald-100' : 'text-blue-100'
                }`}>件</p>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
