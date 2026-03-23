'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  Home,
  CalendarDays,
  Plus,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Palmtree,
  CheckCircle,
  CheckCircle2,
  Send,
  Paperclip,
  FileText,
  Download,
  Clock,
  XCircle,
  Printer,
} from 'lucide-react'

interface LeaveRequest {
  id: string
  userId: string
  date: string
  leaveType: string
  leaveUnit: string
  startTime: string | null
  endTime: string | null
  reason: string | null
  attachmentName: string | null
  attachmentType: string | null
  status: string
  createdAt: string
}

const LEAVE_UNITS = [
  { value: 'full', label: '全日' },
  { value: 'am', label: '午前半休' },
  { value: 'pm', label: '午後半休' },
  { value: 'hourly', label: '時間休' },
]

function leaveUnitLabel(unit: string): string {
  return LEAVE_UNITS.find(u => u.value === unit)?.label || '全日'
}

const LEAVE_TYPES = ['有給', '振替', '代休', '看護', '介護', '特別休暇', 'その他']

const LEAVE_TYPE_COLORS: Record<string, string> = {
  '有給': 'bg-blue-100 text-blue-800',
  '振替': 'bg-purple-100 text-purple-800',
  '代休': 'bg-teal-100 text-teal-800',
  '看護': 'bg-pink-100 text-pink-800',
  '介護': 'bg-orange-100 text-orange-800',
  '特別休暇': 'bg-amber-100 text-amber-800',
  'その他': 'bg-gray-100 text-gray-800',
}

function formatYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function LeaveRequestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Form state
  const [formDate, setFormDate] = useState(toDateString(new Date()))
  const [formLeaveType, setFormLeaveType] = useState('有給')
  const [formLeaveUnit, setFormLeaveUnit] = useState('full')
  const [formStartTime, setFormStartTime] = useState('')
  const [formEndTime, setFormEndTime] = useState('')
  const [formReason, setFormReason] = useState('')
  const [formAttachment, setFormAttachment] = useState<{ data: string; name: string; type: string } | null>(null)

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date())

  const currentMonth = formatYearMonth(calendarDate)

  useEffect(() => {
    fetchLeaveRequests()
  }, [currentMonth])

  const fetchLeaveRequests = async () => {
    try {
      const res = await fetch(`/api/leave-requests?month=${currentMonth}`, { credentials: 'include' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setLeaveRequests(data.leaveRequests)
      }
    } catch (err) {
      console.error('休暇届取得エラー:', err)
      setError('休暇届の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            承認待ち
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            承認済み
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            差戻し
          </span>
        )
      default:
        return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: formDate,
          leaveType: formLeaveType,
          leaveUnit: formLeaveUnit,
          startTime: formLeaveUnit === 'hourly' ? formStartTime : undefined,
          endTime: formLeaveUnit === 'hourly' ? formEndTime : undefined,
          reason: formReason || undefined,
          attachmentData: formAttachment?.data,
          attachmentName: formAttachment?.name,
          attachmentType: formAttachment?.type,
        }),
      })

      if (res.status === 401) {
        router.push('/login')
        return
      }

      const data = await res.json()

      if (res.ok) {
        setMessage('休暇届を申請しました（承認待ち）')
        setFormReason('')
        setFormLeaveUnit('full')
        setFormStartTime('')
        setFormEndTime('')
        setFormAttachment(null)
        // Refetch if submitted date is in current calendar month
        const submittedDate = new Date(formDate)
        if (formatYearMonth(submittedDate) === currentMonth) {
          fetchLeaveRequests()
        }
      } else {
        setError(data.error || '登録に失敗しました')
      }
    } catch {
      setError('登録に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/leave-requests/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setLeaveRequests(prev => prev.filter(r => r.id !== deleteTarget.id))
        setMessage('休暇届を削除しました')
        setDeleteTarget(null)
      } else {
        const data = await res.json()
        setError(data.error || '削除に失敗しました')
      }
    } catch {
      setError('削除に失敗しました')
    } finally {
      setDeleting(false)
    }
  }

  // Build calendar data
  const calendarData = useMemo(() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay() // 0=Sun

    // Leave dates set for quick lookup (multiple per day possible)
    const leaveDates = new Map<string, LeaveRequest[]>()
    leaveRequests.forEach(lr => {
      const d = new Date(lr.date)
      const key = toDateString(d)
      const existing = leaveDates.get(key) || []
      existing.push(lr)
      leaveDates.set(key, existing)
    })

    const weeks: Array<Array<{ day: number | null; dateStr: string; leaves: LeaveRequest[]; isToday: boolean }>> = []
    let currentWeek: Array<{ day: number | null; dateStr: string; leaves: LeaveRequest[]; isToday: boolean }> = []

    // Fill blanks before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ day: null, dateStr: '', leaves: [], isToday: false })
    }

    const today = toDateString(new Date())

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      currentWeek.push({
        day: d,
        dateStr,
        leaves: leaveDates.get(dateStr) || [],
        isToday: dateStr === today,
      })
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    // Fill blanks after last day
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ day: null, dateStr: '', leaves: [], isToday: false })
      }
      weeks.push(currentWeek)
    }

    return weeks
  }, [calendarDate, leaveRequests])

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
  }

  const dayNames = ['日', '月', '火', '水', '木', '金', '土']

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}月${date.getDate()}日(${dayNames[date.getDay()]})`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-600"
        >
          読み込み中...
        </motion.p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#0E3091] flex items-center justify-center">
                <Palmtree className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">休暇届</h1>
                <p className="text-xs text-gray-500 hidden sm:block">休暇の申請・管理</p>
              </div>
            </div>
            <Link href="/dashboard" className="p-2 text-[#0E3091] hover:bg-blue-50 rounded-lg transition-colors" title="TOP画面">
              <Home className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6">
        {/* Messages */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>{message}</span>
              </div>
              <button onClick={() => setMessage('')} className="text-green-500 hover:text-green-700">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center"
            >
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-[#0E3091] to-[#1a4ab8]">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              新規休暇届
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  休暇日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900"
                />
              </div>

              {/* Leave type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  休暇種別 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formLeaveType}
                  onChange={(e) => setFormLeaveType(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900 bg-white"
                >
                  {LEAVE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Leave unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                休暇単位 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {LEAVE_UNITS.map(unit => (
                  <button
                    key={unit.value}
                    type="button"
                    onClick={() => setFormLeaveUnit(unit.value)}
                    className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-all ${
                      formLeaveUnit === unit.value
                        ? 'bg-[#0E3091] text-white border-[#0E3091]'
                        : 'bg-white text-gray-700 border-slate-300 hover:border-[#0E3091] hover:text-[#0E3091]'
                    }`}
                  >
                    {unit.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time inputs for hourly leave */}
            {formLeaveUnit === 'hourly' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    開始時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    終了時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900"
                  />
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                理由 <span className="text-gray-400 text-xs">(任意)</span>
              </label>
              <textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                rows={2}
                placeholder="休暇の理由を入力（任意）"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-transparent text-gray-900 resize-none"
              />
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                添付ファイル <span className="text-gray-400 text-xs">(任意 / 看護・介護休暇申出書など)</span>
              </label>
              {formAttachment ? (
                <div className="flex items-center gap-3 px-3 py-2.5 border border-slate-300 rounded-lg bg-blue-50">
                  <FileText className="w-5 h-5 text-[#0E3091] flex-shrink-0" />
                  <span className="text-sm text-gray-900 truncate flex-1">{formAttachment.name}</span>
                  <button
                    type="button"
                    onClick={() => setFormAttachment(null)}
                    className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">ファイルを選択（PDF・画像 / 5MB以下）</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      if (file.size > 5 * 1024 * 1024) {
                        setError('ファイルサイズは5MB以下にしてください')
                        return
                      }
                      const reader = new FileReader()
                      reader.onload = () => {
                        const base64 = (reader.result as string).split(',')[1]
                        setFormAttachment({ data: base64, name: file.name, type: file.type })
                      }
                      reader.readAsDataURL(file)
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-5 py-2.5 bg-[#0E3091] text-white font-medium rounded-lg hover:bg-[#0a2470] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                {submitting ? '申請中...' : '休暇届を申請'}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Calendar */}
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
                <button
                  onClick={prevMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm font-bold text-gray-900 min-w-[100px] text-center">
                  {calendarDate.getFullYear()}年{calendarDate.getMonth() + 1}月
                </span>
                <button
                  onClick={nextMonth}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-2 sm:p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {dayNames.map((name, i) => (
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

            {/* Calendar grid */}
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

          {/* Legend */}
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

        {/* Leave request list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-gray-900">
              {calendarDate.getMonth() + 1}月の休暇届 ({leaveRequests.length}件)
            </h2>
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
                            {statusBadge(request.status)}
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
                            onClick={() => setDeleteTarget(request)}
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
      </main>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
            >
              <div className="px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">休暇届の削除</h3>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-900">
                    {formatDisplayDate(deleteTarget.date)}
                  </span>
                  の{deleteTarget.leaveType}を削除しますか？
                </p>
                <p className="text-xs text-red-600 mt-2">この操作は取り消せません</p>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  {deleting ? '削除中...' : '削除する'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
