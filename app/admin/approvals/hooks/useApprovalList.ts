'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { adminApi, apiGet } from '@/lib/api'
import { DailyReport, ManagedUser, SubmissionStatus, getReportStatus } from '../types'

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected'

interface FilterArgs {
  selectedUserId: string
  selectedRole: string
  selectedReportType: '' | 'sales' | 'work'
  startDate: string
  endDate: string
}

export function useApprovalList(currentUser: any, calendarOffset: number, filterArgs: FilterArgs) {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('pending')
  const [expandedReport, setExpandedReport] = useState<string | null>(null)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiGet<any>(`/api/admin/approvals?status=${filter}&includeSubmissionStatus=true&calendarOffset=${calendarOffset}`)
      setReports(data.reports)
      if (data.submissionStatus) {
        setSubmissionStatus(data.submissionStatus)
      }
    } catch (err) {
      console.error('承認一覧取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }, [filter, calendarOffset])

  const fetchCalendarData = useCallback(async () => {
    try {
      const data = await apiGet<any>(`/api/admin/approvals?status=all&includeSubmissionStatus=true&calendarOffset=${calendarOffset}`)
      if (data.submissionStatus) {
        setSubmissionStatus(data.submissionStatus)
      }
    } catch (err) {
      console.error('カレンダーデータ取得エラー:', err)
    }
  }, [calendarOffset])

  // ユーザー一覧取得
  useEffect(() => {
    if (!currentUser) return
    adminApi.fetchUsers()
      .then(data => {
        if (data.users) {
          setUsers((data.users as any[]).filter((u: ManagedUser) => u.isActive !== false))
        }
      })
      .catch(err => console.error('ユーザー一覧取得エラー:', err))
  }, [currentUser])

  // 日報一覧取得
  useEffect(() => {
    if (!currentUser) return
    fetchReports()
  }, [currentUser, filter])

  // カレンダー期間変更時に再取得
  useEffect(() => {
    if (!currentUser) return
    fetchCalendarData()
  }, [currentUser, calendarOffset])

  // 絞り込み適用
  const filteredReports = useMemo(() => {
    let result = reports
    if (filterArgs.selectedUserId) {
      result = result.filter(r => r.user.id === filterArgs.selectedUserId)
    }
    if (filterArgs.selectedRole) {
      result = result.filter(r => r.user.position === filterArgs.selectedRole)
    }
    if (filterArgs.startDate) {
      const start = new Date(filterArgs.startDate)
      start.setHours(0, 0, 0, 0)
      result = result.filter(r => new Date(r.date) >= start)
    }
    if (filterArgs.endDate) {
      const end = new Date(filterArgs.endDate)
      end.setHours(23, 59, 59, 999)
      result = result.filter(r => new Date(r.date) <= end)
    }
    if (filterArgs.selectedReportType) {
      result = result.filter(r => ((r as any).reportType || 'sales') === filterArgs.selectedReportType)
    }
    return result
  }, [reports, filterArgs.selectedUserId, filterArgs.selectedRole, filterArgs.startDate, filterArgs.endDate, filterArgs.selectedReportType])

  const pendingReports = useMemo(() => {
    return filteredReports.filter(r => {
      const status = getReportStatus(r.approvals)
      return status === 'pending' || status === 'partial'
    })
  }, [filteredReports])

  const stats = useMemo(() => {
    const all = filteredReports.length
    const pending = filteredReports.filter(r => getReportStatus(r.approvals) === 'pending' || getReportStatus(r.approvals) === 'partial').length
    const approved = filteredReports.filter(r => getReportStatus(r.approvals) === 'approved').length
    const rejected = filteredReports.filter(r => getReportStatus(r.approvals) === 'rejected').length
    return { all, pending, approved, rejected }
  }, [filteredReports])

  const positionOptions = useMemo(() => {
    const positions = new Set<string>()
    users.forEach(u => {
      if (u.position) positions.add(u.position)
    })
    return Array.from(positions).sort()
  }, [users])

  return {
    reports, setReports,
    users,
    loading,
    filter, setFilter,
    expandedReport, setExpandedReport,
    processing, setProcessing,
    message, setMessage,
    error, setError,
    submissionStatus,
    fetchReports,
    filteredReports, pendingReports, stats, positionOptions,
  }
}
