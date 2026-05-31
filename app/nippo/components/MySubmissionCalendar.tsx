'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiGet } from '@/lib/api'

interface MyCalendar {
  userName: string
  periodStart: string
  periodEnd: string
  salesDates: string[]
  workDates: string[]
  leaveMap: Record<string, string>
}

const LEAVE_SHORT: Record<string, string> = {
  '有給': '有', '振替': '振', '代休': '代', '看護': '看', '介護': '介', '特別休暇': '特', 'その他': '他',
}

// 一般ユーザー向け: 自分の提出状況カレンダー (田邊様5/28 FB⑤)
// 未提出は空欄(バツにしない)
export function MySubmissionCalendar() {
  const [open, setOpen] = useState(false)
  const [offset, setOffset] = useState(0)
  const [data, setData] = useState<MyCalendar | null>(null)

  useEffect(() => {
    if (!open) return
    apiGet<MyCalendar>(`/api/nippo/my-calendar?offset=${offset}`)
      .then(setData)
      .catch(() => setData(null))
  }, [open, offset])

  const dates: Date[] = []
  if (data) {
    const s = new Date(data.periodStart)
    const e = new Date(data.periodEnd)
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) dates.push(new Date(d))
  }
  const todayKey = new Date().toISOString().split('T')[0]

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#0E3091]" />
          <h3 className="font-semibold text-gray-900">自分の提出状況カレンダー</h3>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {open && (
        <>
          <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-t border-b border-gray-200">
            <button onClick={() => setOffset(offset - 1)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4" />前
            </button>
            <span className="text-sm font-medium text-gray-900 min-w-[100px] text-center">
              {data?.periodStart && (
                <>{new Date(data.periodStart).getFullYear()}年{new Date(data.periodStart).getMonth() + 1}月
                  {offset === 0 && <span className="ml-1 text-xs text-[#0E3091]">（今期）</span>}</>
              )}
            </span>
            <button onClick={() => setOffset(offset + 1)} disabled={offset >= 2}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg ${offset >= 2 ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100'}`}>
              次<ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 overflow-x-auto">
            {!data ? (
              <p className="text-sm text-gray-400 py-4 text-center">読み込み中...</p>
            ) : (
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {dates.map((date, i) => {
                    const key = date.toISOString().split('T')[0]
                    const dow = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    const sales = data.salesDates.includes(key)
                    const work = data.workDates.includes(key)
                    const leave = data.leaveMap[key]
                    const isFuture = key > todayKey
                    return (
                      <tr key={i} className={`border-b border-gray-100 ${isWeekend ? 'bg-red-50' : ''}`}>
                        <td className={`px-2 py-1.5 whitespace-nowrap ${isWeekend ? 'text-red-600' : 'text-gray-700'}`}>
                          {date.getMonth() + 1}/{date.getDate()}（{dow}）
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex items-center gap-1">
                            {leave && <span className="inline-block px-1.5 h-4 leading-4 rounded text-[9px] font-bold bg-rose-500 text-white">{LEAVE_SHORT[leave] || '他'}</span>}
                            {sales && <span className="inline-block px-1.5 h-4 leading-4 rounded text-[9px] font-bold bg-emerald-500 text-white">営業</span>}
                            {work && <span className="inline-block px-1.5 h-4 leading-4 rounded text-[9px] font-bold bg-blue-500 text-white">作業</span>}
                            {!leave && !sales && !work && !isFuture && <span className="text-gray-300 text-[11px]">未提出</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
