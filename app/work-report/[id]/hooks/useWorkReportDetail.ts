'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiGet, apiPut, apiDelete } from '@/lib/api'
import { calculateManHoursFromTime } from '../../new/types'
import type { WorkerRecord, MaterialRecord, SubcontractorRecord } from '../types'

const calculateManHours = calculateManHoursFromTime

interface CurrentUser {
  id: string
  name?: string
}

export function useWorkReportDetail(reportId: string, currentUser: CurrentUser | null) {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 基本情報
  const [date, setDate] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [projectId, setProjectId] = useState('')
  const [projectRefId, setProjectRefId] = useState<string | null>(null)
  const [weather, setWeather] = useState('')
  const [createdUserName, setCreatedUserName] = useState('')
  const [reportOwner, setReportOwner] = useState<{ id: string; name: string; position?: string | null } | null>(null)
  const [enteredBy, setEnteredBy] = useState<{ id: string; name: string; position?: string | null } | null>(null)

  // 作業者記録
  const [workerRecords, setWorkerRecords] = useState<WorkerRecord[]>([])

  // 使用材料記録
  const [materialRecords, setMaterialRecords] = useState<MaterialRecord[]>([])

  // 外注先記録
  const [subcontractorRecords, setSubcontractorRecords] = useState<SubcontractorRecord[]>([])

  // 遠隔地・交通誘導警備員情報
  const [remoteDepartureTime, setRemoteDepartureTime] = useState('')
  const [remoteArrivalTime, setRemoteArrivalTime] = useState('')
  const [remoteDepartureTime2, setRemoteDepartureTime2] = useState('')
  const [remoteArrivalTime2, setRemoteArrivalTime2] = useState('')
  const [trafficGuardCount, setTrafficGuardCount] = useState(0)
  const [trafficGuardStart, setTrafficGuardStart] = useState('')
  const [trafficGuardEnd, setTrafficGuardEnd] = useState('')

  // 連絡事項
  const [contactNotes, setContactNotes] = useState('')

  // 承認状況
  const [approvals, setApprovals] = useState<any[]>([])

  // 承認/差戻し操作
  const [approvalProcessing, setApprovalProcessing] = useState<string | null>(null)
  const [rejectModalApprovalId, setRejectModalApprovalId] = useState<string | null>(null)
  const [rejectComment, setRejectComment] = useState('')

  const handleApprove = async (approvalId: string) => {
    setApprovalProcessing(approvalId)
    try {
      const data = await apiPut<any>('/api/admin/approvals', { approvalId, action: 'approve' })
      setApprovals(prev => prev.map(a => a.id === approvalId ? data.approval : a))
    } catch (err: any) {
      alert(err.message || '承認に失敗しました')
    } finally {
      setApprovalProcessing(null)
    }
  }

  const submitReject = async () => {
    if (!rejectModalApprovalId) return
    const comment = rejectComment.trim()
    if (!comment) {
      alert('差戻しの理由（コメント）を入力してください')
      return
    }
    setApprovalProcessing(rejectModalApprovalId)
    try {
      const data = await apiPut<any>('/api/admin/approvals', {
        approvalId: rejectModalApprovalId, action: 'reject', rejectComment: comment,
      })
      setApprovals(prev => prev.map(a => a.id === rejectModalApprovalId ? data.approval : a))
      setRejectModalApprovalId(null)
      setRejectComment('')
    } catch (err: any) {
      alert(err.message || '差戻しに失敗しました')
    } finally {
      setApprovalProcessing(null)
    }
  }

  // 初期データ読み込み: 作業日報データ
  useEffect(() => {
    // 作業日報データ取得
    apiGet<any>(`/api/work-report/${reportId}`)
      .then(data => {
        const dateObj = new Date(data.date)
        setDate(dateObj.toISOString().split('T')[0])
        if (data.user) setReportOwner({ id: data.userId, name: data.user.name, position: data.user.position })
        if (data.enteredBy) setEnteredBy(data.enteredBy)
        setProjectName(data.projectName || '')
        setProjectType(data.projectType || '')
        setProjectId(data.projectId || '')
        setProjectRefId(data.projectRefId || null)
        setWeather(data.weather || '')
        setContactNotes(data.contactNotes || '')
        setRemoteDepartureTime(data.remoteDepartureTime || '')
        setRemoteArrivalTime(data.remoteArrivalTime || '')
        setRemoteDepartureTime2(data.remoteDepartureTime2 || '')
        setRemoteArrivalTime2(data.remoteArrivalTime2 || '')
        setTrafficGuardCount(data.trafficGuardCount || 0)
        setTrafficGuardStart(data.trafficGuardStart || '')
        setTrafficGuardEnd(data.trafficGuardEnd || '')
        setApprovals(data.approvals || [])

        // 作業者記録
        if (data.workerRecords && data.workerRecords.length > 0) {
          setWorkerRecords(data.workerRecords.map((r: any, i: number) => {
            const startTime = r.startTime || '08:00'
            const endTime = r.endTime || '17:00'
            // DB保存値が0の場合は作業時間から再計算する
            const manHours = r.workHours || calculateManHours(startTime, endTime)
            return {
              id: r.id || (i + 1).toString(),
              name: r.name || '',
              startTime,
              endTime,
              manHours,
              workType: r.workType || '',
              details: r.details || '',
              dailyHours: r.dailyHours || 0,
              totalHours: r.totalHours || 0,
            }
          }))
        }

        // 使用材料記録
        if (data.materialRecords && data.materialRecords.length > 0) {
          setMaterialRecords(data.materialRecords.map((r: any, i: number) => ({
            id: r.id || (i + 1).toString(),
            name: r.name || '',
            volume: r.volume || '',
            volumeUnit: r.volumeUnit || '',
            quantity: r.quantity || 0,
            unitPrice: r.unitPrice || 0,
            subcontractor: r.subcontractor || '',
          })))
        }

        // 外注先記録
        if (data.subcontractorRecords && data.subcontractorRecords.length > 0) {
          setSubcontractorRecords(data.subcontractorRecords.map((r: any, i: number) => ({
            id: r.id || (i + 1).toString(),
            name: r.name || '',
            workerCount: r.workerCount || 0,
            workContent: r.workContent || '',
          })))
        }

        setLoading(false)
      })
      .catch(error => {
        console.error('作業日報取得エラー:', error)
        alert('作業日報の取得に失敗しました')
        router.push('/dashboard')
      })
  }, [router, reportId])

  // 作業者記録の追加
  const handleAddWorkerRecord = () => {
    if (workerRecords.length >= 50) {
      alert('作業者記録は最大50件までです')
      return
    }
    const newId = Date.now().toString()
    setWorkerRecords(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        startTime: '08:00',
        endTime: '17:00',
        manHours: calculateManHours('08:00', '17:00'),
        workType: '',
        details: '',
        dailyHours: 0,
        totalHours: 0,
      }
    ])
  }

  const handleDeleteWorkerRecord = (id: string) => {
    if (workerRecords.length === 1) {
      alert('作業者記録は最低1件必要です')
      return
    }
    setWorkerRecords(prev => prev.filter(r => r.id !== id))
  }

  // 使用材料記録の追加
  const handleAddMaterialRecord = () => {
    if (materialRecords.length >= 5) {
      alert('使用材料記録は最大5件までです')
      return
    }
    const newId = Date.now().toString()
    setMaterialRecords(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        volume: '',
        volumeUnit: '',
        quantity: 0,
        unitPrice: 0,
        subcontractor: '',
      }
    ])
  }

  const handleDeleteMaterialRecord = (id: string) => {
    setMaterialRecords(prev => prev.filter(r => r.id !== id))
  }

  // 外注先記録の追加
  const handleAddSubcontractorRecord = () => {
    if (subcontractorRecords.length >= 10) {
      alert('外注先記録は最大10件までです')
      return
    }
    const newId = Date.now().toString()
    setSubcontractorRecords(prev => [
      ...prev,
      {
        id: newId,
        name: '',
        workerCount: 0,
        workContent: '',
      }
    ])
  }

  const handleDeleteSubcontractorRecord = (id: string) => {
    setSubcontractorRecords(prev => prev.filter(r => r.id !== id))
  }

  // 更新送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!projectName.trim()) {
      alert('工事名を入力してください')
      return
    }

    setSaving(true)

    try {
      await apiPut(`/api/work-report/${reportId}`, {
        date: new Date(date),
        userId: currentUser?.id,
        projectRefId: projectRefId || undefined,
        projectName,
        projectType,
        projectId,
        weather,
        contactNotes,
        remoteDepartureTime,
        remoteArrivalTime,
        remoteDepartureTime2,
        remoteArrivalTime2,
        trafficGuardCount,
        trafficGuardStart,
        trafficGuardEnd,
        workerRecords: workerRecords.map((record, index) => ({
          name: record.name,
          startTime: record.startTime,
          endTime: record.endTime,
          workHours: record.manHours,
          workType: record.workType,
          details: record.details,
          dailyHours: record.dailyHours,
          totalHours: record.totalHours,
          order: index,
        })),
        materialRecords: materialRecords.map((record, index) => ({
          name: record.name,
          volume: record.volume,
          volumeUnit: record.volumeUnit,
          quantity: record.quantity,
          unitPrice: record.unitPrice,
          amount: record.quantity * record.unitPrice,
          subcontractor: record.subcontractor,
          order: index,
        })),
        subcontractorRecords: subcontractorRecords
          .filter(record => record.name.trim() !== '')
          .map((record, index) => ({
            name: record.name,
            workerCount: record.workerCount,
            workContent: record.workContent,
            order: index,
          })),
      })

      setShowSuccessDialog(true)
    } catch (error) {
      console.error('更新エラー:', error)
      alert('作業日報の更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiDelete(`/api/work-report/${reportId}`)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('削除エラー:', error)
      alert(error.message || '作業日報の削除に失敗しました')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return {
    // UI 制御
    loading, saving, isEditing, setIsEditing,
    showSuccessDialog, setShowSuccessDialog,
    showDeleteConfirm, setShowDeleteConfirm, deleting,
    // 基本情報
    date, setDate, projectName, setProjectName,
    projectType, setProjectType, projectId, setProjectId,
    projectRefId, setProjectRefId, weather, setWeather,
    createdUserName, setCreatedUserName,
    reportOwner, enteredBy,
    // 記録データ
    workerRecords, setWorkerRecords,
    materialRecords, setMaterialRecords,
    subcontractorRecords, setSubcontractorRecords,
    // 遠隔地・交通
    remoteDepartureTime, setRemoteDepartureTime,
    remoteArrivalTime, setRemoteArrivalTime,
    remoteDepartureTime2, setRemoteDepartureTime2,
    remoteArrivalTime2, setRemoteArrivalTime2,
    trafficGuardCount, setTrafficGuardCount,
    trafficGuardStart, setTrafficGuardStart,
    trafficGuardEnd, setTrafficGuardEnd,
    // 連絡・承認
    contactNotes, setContactNotes,
    approvals, setApprovals,
    approvalProcessing,
    rejectModalApprovalId, setRejectModalApprovalId,
    rejectComment, setRejectComment,
    // handlers
    handleApprove, submitReject,
    handleAddWorkerRecord, handleDeleteWorkerRecord,
    handleAddMaterialRecord, handleDeleteMaterialRecord,
    handleAddSubcontractorRecord, handleDeleteSubcontractorRecord,
    handleSubmit, handleDelete,
  }
}
