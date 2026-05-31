'use client'

import { useMemo } from 'react'
import { LeaveRequest } from '../types'
import { toDateString } from '../utils'

export interface CalendarCell {
  day: number | null
  dateStr: string
  leaves: LeaveRequest[]
  isToday: boolean
}

export function useLeaveCalendar(calendarDate: Date, leaveRequests: LeaveRequest[]): CalendarCell[][] {
  return useMemo(() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay()

    const leaveDates = new Map<string, LeaveRequest[]>()
    leaveRequests.forEach(lr => {
      const d = new Date(lr.date)
      const key = toDateString(d)
      const existing = leaveDates.get(key) || []
      existing.push(lr)
      leaveDates.set(key, existing)
    })

    const weeks: CalendarCell[][] = []
    let currentWeek: CalendarCell[] = []

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

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ day: null, dateStr: '', leaves: [], isToday: false })
      }
      weeks.push(currentWeek)
    }

    return weeks
  }, [calendarDate, leaveRequests])
}
