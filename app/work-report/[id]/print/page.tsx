'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface WorkerRecord {
  name: string
  startTime?: string
  endTime?: string
  workHours?: number
  workType?: string
  details?: string
  dailyHours?: number
  totalHours?: number
  remainHours?: number
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

interface ReportData {
  id: string
  date: string
  userId: string
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

export default function WorkReportPrintPage() {
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string

  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // ユーザー名取得
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) setUserName(data.user.name)
      })
      .catch(() => {})

    // 作業日報データ取得
    fetch(`/api/work-report/${reportId}`)
      .then(res => {
        if (!res.ok) throw new Error('取得失敗')
        return res.json()
      })
      .then(data => {
        setReport(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('作業日報取得エラー:', err)
        alert('作業日報の取得に失敗しました')
        router.push('/dashboard')
      })
  }, [reportId, router])

  const handlePrint = () => {
    window.print()
  }

  if (loading || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  const dateObj = new Date(report.date)
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const formattedDate = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日（${weekdays[dateObj.getDay()]}）`

  // パディング: 作業者11行、材料5行、外注5行
  const paddedWorkers: (WorkerRecord | null)[] = [...report.workerRecords]
  while (paddedWorkers.length < 11) paddedWorkers.push(null)

  const paddedMaterials: (MaterialRecord | null)[] = [...report.materialRecords]
  while (paddedMaterials.length < 5) paddedMaterials.push(null)

  const paddedSubs: (SubcontractorRecord | null)[] = [...report.subcontractorRecords]
  while (paddedSubs.length < 3) paddedSubs.push(null)

  // 金額合計
  const totalAmount = report.materialRecords.reduce(
    (sum, r) => sum + ((r.quantity || 0) * (r.unitPrice || 0)),
    0
  )

  return (
    <>
      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 landscape; margin: 6mm; }
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
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              戻る
            </button>
            <span className="text-sm text-gray-600">作業日報 印刷プレビュー</span>
          </div>
          <button
            onClick={handlePrint}
            className="px-6 py-2 text-sm font-bold text-white bg-[#0E3091] rounded-lg hover:bg-[#0a2470] shadow-sm"
          >
            印刷 / PDF保存
          </button>
        </div>
      </div>

      {/* 印刷用コンテンツ */}
      <div className="max-w-[1100px] mx-auto p-4 no-print:p-8">
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
                <td style={{ width: '160px' }}>{formattedDate}</td>
                <th style={{ width: '55px' }}>天候</th>
                <td style={{ width: '80px' }}>{report.weather || ''}</td>
                <th style={{ width: '55px' }}>氏名</th>
                <td style={{ width: '120px' }}>{userName}</td>
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
    </>
  )
}
