'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface LeaveDetail {
  id: string
  userId: string
  userName: string
  userPosition: string
  applicantName: string
  date: string
  leaveType: string
  leaveUnit: string
  startTime: string | null
  endTime: string | null
  reason: string | null
  status: string
  createdAt: string
}

function leaveUnitLabel(unit: string): string {
  switch (unit) {
    case 'am': return '午前半休'
    case 'pm': return '午後半休'
    case 'hourly': return '時間休'
    default: return '全日'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'approved': return '承認済み'
    case 'rejected': return '差戻し'
    case 'pending': return '承認待ち'
    default: return status
  }
}

export default function LeaveRequestPrintPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<LeaveDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/leave-requests/${params.id}/detail`, { credentials: 'include' })
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) {
          const d = await res.json()
          setError(d.error || '取得に失敗しました')
          return
        }
        const d = await res.json()
        setData(d.leaveRequest)
      } catch {
        setError('取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id, router])

  useEffect(() => {
    if (data) {
      const displayName = data.applicantName || data.userName
      document.title = `休暇届_${displayName}_${formatDate(data.date)}`
    }
    return () => { document.title = '安島工業株式会社 日報システム' }
  }, [data])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  const formatDateWithDay = (dateStr: string) => {
    const d = new Date(dateStr)
    const days = ['日', '月', '火', '水', '木', '金', '土']
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
  }

  const formatCreatedDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'データが見つかりません'}</p>
          <button onClick={() => router.push('/leave-requests')} className="text-blue-600 hover:underline">戻る</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm;
            margin: 0;
            box-shadow: none !important;
          }
        }
        @media screen {
          .print-page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm 20mm;
            margin: 20px auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            background: white;
          }
        }
      `}</style>

      {/* 操作ボタン（印刷時非表示） */}
      <div className="no-print fixed top-4 right-4 z-50 flex items-center space-x-2">
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-[#0E3091] text-white font-medium rounded-lg hover:bg-[#0a2470] transition-colors shadow-lg"
        >
          PDF出力 / 印刷
        </button>
        <button
          onClick={() => router.push('/leave-requests')}
          className="px-4 py-2.5 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-lg border"
        >
          戻る
        </button>
      </div>

      {/* 印刷用ページ */}
      <div className="print-page font-sans text-gray-900">
        {/* タイトル */}
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold tracking-widest border-b-2 border-gray-900 inline-block pb-2 px-8">
            休 暇 届
          </h1>
        </div>

        {/* 申請日 */}
        <div className="text-right mb-8 text-sm">
          <p>申請日: {formatCreatedDate(data.createdAt)}</p>
        </div>

        {/* 宛先 */}
        <div className="mb-8">
          <p className="text-base">安島工業株式会社 御中</p>
        </div>

        {/* 申請者情報 */}
        <div className="text-right mb-10">
          <p className="text-sm text-gray-700">申請者</p>
          <p className="text-lg font-bold">{data.applicantName || data.userName}</p>
          {data.applicantName && data.applicantName !== data.userName && (
            <p className="text-sm text-gray-700">（入力者: {data.userName}）</p>
          )}
          {data.userPosition && (
            <p className="text-sm text-gray-700">{data.userPosition}</p>
          )}
        </div>

        {/* 休暇内容テーブル */}
        <table className="w-full border-collapse mb-8">
          <tbody>
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-4 py-3 text-left text-sm font-medium w-1/4">
                休暇日
              </th>
              <td className="border border-gray-400 px-4 py-3 text-sm">
                {formatDateWithDay(data.date)}
              </td>
            </tr>
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-4 py-3 text-left text-sm font-medium">
                休暇種別
              </th>
              <td className="border border-gray-400 px-4 py-3 text-sm">
                {data.leaveType}
              </td>
            </tr>
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-4 py-3 text-left text-sm font-medium">
                休暇単位
              </th>
              <td className="border border-gray-400 px-4 py-3 text-sm">
                {leaveUnitLabel(data.leaveUnit)}
                {data.leaveUnit === 'hourly' && data.startTime && data.endTime && (
                  <span className="ml-2">（{data.startTime} 〜 {data.endTime}）</span>
                )}
              </td>
            </tr>
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-4 py-3 text-left text-sm font-medium align-top">
                理由
              </th>
              <td className="border border-gray-400 px-4 py-3 text-sm min-h-[80px] whitespace-pre-wrap">
                {data.reason || ''}
              </td>
            </tr>
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-4 py-3 text-left text-sm font-medium">
                承認状況
              </th>
              <td className="border border-gray-400 px-4 py-3 text-sm">
                {statusLabel(data.status)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 承認欄 */}
        <div className="mt-16">
          <table className="ml-auto border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-8 py-2 text-xs font-medium">承認者</th>
                <th className="border border-gray-400 bg-gray-100 px-8 py-2 text-xs font-medium">申請者</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 w-28 h-20"></td>
                <td className="border border-gray-400 w-28 h-20"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* フッター */}
        <div className="mt-16 text-center text-xs text-gray-700">
          安島工業株式会社
        </div>
      </div>
    </>
  )
}
