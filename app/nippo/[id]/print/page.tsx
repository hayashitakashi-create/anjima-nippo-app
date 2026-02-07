'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Approval {
  id: string
  approverRole: string
  status: string
  approverUserId?: string
  approvedAt?: string
  approver?: { name: string; position?: string }
}

interface VisitRecord {
  destination: string
  contactPerson?: string
  startTime?: string
  endTime?: string
  content?: string
  expense?: number
  order: number
}

interface ReportData {
  id: string
  date: string
  specialNotes?: string
  user: { name: string; position?: string }
  visitRecords: VisitRecord[]
  approvals: Approval[]
}

const ROLE_LABELS: Record<string, string> = {
  president: '社長',
  executive_vice_president: '専務',
  managing_director: '常務',
  department_manager: '部長',
  社長: '社長',
  専務: '専務',
  常務: '常務',
  部長: '部長',
}

export default function NippoPrintPage() {
  const router = useRouter()
  const params = useParams()
  const reportId = params.id as string

  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/nippo/${reportId}`)
      .then(res => {
        if (!res.ok) throw new Error('取得失敗')
        return res.json()
      })
      .then(data => {
        setReport(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('日報取得エラー:', err)
        alert('日報の取得に失敗しました')
        router.push('/nippo')
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

  // 訪問記録を6行に埋める（印刷用）
  const paddedVisitRecords: (VisitRecord | null)[] = [...report.visitRecords]
  while (paddedVisitRecords.length < 6) {
    paddedVisitRecords.push(null)
  }

  // 経費合計
  const totalExpense = report.visitRecords.reduce((sum, r) => sum + (r.expense || 0), 0)

  return (
    <>
      {/* 印刷用スタイル */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 landscape; margin: 8mm; }
          .print-page { page-break-after: always; }
        }
        @media screen {
          body { background: #f3f4f6; }
        }
        .print-table { border-collapse: collapse; width: 100%; }
        .print-table th, .print-table td {
          border: 1px solid #333;
          padding: 4px 6px;
          font-size: 11px;
          vertical-align: middle;
        }
        .print-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
          white-space: nowrap;
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
            <span className="text-sm text-gray-600">営業日報 印刷プレビュー</span>
          </div>
          <button
            onClick={handlePrint}
            className="px-6 py-2 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
          >
            印刷 / PDF保存
          </button>
        </div>
      </div>

      {/* 印刷用コンテンツ */}
      <div className="max-w-[1100px] mx-auto p-4 no-print:p-8">
        <div className="bg-white p-6 shadow-sm print:shadow-none print:p-0">
          {/* タイトル */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold tracking-widest">営 業 日 報</h1>
          </div>

          {/* 基本情報テーブル */}
          <table className="print-table mb-1" style={{ width: '100%' }}>
            <tbody>
              <tr>
                <th style={{ width: '80px' }}>日付</th>
                <td style={{ width: '220px' }}>{formattedDate}</td>
                <th style={{ width: '80px' }}>氏名</th>
                <td style={{ width: '180px' }}>
                  {report.user.name}
                  {report.user.position && <span className="ml-1 text-xs">({report.user.position})</span>}
                </td>
                <th style={{ width: '60px' }}>承認</th>
                {/* 承認欄 */}
                {['president', 'executive_vice_president', 'managing_director', 'department_manager', '社長', '専務', '常務', '部長'].filter(role =>
                  report.approvals.some(a => a.approverRole === role)
                ).length > 0 ? (
                  report.approvals.map(approval => (
                    <td key={approval.id} className="text-center" style={{ width: '80px' }}>
                      <div className="text-[10px] text-gray-500">{ROLE_LABELS[approval.approverRole] || approval.approverRole}</div>
                      <div className="text-xs font-medium">
                        {approval.status === 'approved' ? '✓' : approval.status === 'rejected' ? '×' : ''}
                      </div>
                    </td>
                  ))
                ) : (
                  <td colSpan={4} className="text-center text-xs text-gray-400">-</td>
                )}
              </tr>
            </tbody>
          </table>

          {/* 訪問記録テーブル */}
          <table className="print-table mb-1">
            <thead>
              <tr>
                <th style={{ width: '30px' }}>No</th>
                <th style={{ width: '180px' }}>訪問先</th>
                <th style={{ width: '120px' }}>面接者ご氏名</th>
                <th style={{ width: '60px' }}>開始</th>
                <th style={{ width: '60px' }}>終了</th>
                <th>営業内容</th>
                <th style={{ width: '80px' }}>支出経費</th>
              </tr>
            </thead>
            <tbody>
              {paddedVisitRecords.map((record, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td>{record?.destination || ''}</td>
                  <td>{record?.contactPerson || ''}</td>
                  <td className="text-center">{record?.startTime || ''}</td>
                  <td className="text-center">{record?.endTime || ''}</td>
                  <td style={{ minHeight: '28px', whiteSpace: 'pre-wrap', fontSize: '10px' }}>
                    {record?.content || ''}
                  </td>
                  <td className="text-right">
                    {record?.expense ? `¥${record.expense.toLocaleString()}` : ''}
                  </td>
                </tr>
              ))}
              {/* 合計行 */}
              <tr>
                <td colSpan={6} className="text-right font-bold">経費合計</td>
                <td className="text-right font-bold">
                  {totalExpense > 0 ? `¥${totalExpense.toLocaleString()}` : ''}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 特記事項 */}
          <table className="print-table">
            <tbody>
              <tr>
                <th style={{ width: '120px' }}>連絡事項・備考</th>
                <td style={{ minHeight: '50px', whiteSpace: 'pre-wrap', fontSize: '11px', padding: '6px 8px' }}>
                  {report.specialNotes || ''}
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </>
  )
}
