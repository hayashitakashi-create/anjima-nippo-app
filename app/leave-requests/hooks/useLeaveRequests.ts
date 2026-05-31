'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet, apiDelete, ApiError } from '@/lib/api'
import { LeaveRequest } from '../types'
import { formatYearMonth } from '../utils'

export function useLeaveRequests(initialScope: 'mine' | 'others' = 'mine') {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [scope, setScope] = useState<'mine' | 'others'>(initialScope)
  const [error, setError] = useState('')

  const currentMonth = formatYearMonth(calendarDate)

  const fetchLeaveRequests = useCallback(async () => {
    try {
      const data = await apiGet<{ leaveRequests: LeaveRequest[] }>(
        `/api/leave-requests?month=${currentMonth}&scope=${scope}`
      )
      setLeaveRequests(data.leaveRequests)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login')
      } else {
        console.error('休暇届取得エラー:', err)
        setError('休暇届の取得に失敗しました')
      }
    } finally {
      setLoading(false)
    }
  }, [currentMonth, scope, router])

  useEffect(() => {
    fetchLeaveRequests()
  }, [fetchLeaveRequests])

  const removeLocal = (id: string) => {
    setLeaveRequests(prev => prev.filter(r => r.id !== id))
  }

  const deleteRequest = async (id: string): Promise<boolean> => {
    try {
      await apiDelete(`/api/leave-requests/${id}`)
      removeLocal(id)
      return true
    } catch {
      setError('削除に失敗しました')
      return false
    }
  }

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
  }

  return {
    loading,
    leaveRequests,
    calendarDate,
    currentMonth,
    scope,
    setScope,
    error,
    setError,
    fetchLeaveRequests,
    deleteRequest,
    prevMonth,
    nextMonth,
  }
}
