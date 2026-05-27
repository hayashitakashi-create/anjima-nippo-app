'use client'

import { useState } from 'react'

interface CalendarDetail {
  userName: string
  dateKey: string
  types?: { type: string; id: string }[]
  leave?: { id: string; type: string; reason?: string; attachmentName?: string }
}

export function useCalendarState() {
  const [showCalendar, setShowCalendar] = useState(false)
  const [calendarOffset, setCalendarOffset] = useState(0) // 0: 今期, -1: 前期, -2: 前々期...
  const [calendarNameFilter, setCalendarNameFilter] = useState('')
  const [calendarDetail, setCalendarDetail] = useState<CalendarDetail | null>(null)

  return {
    showCalendar, setShowCalendar,
    calendarOffset, setCalendarOffset,
    calendarNameFilter, setCalendarNameFilter,
    calendarDetail, setCalendarDetail,
  }
}
