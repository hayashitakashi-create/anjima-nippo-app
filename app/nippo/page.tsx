'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Settings,
  LogOut,
  Home,
  MapPin,
  Clock,
  Building2,
  Shield,
  Search,
  X,
  Filter,
  Calendar,
} from 'lucide-react'

interface Approval {
  id: string
  approverRole: string
  approverUserId?: string
  approvedAt?: string
  status: string
  createdAt: string
  updatedAt: string
  approver?: {
    name: string
    position?: string
  }
}

interface VisitRecord {
  id: string
  destination: string
  contactPerson?: string
  startTime?: string
  endTime?: string
  content?: string
  expense?: number
}

interface DailyReport {
  id: string
  date: string
  specialNotes?: string
  user: {
    name: string
    position?: string
  }
  visitRecords: VisitRecord[]
  approvals: Approval[]
}

interface WorkReport {
  id: string
  date: string
  userId: string
  projectRefId?: string
  projectName: string
  projectType?: string
  projectId?: string
  weather?: string
  contactNotes?: string
  workerRecords: Array<{
    id: string
    name: string
    startTime?: string
    endTime?: string
    workType?: string
    details?: string
  }>
  materialRecords: Array<{
    id: string
    name: string
  }>
  subcontractorRecords: Array<{
    id: string
    name: string
    workContent?: string
  }>
}

interface User {
  id: string
  name: string
  role: string
  defaultReportType: string
}

// 曜日名
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

