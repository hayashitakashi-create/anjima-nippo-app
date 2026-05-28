'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { CalendarDays, Palmtree, Paperclip, Printer, Trash2 } from 'lucide-react'
import { LeaveRequest, LEAVE_TYPE_COLORS } from '../types'
import { leaveUnitLabel, formatDisplayDate } from '../utils'
import { StatusBadge } from './StatusBadge'

interface Props {
  month: number
  leaveRequests: LeaveRequest[]
  isAdmin: boolean
  scope: 'mine' | 'others'
  setScope: (s: 'mine' | 'others') => void
  onDeleteClick: (request: LeaveRequest) => void
}

export function LeaveRequestList({ month, leaveRequests, isAdmin, scope, setScope, onDeleteClick }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-bold text-gray-900">
          {month}月の休暇届 ({leaveRequests.length}件)
        </h2>
        {isAdmin && (
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setScope('mine')}
              className={`px-3 py-1.5 font-medium transition-colors ${scope === 'mine' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-slate-50'}`}
            >
              自分の休暇届
            </button>
            <button
              type="button"
              onClick={() => setScope('others')}
              className={`px-3 py-1.5 font-medium transition-colors ${scope === 'others' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-slate-50'}`}
            >
              自分以外の休暇届
            </button>
          </div>
        )}
      </div>

      {leaveRequests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <Palmtree className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>この月の休暇届はありません</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          <AnimatePresence>
            {leaveRequests.map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0E3091] flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <p className="font-medium text-gray-900">
                          {formatDisplayDate(request.date)}
                        </p>
                        {(request.userName || request.applicantName) && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {request.userName || request.applicantName}
                          </span>
                        )}
                        {request.enteredByName && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            代理入力: {request.enteredByName}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          LEAVE_TYPE_COLORS[request.leaveType] || 'bg-gray-100 text-gray-800'
                        }`}>
                          {request.leaveType}
                        </span>
                        {request.leaveUnit && request.leaveUnit !== 'full' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {leaveUnitLabel(request.leaveUnit)}
                            {request.leaveUnit === 'hourly' && request.startTime && request.endTime && (
                              <span className="ml-1">{request.startTime}〜{request.endTime}</span>
                            )}
                          </span>
                        )}
                        <StatusBadge status={request.status} />
                      </div>
                      {request.reason && (
                        <p className="text-sm text-gray-500 mt-0.5">{request.reason}</p>
                      )}
                      {request.attachmentName && (
                        <a
                          href={`/api/leave-requests/${request.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-1 text-xs text-[#0E3091] hover:underline"
                        >
                          <Paperclip className="w-3 h-3" />
                          {request.attachmentName}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <Link
                      href={`/leave-requests/${request.id}/print`}
                      target="_blank"
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                      title="印刷"
                    >
                      <Printer className="w-4 h-4" />
                    </Link>
                    {(request.status === 'pending' || request.status === 'rejected') && (
                      <button
                        onClick={() => onDeleteClick(request)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )
}
