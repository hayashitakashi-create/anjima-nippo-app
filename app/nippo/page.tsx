'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Approval {
  id: string
  approverRole: string
  approverUserId?: string
  approvedAt?: string
  status: string
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

interface User {
  id: string
  name: string
  role: string
  defaultReportType: string
}

export default function NippoListPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState<'sales' | 'work'>('work')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)

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

    // 日報一覧取得
    fetchReports()
  }, [router])

  const fetchReports = () => {
    fetch('/api/nippo/list')
      .then(res => res.json())
      .then(data => {
        if (data && data.reports) {
          setReports(data.reports)
        }
        setLoading(false)
      })
      .catch(error => {
        console.error('日報一覧取得エラー:', error)
        setLoading(false)
      })
  }

  const handleBackButton = () => {
    if (currentUser?.role === 'admin') {
      router.push('/admin/nippo')
    } else {
      router.push('/dashboard')
    }
  }

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

  const handleSettings = () => {
    router.push('/settings')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
  }

  // 並び替え処理
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()

    if (sortOrder === 'asc') {
      return dateA - dateB
    } else {
      return dateB - dateA
    }
  })

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  // 承認ステータスを取得
  const getApprovalStatus = (report: DailyReport) => {
    if (report.approvals.length === 0) {
      return '下書き'
    }

    const latestApproval = report.approvals[0]
    if (latestApproval.status === 'approved') {
      return '承認済み'
    } else if (latestApproval.status === 'rejected') {
      return '却下'
    } else {
      return '承認待ち'
    }
  }

  // 承認ステータスの色を取得
  const getStatusColor = (status: string) => {
    switch (status) {
      case '下書き':
        return 'text-gray-600'
      case '承認待ち':
        return 'text-yellow-600'
      case '承認済み':
        return 'text-green-600'
      case '却下':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  // チェックボックスの全選択/解除
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // 下書きの日報のみ選択可能
      const draftReports = sortedReports.filter(report => getApprovalStatus(report) === '下書き')
      setSelectedReports(new Set(draftReports.map(r => r.id)))
    } else {
      setSelectedReports(new Set())
    }
  }

  // 個別チェックボックスの切り替え
  const handleSelectReport = (reportId: string) => {
    const newSelected = new Set(selectedReports)
    if (newSelected.has(reportId)) {
      newSelected.delete(reportId)
    } else {
      newSelected.add(reportId)
    }
    setSelectedReports(newSelected)
  }

  // 申請処理
  const handleSubmit = async () => {
    if (selectedReports.size === 0) {
      alert('申請する日報を選択してください')
      return
    }

    if (!confirm(`${selectedReports.size}件の日報を申請しますか？`)) {
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/nippo/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportIds: Array.from(selectedReports)
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '申請に失敗しました')
      }

      alert(data.message)
      setSelectedReports(new Set())
      fetchReports() // 一覧を再取得
    } catch (error: any) {
      alert(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const reportTypeName = reportType === 'sales' ? '営業日報' : '作業日報'
  const draftReportsCount = sortedReports.filter(report => getApprovalStatus(report) === '下書き').length
  const allDraftSelected = draftReportsCount > 0 && selectedReports.size === draftReportsCount

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-4">
            {/* 左側：ロゴとタイトル */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">安島工業株式会社</h1>
                <p className="text-sm text-gray-600">日報システム</p>
              </div>
            </div>

            {/* 右側：メニュー */}
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center space-x-1 font-medium"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>TOP画面</span>
              </Link>
              <button
                onClick={handleSettings}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>設定</span>
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>ログアウト</span>
              </button>
              <button
                onClick={handleBackButton}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← 戻る
              </button>
            </div>
          </div>
          {/* 日報タイプ切り替えボタン */}
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            <button
              type="button"
              onClick={() => setReportType('sales')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
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
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                reportType === 'work'
                  ? 'bg-white text-emerald-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              作業日報
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* ボタンエリア */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              href="/nippo-improved"
              className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 font-medium shadow-sm"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新規日報作成
            </Link>

            {/* 並び替えボタン */}
            <button
              onClick={toggleSortOrder}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {sortOrder === 'desc' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                )}
              </svg>
              {sortOrder === 'desc' ? '新しい順' : '古い順'}
            </button>
          </div>

          {/* 申請ボタン */}
          <button
            onClick={handleSubmit}
            disabled={selectedReports.size === 0 || submitting}
            className="inline-flex items-center px-6 py-3 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium shadow-sm"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                申請中...
              </>
            ) : (
              <>
                新規申請 {selectedReports.size > 0 && `(${selectedReports.size})`}
              </>
            )}
          </button>
        </div>

        {/* 日報一覧テーブル */}
        {reports.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
            まだ日報が登録されていません
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="w-12 px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allDraftSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        disabled={draftReportsCount === 0}
                      />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      作成日
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申請日
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      訪問先
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申請ステータス
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      承認者
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      承認日
                    </th>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedReports.map((report) => {
                    const status = getApprovalStatus(report)
                    const isDraft = status === '下書き'
                    const latestApproval = report.approvals[0]
                    const destinations = report.visitRecords
                      .map(v => v.destination)
                      .filter(d => d)
                      .join(', ')

                    return (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedReports.has(report.id)}
                            onChange={() => handleSelectReport(report.id)}
                            disabled={!isDraft}
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-30"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(report.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {latestApproval?.createdAt ? formatDate(latestApproval.createdAt) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {destinations || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {latestApproval?.approver?.name || latestApproval?.approverRole || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {latestApproval?.approvedAt ? formatDate(latestApproval.approvedAt) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link
                            href={`/nippo/${report.id}`}
                            className="inline-flex items-center px-3 py-1 border border-emerald-600 text-emerald-600 text-sm rounded hover:bg-emerald-50"
                          >
                            詳細
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