export default function NippoListPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [salesReports, setSalesReports] = useState<DailyReport[]>([])
  const [workReports, setWorkReports] = useState<WorkReport[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<'sales' | 'work'>('work')

  // 検索状態
  const [viewMode, setViewMode] = useState<'calendar' | 'search'>('calendar')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchStartDate, setSearchStartDate] = useState('')
  const [searchEndDate, setSearchEndDate] = useState('')
  const [searchResults, setSearchResults] = useState<{
    sales: DailyReport[]
    work: WorkReport[]
  }>({ sales: [], work: [] })
  const [searching, setSearching] = useState(false)

  // カレンダー状態
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // タッチスワイプ用
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

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
      })
      .catch(error => {
        console.error('ユーザー取得エラー:', error)
        router.push('/login')
      })

    // 営業日報取得
    fetch('/api/nippo/list')
      .then(res => res.json())
      .then(data => {
        if (data && data.reports) {
          setSalesReports(data.reports)
        }
      })
      .catch(error => {
        console.error('営業日報取得エラー:', error)
      })
      .finally(() => setLoading(false))
  }, [router])

  // 作業日報取得（ユーザーIDが必要）
  useEffect(() => {
    if (!currentUser) return
    fetch(`/api/work-report?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWorkReports(data)
        }
      })
      .catch(error => {
        console.error('作業日報取得エラー:', error)
      })
  }, [currentUser])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (error) {
      console.error('ログアウトエラー:', error)
    }
  }

  // 検索実行
  const handleSearch = async () => {
    if (!currentUser) return
    setSearching(true)

    try {
      const params = new URLSearchParams()
      if (searchKeyword) params.set('keyword', searchKeyword)
      if (searchStartDate) params.set('startDate', searchStartDate)
      if (searchEndDate) params.set('endDate', searchEndDate)

      // 営業日報検索
      const salesRes = await fetch(`/api/nippo/list?${params.toString()}`)
      const salesData = await salesRes.json()

      // 作業日報検索
      params.set('userId', currentUser.id)
      const workRes = await fetch(`/api/work-report?${params.toString()}`)
      const workData = await workRes.json()

      setSearchResults({
        sales: salesData?.reports || [],
        work: Array.isArray(workData) ? workData : [],
      })
      setViewMode('search')
    } catch (error) {
      console.error('検索エラー:', error)
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchKeyword('')
    setSearchStartDate('')
    setSearchEndDate('')
    setSearchResults({ sales: [], work: [] })
    setViewMode('calendar')
  }

  // カレンダーの日付配列を生成
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // 月の最初の日と最後の日
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // カレンダーの開始日（前月の日曜日から）
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    // カレンダーの終了日（次月の土曜日まで）
    const endDate = new Date(lastDay)
    if (lastDay.getDay() < 6) {
      endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))
    }

    const days: Date[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [currentMonth])

  // 日付文字列（YYYY-MM-DD）を取得するヘルパー
  const getDateKey = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // 日報がある日付のセットを作成
  const salesReportDates = useMemo(() => {
    const dates = new Set<string>()
    salesReports.forEach(report => {
      const d = new Date(report.date)
      dates.add(getDateKey(d))
    })
    return dates
  }, [salesReports])

  const workReportDates = useMemo(() => {
    const dates = new Set<string>()
    workReports.forEach(report => {
      const d = new Date(report.date)
      dates.add(getDateKey(d))
    })
    return dates
  }, [workReports])

  // 選択された日付の日報を取得
  const selectedDateReports = useMemo(() => {
    const key = getDateKey(selectedDate)
    if (reportType === 'sales') {
      return salesReports.filter(report => {
        const d = new Date(report.date)
        return getDateKey(d) === key
      })
    }
    return []
  }, [selectedDate, salesReports, reportType])

  const selectedDateWorkReports = useMemo(() => {
    const key = getDateKey(selectedDate)
    if (reportType === 'work') {
      return workReports.filter(report => {
        const d = new Date(report.date)
        return getDateKey(d) === key
      })
    }
    return []
  }, [selectedDate, workReports, reportType])

  // 月の移動
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(new Date())
  }

  // タッチスワイプハンドラ
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (Math.abs(distance) < minSwipeDistance) return

    if (distance > 0) {
      goToNextMonth()
    } else {
      goToPreviousMonth()
    }
  }

  // 今日かどうか判定
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  // 選択中の日付かどうか判定
  const isSelected = (date: Date): boolean => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
  }

  // 当月かどうか判定
  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth()
  }

  // 承認ステータス
  const getApprovalStatus = (report: DailyReport) => {
    if (report.approvals.length === 0) return '下書き'
    const latest = report.approvals[0]
    if (latest.status === 'approved') return '承認済み'
    if (latest.status === 'rejected') return '却下'
    return '承認待ち'
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case '承認済み':
        return 'bg-emerald-100 text-emerald-700'
      case '承認待ち':
        return 'bg-amber-100 text-amber-700'
      case '却下':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    const dayOfWeek = WEEKDAYS[date.getDay()]
    return `${month}月${day}日（${dayOfWeek}）`
  }

  // テーマカラー
  const themeBg = reportType === 'sales' ? 'bg-emerald-500' : 'bg-[#0E3091]'
  const themeBgLight = reportType === 'sales' ? 'bg-emerald-50' : 'bg-blue-50'
  const themeText = reportType === 'sales' ? 'text-emerald-600' : 'text-[#0E3091]'
  const themeBorder = reportType === 'sales' ? 'border-emerald-300' : 'border-[#0E3091]'
  const themeHover = reportType === 'sales' ? 'hover:bg-emerald-50' : 'hover:bg-blue-50'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  const reportDates = reportType === 'sales' ? salesReportDates : workReportDates

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${themeBg}`}>
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">安島工業株式会社</h1>
                <p className="text-xs sm:text-sm text-gray-600">日報一覧</p>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-3">
              <Link
                href="/dashboard"
                className={`p-2 ${themeText} ${themeHover} rounded-lg transition-colors`}
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

          {/* 日報タイプ切り替え */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1 w-fit">
            <button
              type="button"
              onClick={() => setReportType('sales')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                reportType === 'sales'
                  ? 'bg-white text-emerald-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              営業日報
            </button>
            <button
              type="button"
              onClick={() => setReportType('work')}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                reportType === 'work'
                  ? 'bg-white text-[#0E3091] shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              作業日報
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {/* 検索バー */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch() }}
            className="space-y-3"
          >
            {/* キーワード検索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={reportType === 'sales' ? '訪問先、営業内容、面接者で検索...' : '案件名、工種、作業者名で検索...'}
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {(searchKeyword || searchStartDate || searchEndDate) && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 期間指定 */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="date"
                  value={searchStartDate}
                  onChange={(e) => setSearchStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="開始日"
                />
              </div>
              <span className="text-gray-400 text-sm">〜</span>
              <div className="flex-1">
                <input
                  type="date"
                  value={searchEndDate}
                  onChange={(e) => setSearchEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="終了日"
                />
              </div>
              <button
                type="submit"
                disabled={searching || (!searchKeyword && !searchStartDate && !searchEndDate)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed ${
                  reportType === 'sales' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#0E3091] hover:bg-[#0a2470]'
                }`}
              >
                {searching ? '...' : '検索'}
              </button>
            </div>
          </form>

          {/* 検索モード時: カレンダーに戻るボタン */}
          {viewMode === 'search' && (
            <button
              onClick={clearSearch}
              className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <Calendar className="w-4 h-4" />
              カレンダー表示に戻る
            </button>
          )}
        </div>

        {/* 検索結果表示 */}
        {viewMode === 'search' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1">
                <Search className="w-4 h-4" />
                検索結果:
                {reportType === 'sales'
                  ? ` ${searchResults.sales.length}件`
                  : ` ${searchResults.work.length}件`
                }
              </h3>
            </div>

            <div className="space-y-3">
              {reportType === 'sales' ? (
                searchResults.sales.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">条件に一致する営業日報はありません</p>
                  </div>
                ) : (
                  searchResults.sales.map((report) => {
                    const status = getApprovalStatus(report)
                    const destinations = report.visitRecords
                      .map(v => v.destination)
                      .filter(Boolean)

                    return (
                      <Link
                        key={report.id}
                        href={`/nippo/${report.id}`}
                        className={`block bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:${themeBorder}`}
                      >
                        <div className={`h-1 ${themeBg}`} />
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-base font-bold text-gray-900">
                                {formatDateDisplay(report.date)}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{report.user.name}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusStyle(status)}`}>
                              {status}
                            </span>
                          </div>

                          {destinations.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                              {destinations.map((dest, i) => {
                                const visit = report.visitRecords[i]
                                return (
                                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span>{dest}</span>
                                    {visit?.startTime && visit?.endTime && (
                                      <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                                        <Clock className="w-3 h-3" />
                                        {visit.startTime}〜{visit.endTime}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {report.specialNotes && (
                            <p className="mt-2 text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded-lg p-2">
                              {report.specialNotes}
                            </p>
                          )}
                        </div>
                      </Link>
                    )
                  })
                )
              ) : (
                searchResults.work.length === 0 ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">条件に一致する作業日報はありません</p>
                  </div>
                ) : (
                  searchResults.work.map((report) => (
                    <Link
                      key={report.id}
                      href={`/work-report/${report.id}`}
                      className="block bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:border-[#0E3091]"
                    >
                      <div className={`h-1 ${themeBg}`} />
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-base font-bold text-gray-900">
                              {report.projectName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDateDisplay(report.date)}
                              {report.weather && ` / ${report.weather}`}
                            </p>
                          </div>
                          {report.projectType && (
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-50 text-[#0E3091]">
                              {report.projectType}
                            </span>
                          )}
                        </div>

                        {report.workerRecords.length > 0 && (
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1.5">
                              {report.workerRecords.slice(0, 5).map((worker) => (
                                <span
                                  key={worker.id}
                                  className="inline-flex items-center text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5"
                                >
                                  {worker.name}
                                </span>
                              ))}
                              {report.workerRecords.length > 5 && (
                                <span className="text-xs text-gray-400">
                                  +{report.workerRecords.length - 5}名
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {report.contactNotes && (
                          <p className="mt-2 text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded-lg p-2">
                            {report.contactNotes}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                          {report.workerRecords.length > 0 && (
                            <span>作業者 {report.workerRecords.length}名</span>
                          )}
                          {report.materialRecords.length > 0 && (
                            <span>材料 {report.materialRecords.length}件</span>
                          )}
                          {report.subcontractorRecords.length > 0 && (
                            <span>外注 {report.subcontractorRecords.length}件</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )
              )}
            </div>
          </div>
        )}

        {/* カレンダー（検索モードでない時のみ表示） */}
        {viewMode === 'calendar' && (
        <>
        {/* カレンダー */}
        <div
          className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* カレンダーヘッダー：月ナビゲーション */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
              </h2>
              <button
                onClick={goToToday}
                className={`text-xs px-2 py-1 rounded-md ${themeBgLight} ${themeText} font-medium`}
              >
                今日
              </button>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map((day, i) => (
              <div
                key={day}
                className={`text-center text-xs font-medium py-2 ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダー本体 */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, index) => {
              const dateKey = getDateKey(date)
              const hasReport = reportDates.has(dateKey)
              const dayOfWeek = date.getDay()
              const today = isToday(date)
              const selected = isSelected(date)
              const inMonth = isCurrentMonth(date)

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(new Date(date))}
                  className={`relative flex flex-col items-center justify-center py-2.5 sm:py-3 transition-colors ${
                    !inMonth ? 'opacity-30' : ''
                  } ${selected ? '' : 'hover:bg-gray-50'}`}
                >
                  <span
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all ${
                      selected
                        ? `${themeBg} text-white`
                        : today
                        ? `ring-2 ${reportType === 'sales' ? 'ring-emerald-400' : 'ring-[#0E3091]'} ${themeText} font-bold`
                        : dayOfWeek === 0
                        ? 'text-red-500'
                        : dayOfWeek === 6
                        ? 'text-blue-500'
                        : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {/* 日報があるとドット表示 */}
                  {hasReport && (
                    <span
                      className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                        selected ? 'bg-white' : reportType === 'sales' ? 'bg-emerald-400' : 'bg-[#0E3091]'
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 選択日の表示 */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700">
            {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日（{WEEKDAYS[selectedDate.getDay()]}）の{reportType === 'sales' ? '営業日報' : '作業日報'}
          </h3>

          {/* 新規作成ボタン */}
          <Link
            href={reportType === 'sales' ? '/nippo-improved' : '/work-report/projects'}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg ${themeBg} hover:opacity-90 transition-opacity`}
          >
            <Plus className="w-3.5 h-3.5" />
            新規作成
          </Link>
        </div>

        {/* 日報リスト */}
        <div className="space-y-3">
          {reportType === 'sales' ? (
            selectedDateReports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">この日の営業日報はありません</p>
              </div>
            ) : (
              selectedDateReports.map((report) => {
                const status = getApprovalStatus(report)
                const destinations = report.visitRecords
                  .map(v => v.destination)
                  .filter(Boolean)

                return (
                  <Link
                    key={report.id}
                    href={`/nippo/${report.id}`}
                    className={`block bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:${themeBorder}`}
                  >
                    <div className={`h-1 ${themeBg}`} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-base font-bold text-gray-900">
                            {formatDateDisplay(report.date)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{report.user.name}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusStyle(status)}`}>
                          {status}
                        </span>
                      </div>

                      {destinations.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {destinations.map((dest, i) => {
                            const visit = report.visitRecords[i]
                            return (
                              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{dest}</span>
                                {visit?.startTime && visit?.endTime && (
                                  <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                                    <Clock className="w-3 h-3" />
                                    {visit.startTime}〜{visit.endTime}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {report.specialNotes && (
                        <p className="mt-2 text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded-lg p-2">
                          {report.specialNotes}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })
            )
          ) : (
            /* 作業日報の表示 */
            selectedDateWorkReports.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">この日の作業日報はありません</p>
              </div>
            ) : (
              selectedDateWorkReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/work-report/${report.id}`}
                  className="block bg-white rounded-xl border border-gray-200 overflow-hidden transition-all hover:shadow-md hover:border-[#0E3091]"
                >
                  <div className={`h-1 ${themeBg}`} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="text-base font-bold text-gray-900">
                          {report.projectName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDateDisplay(report.date)}
                          {report.weather && ` / ${report.weather}`}
                        </p>
                      </div>
                      {report.projectType && (
                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-50 text-[#0E3091]">
                          {report.projectType}
                        </span>
                      )}
                    </div>

                    {/* 作業者情報 */}
                    {report.workerRecords.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1.5">
                          {report.workerRecords.slice(0, 5).map((worker) => (
                            <span
                              key={worker.id}
                              className="inline-flex items-center text-xs bg-gray-100 text-gray-700 rounded-full px-2 py-0.5"
                            >
                              {worker.name}
                            </span>
                          ))}
                          {report.workerRecords.length > 5 && (
                            <span className="text-xs text-gray-400">
                              +{report.workerRecords.length - 5}名
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 連絡事項 */}
                    {report.contactNotes && (
                      <p className="mt-2 text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded-lg p-2">
                        {report.contactNotes}
                      </p>
                    )}

                    {/* フッター情報 */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                      {report.workerRecords.length > 0 && (
                        <span>作業者 {report.workerRecords.length}名</span>
                      )}
                      {report.materialRecords.length > 0 && (
                        <span>材料 {report.materialRecords.length}件</span>
                      )}
                      {report.subcontractorRecords.length > 0 && (
                        <span>外注 {report.subcontractorRecords.length}件</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )
          )}
        </div>
        </>
        )}
      </main>
    </div>
  )
}
