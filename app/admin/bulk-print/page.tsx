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

interface WorkReport {
  id: string
  date: string
  userId: string
  userName: string
  projectName: string
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
  workerRecords: WorkerRecord[]
  materialRecords: MaterialRecord[]
  subcontractorRecords: SubcontractorRecord[]
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

  // 検索結果
  const [reports, setReports] = useState<WorkReport[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // 印刷モード
  const [isPrintMode, setIsPrintMode] = useState(false)

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
          if (data.user.role !== 'admin') {
            router.push('/dashboard')
            return
          }
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

    try {
      const params = new URLSearchParams()
      if (selectedUserId) params.append('userId', selectedUserId)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const res = await fetch(`/api/admin/bulk-reports?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports)
      } else {
        console.error('日報取得エラー')
        setReports([])
      }
    } catch (err) {
      console.error('日報検索エラー:', err)
      setReports([])
    } finally {
      setSearching(false)
    }
  }

  const handlePrint = () => {
    if (reports.length === 0) {
      alert('印刷する日報がありません')
      return
    }
    setIsPrintMode(true)
    setTimeout(() => {
      window.print()
    }, 100)
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

  // 印刷モードの場合
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
          @media screen {
            body { background: #f3f4f6; }
          }
          .print-table { border-collapse: collapse; width: 100%; }
          .print-table th, .print-table td {
            border: 1px solid #333;
            padding: 2px 4px;
            font-size: 10px;
            vertical-align: middle;
          }
          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
            white-space: nowrap;
          }
          .section-title {
            font-size: 11px;
            font-weight: bold;
            margin: 6px 0 2px 0;
          }
        `}</style>

        {/* 印刷操作バー */}
        <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPrintMode(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                戻る
              </button>
              <span className="text-sm text-gray-600">一括印刷プレビュー（{reports.length}件）</span>
            </div>
            <button
              onClick={() => window.print()}
              className="px-6 py-2 text-sm font-bold text-white bg-[#0E3091] rounded-lg hover:bg-[#0a2470] shadow-sm"
            >
              印刷 / PDF保存
            </button>
          </div>
        </div>

        {/* 印刷用コンテンツ */}
        {reports.map((report, reportIndex) => {
          const paddedWorkers: (WorkerRecord | null)[] = [...report.workerRecords]
          while (paddedWorkers.length < 11) paddedWorkers.push(null)

          const paddedMaterials: (MaterialRecord | null)[] = [...report.materialRecords]
          while (paddedMaterials.length < 5) paddedMaterials.push(null)

          const paddedSubs: (SubcontractorRecord | null)[] = [...report.subcontractorRecords]
          while (paddedSubs.length < 3) paddedSubs.push(null)

          const totalAmount = report.materialRecords.reduce(
            (sum, r) => sum + ((r.quantity || 0) * (r.unitPrice || 0)),
            0
          )

          return (
            <div
              key={report.id}
              className={`max-w-[1100px] mx-auto p-4 ${reportIndex > 0 ? 'page-break' : ''}`}
            >
              <div className="bg-white p-5 shadow-sm print:shadow-none print:p-0">
                {/* タイトル */}
                <div className="text-center mb-3">
                  <h1 className="text-lg font-bold tracking-widest">作 業 日 報</h1>
                </div>

                {/* 基本情報 */}
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

                {/* 作業者記録 */}
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
                    {paddedWorkers.map((record, index) => (
                      <tr key={index}>
                        <td className="text-center">{index + 1}</td>
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

                {/* 使用材料・外注先を横並び */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* 使用材料 */}
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
                        {paddedMaterials.map((record, index) => {
                          const amt = (record?.quantity || 0) * (record?.unitPrice || 0)
                          return (
                            <tr key={index}>
                              <td className="text-center">{index + 1}</td>
                              <td>{record?.name || ''}</td>
                              <td className="text-center">
                                {record?.volume || ''}{record?.volumeUnit || ''}
                              </td>
                              <td className="text-right">{record?.quantity || ''}</td>
                              <td className="text-right">
                                {record?.unitPrice ? `¥${record.unitPrice.toLocaleString()}` : ''}
                              </td>
                              <td className="text-right">
                                {amt > 0 ? `¥${amt.toLocaleString()}` : ''}
                              </td>
                              <td>{record?.subcontractor || ''}</td>
                            </tr>
                          )
                        })}
                        <tr>
                          <td colSpan={5} className="text-right font-bold">合計</td>
                          <td className="text-right font-bold">
                            {totalAmount > 0 ? `¥${totalAmount.toLocaleString()}` : ''}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* 外注先 + 遠隔地情報 */}
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
                        {paddedSubs.map((record, index) => (
                          <tr key={index}>
                            <td className="text-center">{index + 1}</td>
                            <td>{record?.name || ''}</td>
                            <td className="text-center">{record?.workerCount || ''}</td>
                            <td>{record?.workContent || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* 遠隔地・交通誘導警備員 */}
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
                          <td>
                            {report.trafficGuardStart || '-'} 〜 {report.trafficGuardEnd || '-'}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 連絡事項 */}
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

                {/* フッター */}
                <div className="mt-2 text-right text-xs text-gray-500">
                  安島工業株式会社
                </div>
              </div>
            </div>
          )
        })}
      </>
    )
  }

  // 通常モード（検索画面）
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
        {/* 戻るリンク */}
        <div className="mb-4">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* ユーザー選択 */}
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

              {/* 開始日 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  開始日
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* 終了日 */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  終了日
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSearch}
                disabled={searching}
                className="inline-flex items-center px-6 py-2 text-sm font-bold bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 transition-colors"
              >
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
              </h2>
              {reports.length > 0 && (
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-4 py-2 text-sm font-bold bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] transition-colors"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  一括印刷
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
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">工事名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">工事種別</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">天候</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reports.map(report => (
                      <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{formatDate(report.date)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{report.userName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">{report.projectName}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{report.projectType || '-'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{report.weather || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
