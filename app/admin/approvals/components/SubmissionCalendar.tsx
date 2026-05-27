'use client'

import { Calendar, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, XCircle } from 'lucide-react'
import { LEAVE_TYPE_COLORS, LEAVE_TYPE_SHORT, SubmissionStatus, ManagedUser } from '../types'

interface CalendarDetail {
  userName: string
  dateKey: string
  types?: { type: string; id: string }[]
  leave?: { id: string; type: string; reason?: string; attachmentName?: string }
}

interface Props {
  submissionStatus: SubmissionStatus
  users: ManagedUser[]
  showCalendar: boolean
  setShowCalendar: (v: boolean) => void
  calendarOffset: number
  setCalendarOffset: (v: number) => void
  calendarNameFilter: string
  setCalendarNameFilter: (v: string) => void
  onSelectDetail: (detail: CalendarDetail) => void
}

export function SubmissionCalendar({
  submissionStatus, users,
  showCalendar, setShowCalendar,
  calendarOffset, setCalendarOffset,
  calendarNameFilter, setCalendarNameFilter,
  onSelectDetail,
}: Props) {
  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">
            提出状況カレンダー
            {submissionStatus.periodStart && submissionStatus.periodEnd && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({new Date(submissionStatus.periodStart).getMonth() + 1}/{new Date(submissionStatus.periodStart).getDate()}〜
                {new Date(submissionStatus.periodEnd).getMonth() + 1}/{new Date(submissionStatus.periodEnd).getDate()})
              </span>
            )}
          </h3>
        </div>
        {showCalendar ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {showCalendar && (
        <>
          {/* 月切り替え + 氏名フィルター */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-b border-gray-200">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setCalendarOffset(calendarOffset - 1) }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                前
              </button>
              <span className="text-sm font-medium text-gray-900 min-w-[100px] text-center">
                {submissionStatus.periodStart && (
                  <>
                    {new Date(submissionStatus.periodStart).getFullYear()}年
                    {new Date(submissionStatus.periodStart).getMonth() + 1}月
                    {calendarOffset === 0 && <span className="ml-1 text-xs text-purple-600">（今期）</span>}
                  </>
                )}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); setCalendarOffset(calendarOffset + 1) }}
                disabled={calendarOffset >= 2}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  calendarOffset >= 2
                    ? 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100'
                }`}
              >
                次
                <ChevronRight className="w-4 h-4" />
              </button>
              {calendarOffset !== 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setCalendarOffset(0) }}
                  className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  今期
                </button>
              )}
            </div>
            {/* ① 氏名フィルター */}
            <select
              value={calendarNameFilter}
              onChange={(e) => setCalendarNameFilter(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">全社員</option>
              {[...users].sort((a, b) => a.name.localeCompare(b.name, 'ja')).map(u => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 overflow-x-auto">
            {(() => {
              const periodDates: Date[] = []
              const start = new Date(submissionStatus.periodStart)
              const end = new Date(submissionStatus.periodEnd)
              for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                periodDates.push(new Date(d))
              }

              // ① 氏名フィルター適用
              const filteredUsers = calendarNameFilter
                ? submissionStatus.users.filter(u => u.name === calendarNameFilter)
                : submissionStatus.users

              return (
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="sticky left-0 bg-white px-2 py-2 text-left font-medium text-gray-700 border-r border-gray-200 z-10">
                        氏名
                        {calendarNameFilter && <span className="ml-1 text-purple-600">({filteredUsers.length}件)</span>}
                      </th>
                      {periodDates.map((date, i) => {
                        const day = date.getDate()
                        const month = date.getMonth() + 1
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6
                        const isFirstOfMonth = day === 1 || i === 0
                        return (
                          <th key={i} className={`px-1 py-2 text-center font-medium ${isWeekend ? 'bg-red-50 text-red-600' : 'text-gray-700'}`}>
                            {isFirstOfMonth && <div className="text-[10px] text-gray-400">{month}月</div>}
                            {day}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="sticky left-0 bg-white px-2 py-2 text-sm font-medium text-gray-900 border-r border-gray-200 whitespace-nowrap z-10">
                          {user.name}
                        </td>
                        {periodDates.map((date, i) => {
                          const dateKey = date.toISOString().split('T')[0]
                          const isSubmitted = submissionStatus.submissionMap[user.id]?.[dateKey]
                          const isApproved = submissionStatus.approvalMap?.[user.id]?.[dateKey] === 'approved'
                          const leaveInfo = submissionStatus.leaveMap?.[user.id]?.[dateKey]
                          const submissionTypes = submissionStatus.submissionTypeMap?.[user.id]?.[dateKey]
                          const cellStatus = submissionStatus.statusMap?.[user.id]?.[dateKey]
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6
                          const todayKey = new Date().toISOString().split('T')[0]
                          const isFuture = dateKey > todayKey
                          const hasContent = leaveInfo || (!isFuture && isSubmitted)

                          // ② 休暇種別の色を取得
                          const leaveColor = leaveInfo ? (LEAVE_TYPE_COLORS[leaveInfo.type] || LEAVE_TYPE_COLORS['その他']) : null
                          const leaveShort = leaveInfo ? (LEAVE_TYPE_SHORT[leaveInfo.type] || '他') : ''

                          // セル背景色（ステータス3値）— 休暇・未来日・週末は対象外
                          let statusBg = ''
                          if (!leaveInfo && !isFuture) {
                            if (cellStatus === 'complete') statusBg = 'bg-emerald-50'
                            else if (cellStatus === 'partial') statusBg = 'bg-amber-100'
                            else if (cellStatus === 'none') statusBg = 'bg-rose-50'
                          }

                          return (
                            <td
                              key={i}
                              className={`px-0.5 py-1.5 text-center ${isWeekend ? 'bg-red-50' : statusBg} ${hasContent ? 'cursor-pointer hover:opacity-70' : ''}`}
                              onClick={() => {
                                // ③ クリックで詳細表示
                                if (hasContent) {
                                  onSelectDetail({
                                    userName: user.name,
                                    dateKey,
                                    types: submissionTypes,
                                    leave: leaveInfo ? { id: leaveInfo.id, type: leaveInfo.type, reason: leaveInfo.reason, attachmentName: leaveInfo.attachmentName } : undefined,
                                  })
                                }
                              }}
                            >
                              {leaveInfo ? (
                                <span
                                  className={`inline-block w-5 h-4 leading-4 rounded text-[9px] font-bold ${leaveColor?.bg} ${leaveColor?.text}`}
                                  title={leaveInfo.type + (leaveInfo.reason ? `（${leaveInfo.reason}）` : '')}
                                >
                                  {leaveShort}
                                </span>
                              ) : isFuture ? (
                                <span className="text-gray-300">-</span>
                              ) : isSubmitted ? (
                                <div className="flex flex-col items-center gap-0.5">
                                  {submissionTypes?.some(e => e.type === 'sales') && (
                                    <span className={`inline-block w-5 h-3.5 leading-[14px] rounded text-[8px] font-bold text-white bg-emerald-500 ${isApproved ? 'ring-1 ring-amber-400' : ''}`}>
                                      営
                                    </span>
                                  )}
                                  {submissionTypes?.some(e => e.type === 'work') && (
                                    <span className={`inline-block w-5 h-3.5 leading-[14px] rounded text-[8px] font-bold text-white bg-blue-500 ${isApproved ? 'ring-1 ring-amber-400' : ''}`}>
                                      作
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 inline" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            })()}
            {/* 凡例 */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-emerald-500 text-white text-[7px] font-bold text-center">営</span>
                営業日報
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-blue-500 text-white text-[7px] font-bold text-center">作</span>
                作業日報
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-emerald-500 text-white text-[7px] font-bold text-center ring-1 ring-amber-400">営</span>
                /
                <span className="inline-block w-4 h-3 leading-3 rounded bg-blue-500 text-white text-[7px] font-bold text-center ring-1 ring-amber-400">作</span>
                承認済み
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-rose-500 text-white text-[7px] font-bold text-center">有</span>
                有給
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-purple-500 text-white text-[7px] font-bold text-center">振</span>
                振替
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-teal-500 text-white text-[7px] font-bold text-center">代</span>
                代休
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-pink-500 text-white text-[7px] font-bold text-center">看</span>
                看護
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-orange-500 text-white text-[7px] font-bold text-center">介</span>
                介護
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-amber-500 text-white text-[7px] font-bold text-center">特</span>
                特別休暇
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-4 h-3 leading-3 rounded bg-gray-500 text-white text-[7px] font-bold text-center">他</span>
                その他
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-rose-50 border border-rose-200 rounded" />
                未提出
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded" />
                要確認
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded" />
                提出済
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
                土日
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
