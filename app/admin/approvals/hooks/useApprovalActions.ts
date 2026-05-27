'use client'

import { useState } from 'react'
import { apiPut } from '@/lib/api'
import type { DailyReport } from '../types'

type RejectModalState =
  | null
  | { kind: 'individual'; approvalId: string; reportId: string }
  | { kind: 'all'; reportId: string }
  | { kind: 'bulk'; reportIds: string[] }

interface Args {
  pendingReportIds: string[]
  setReports: React.Dispatch<React.SetStateAction<DailyReport[]>>
  setProcessing: (v: string | null) => void
  setMessage: (v: string) => void
  setError: (v: string) => void
  fetchReports: () => Promise<void>
}

export function useApprovalActions({
  pendingReportIds, setReports, setProcessing, setMessage, setError, fetchReports,
}: Args) {
  const [selectedReportIds, setSelectedReportIds] = useState<Set<string>>(new Set())
  const [rejectModal, setRejectModal] = useState<RejectModalState>(null)
  const [rejectComment, setRejectComment] = useState('')

  const handleSelectAll = () => {
    if (selectedReportIds.size === pendingReportIds.length) {
      setSelectedReportIds(new Set())
    } else {
      setSelectedReportIds(new Set(pendingReportIds))
    }
  }

  const handleToggleSelect = (reportId: string) => {
    const newSet = new Set(selectedReportIds)
    if (newSet.has(reportId)) {
      newSet.delete(reportId)
    } else {
      newSet.add(reportId)
    }
    setSelectedReportIds(newSet)
  }

  const handleBulkApprove = async () => {
    if (selectedReportIds.size === 0) {
      alert('承認する日報を選択してください')
      return
    }
    if (!confirm(`選択した${selectedReportIds.size}件の日報を承認しますか？`)) return

    setProcessing('bulk')
    setMessage('')
    setError('')
    try {
      const data = await apiPut<any>('/api/admin/approvals', {
        reportIds: Array.from(selectedReportIds),
        action: 'bulk_approve'
      })
      setMessage(data.message)
      setSelectedReportIds(new Set())
      fetchReports()
    } catch (err: any) {
      setError(err.message || '承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  const submitReject = async () => {
    if (!rejectModal) return
    const comment = rejectComment.trim()
    if (!comment) {
      alert('差戻しの理由（コメント）を入力してください')
      return
    }
    const processingKey = rejectModal.kind === 'individual' ? rejectModal.approvalId : rejectModal.kind === 'all' ? rejectModal.reportId : 'bulk'
    setProcessing(processingKey)
    setMessage('')
    setError('')
    try {
      if (rejectModal.kind === 'individual') {
        const data = await apiPut<any>('/api/admin/approvals', {
          approvalId: rejectModal.approvalId, action: 'reject', rejectComment: comment,
        })
        setMessage(data.message)
        const reportId = rejectModal.reportId
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, approvals: r.approvals.map(a => a.id === rejectModal.approvalId ? data.approval : a) } : r))
      } else if (rejectModal.kind === 'all') {
        const data = await apiPut<any>('/api/admin/approvals', {
          reportId: rejectModal.reportId, action: 'reject_all', rejectComment: comment,
        })
        setMessage(data.message)
        setReports(prev => prev.map(r => r.id === rejectModal.reportId && data.report ? { ...r, approvals: data.report.approvals } : r))
      } else {
        const data = await apiPut<any>('/api/admin/approvals', {
          reportIds: rejectModal.reportIds, action: 'bulk_reject', rejectComment: comment,
        })
        setMessage(data.message)
        setSelectedReportIds(new Set())
        fetchReports()
      }
      setRejectModal(null)
      setRejectComment('')
    } catch (err: any) {
      setError(err.message || '差戻しに失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  const handleBulkReject = async () => {
    if (selectedReportIds.size === 0) {
      alert('差戻しする日報を選択してください')
      return
    }
    setRejectComment('')
    setRejectModal({ kind: 'bulk', reportIds: Array.from(selectedReportIds) })
  }

  const handleApproveAll = async (reportId: string) => {
    setProcessing(reportId)
    setMessage('')
    setError('')
    try {
      const data = await apiPut<any>('/api/admin/approvals', { reportId, action: 'approve_all' })
      setMessage(data.message)
      setReports(prev => prev.map(r => {
        if (r.id === reportId && data.report) {
          return { ...r, approvals: data.report.approvals }
        }
        return r
      }))
    } catch (err: any) {
      setError(err.message || '承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  const handleRejectAll = async (reportId: string) => {
    setRejectComment('')
    setRejectModal({ kind: 'all', reportId })
  }

  const handleApprove = async (approvalId: string, reportId: string) => {
    setProcessing(approvalId)
    setMessage('')
    setError('')
    try {
      const data = await apiPut<any>('/api/admin/approvals', { approvalId, action: 'approve' })
      setMessage(data.message)
      setReports(prev => prev.map(r => {
        if (r.id === reportId) {
          return {
            ...r,
            approvals: r.approvals.map(a =>
              a.id === approvalId ? data.approval : a
            ),
          }
        }
        return r
      }))
    } catch (err: any) {
      setError(err.message || '承認に失敗しました')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (approvalId: string, reportId: string) => {
    setRejectComment('')
    setRejectModal({ kind: 'individual', approvalId, reportId })
  }

  return {
    selectedReportIds, setSelectedReportIds,
    rejectModal, setRejectModal,
    rejectComment, setRejectComment,
    handleSelectAll, handleToggleSelect,
    handleBulkApprove, handleBulkReject,
    handleApproveAll, handleRejectAll,
    handleApprove, handleReject,
    submitReject,
  }
}
