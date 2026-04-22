'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiGet, ApiError } from '@/lib/api'

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
  familyName: string | null
  familyBirthdate: string | null
  familyRelationship: string | null
  adoptionDate: string | null
  specialAdoptionDate: string | null
  careReason: string | null
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
        const d = await apiGet<any>(`/api/leave-requests/${params.id}/detail`)
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
        @page {
          size: A4 portrait;
          margin: 0;
        }
        @media print {
          html, body { margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
          .print-page {
            width: 210mm;
            height: 297mm;
            padding: 12mm 15mm;
            margin: 0;
            box-shadow: none !important;
            page-break-after: avoid;
            page-break-inside: avoid;
            overflow: hidden;
          }
        }
        @media screen {
          .print-page {
            width: 210mm;
            height: 297mm;
            padding: 12mm 15mm;
            margin: 20px auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            background: white;
            overflow: hidden;
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

      {/* 印刷用ページ (A4縦1枚固定) */}
      <div className="print-page font-sans text-gray-900 flex flex-col">
        {/* タイトル */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold tracking-widest border-b-2 border-gray-900 inline-block pb-1 px-6">
            休 暇 届
          </h1>
        </div>

        {/* 申請日 */}
        <div className="text-right mb-3 text-xs">
          申請日: {formatCreatedDate(data.createdAt)}
        </div>

        {/* 宛先・申請者（横並び） */}
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm">安島工業株式会社 御中</p>
          <div className="text-right">
            <p className="text-[11px] text-gray-700">申請者</p>
            <p className="text-base font-bold leading-tight">{data.applicantName || data.userName}</p>
            {data.applicantName && data.applicantName !== data.userName && (
              <p className="text-[10px] text-gray-700">（入力者: {data.userName}）</p>
            )}
            {data.userPosition && (
              <p className="text-[10px] text-gray-700">{data.userPosition}</p>
            )}
          </div>
        </div>

        {/* 休暇内容テーブル */}
        <table className="w-full border-collapse text-xs mb-3">
          <tbody>
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium w-1/4">
                休暇日
              </th>
              <td className="border border-gray-400 px-3 py-1.5">
                {formatDateWithDay(data.date)}
              </td>
            </tr>
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium">
                休暇種別
              </th>
              <td className="border border-gray-400 px-3 py-1.5">
                {data.leaveType}
              </td>
            </tr>
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium">
                休暇単位
              </th>
              <td className="border border-gray-400 px-3 py-1.5">
                {leaveUnitLabel(data.leaveUnit)}
                {data.leaveUnit === 'hourly' && data.startTime && data.endTime && (
                  <span className="ml-2">（{data.startTime} 〜 {data.endTime}）</span>
                )}
              </td>
            </tr>
            {(data.leaveType === '看護' || data.leaveType === '介護') && (
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium align-top">
                  対象家族
                </th>
                <td className="border border-gray-400 px-3 py-1.5">
                  <div className="space-y-1">
                    {data.familyName && <div>氏名：{data.familyName}</div>}
                    {data.familyBirthdate && <div>生年月日：{data.familyBirthdate}</div>}
                    {data.familyRelationship && <div>続柄：{data.familyRelationship}</div>}
                    {data.leaveType === '看護' && data.adoptionDate && (
                      <div>縁組成立年月日：{data.adoptionDate}</div>
                    )}
                    {data.leaveType === '看護' && data.specialAdoptionDate && (
                      <div>手続完了年月日：{data.specialAdoptionDate}</div>
                    )}
                    {!data.familyName && !data.familyBirthdate && !data.familyRelationship && !data.adoptionDate && !data.specialAdoptionDate && (
                      <span className="text-gray-400">（未記入）</span>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {!(data.leaveType === '看護' || data.leaveType === '介護') && (
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium align-top">
                  理由
                </th>
                <td className="border border-gray-400 px-3 py-1.5 h-20 whitespace-pre-wrap align-top">
                  {data.reason || ''}
                </td>
              </tr>
            )}
            <tr>
              <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium">
                承認状況
              </th>
              <td className="border border-gray-400 px-3 py-1.5">
                {statusLabel(data.status)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 申出理由 (看護・介護) */}
        {(data.leaveType === '看護' || data.leaveType === '介護') && (
          <table className="w-full border-collapse mb-3 text-[11px]">
            <tbody>
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-3 py-1.5 text-left font-medium align-top w-[120px]">
                  申出理由
                </th>
                <td className="border border-gray-400 px-3 py-1.5 h-16 whitespace-pre-wrap align-top">
                  {data.careReason || ''}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {/* 看護・介護の場合の注意書き */}
        {(data.leaveType === '看護' || data.leaveType === '介護') && (
          <div className="text-[10px] text-gray-700 leading-relaxed space-y-1 mb-3">
            <p>（注１）当日、電話などで申し出た場合は、出勤後すみやかに提出してください。3については、複数の日を一括して申し出る場合には、申し出る日をすべて記入してください。</p>
            <p>（注２）子の看護等休暇の場合、取得できる日数は、小学校第３学年修了までの子が１人の場合は年５日、２人以上の場合は年１０日となります。時間単位で取得できます。</p>
            <p className="pl-[3.5em] -indent-[3.5em]">介護休暇の場合、取得できる日数は、対象となる家族が１人の場合は年５日、２人以上の場合は年１０日となります。時間単位で取得できます。</p>
          </div>
        )}

        {/* 承認欄 (ページ下部に配置) */}
        <div className="mt-auto">
          <table className="ml-auto border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-400 bg-gray-100 px-6 py-1.5 text-[10px] font-medium">承認者</th>
                <th className="border border-gray-400 bg-gray-100 px-6 py-1.5 text-[10px] font-medium">申請者</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-400 w-24 h-16"></td>
                <td className="border border-gray-400 w-24 h-16"></td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 text-center text-[10px] text-gray-700">
            安島工業株式会社
          </div>
        </div>
      </div>
    </>
  )
}
