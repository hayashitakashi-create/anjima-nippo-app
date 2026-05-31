'use client'

import { motion } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { LeaveRequest, LEAVE_TYPE_COLORS, LEAVE_TYPES, DAY_NAMES } from '../types'
import { useLeaveCalendar } from '../hooks/useLeaveCalendar'

interface Props {
  calendarDate: Date
  leaveRequests: LeaveRequest[]
  onPrevMonth: () => void
  onNextMonth: () => void
}

export function LeaveCalendar({ calendarDate, leaveRequests, onPrevMonth, onNextMonth }: Props) {
  const calendarData = useLeaveCalendar(calendarDate, leaveRequests)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2 text-[#0E3091]" />
            休暇届カレンダー
          </h2>
          <div className="flex items-center space-x-2">
            <button onClick={onPrevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-900 min-w-[100px] text-center">
              {calendarDate.getFullYear()}年{calendarDate.getMonth() + 1}月
            </span>
            <button onClick={onNextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-4">
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((name, i) => (
            <div
              key={name}
              className={`text-center text-xs font-medium py-2 ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {calendarData.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((cell, di) => (
              <div
                key={di}
                className={`relative min-h-[48px] sm:min-h-[56px] p-1 border border-slate-100 ${
                  cell.day === null ? 'bg-gray-50/50' : 'bg-white'
                } ${cell.isToday ? 'ring-2 ring-[#0E3091] ring-inset' : ''}`}
              >
                {cell.day !== null && (
                  <>
                    <span className={`text-xs font-medium ${
                      di === 0 ? 'text-red-500' : di === 6 ? 'text-blue-500' : 'text-gray-700'
                    }`}>
                      {cell.day}
                    </span>
                    {cell.leaves.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {cell.leaves.map(leave => (
                          <span key={leave.id} className={`inline-block text-[10px] sm:text-xs px-1 py-0.5 rounded font-medium leading-tight ${
                            LEAVE_TYPE_COLORS[leave.leaveType] || 'bg-gray-100 text-gray-800'
                          }`}>
                            {leave.applicantName ? `${leave.applicantName} ` : ''}
                            {leave.leaveUnit === 'full' ? leave.leaveType : leave.leaveUnit === 'am' ? '午前' : leave.leaveUnit === 'pm' ? '午後' : '時間'}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-gray-50/50">
        <div className="flex flex-wrap gap-2">
          {LEAVE_TYPES.map(type => (
            <span key={type} className={`text-[10px] sm:text-xs px-2 py-0.5 rounded font-medium ${LEAVE_TYPE_COLORS[type]}`}>
              {type}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
