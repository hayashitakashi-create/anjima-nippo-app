'use client'

import { useState, useCallback } from 'react'
import {
  WorkerRecord,
  MaterialRecord,
  SubcontractorRecord,
  Template,
  INITIAL_WORKER_RECORD,
  INITIAL_MATERIAL_RECORD,
  INITIAL_SUBCONTRACTOR_RECORD,
} from '../types'
import {
  MAX_WORKER_RECORDS,
  MAX_MATERIAL_RECORDS,
  MAX_SUBCONTRACTOR_RECORDS,
} from '../constants'

export function useWorkReportForm() {
  // 基本情報
  const [date, setDate] = useState('')
  const [projectName, setProjectName] = useState('')
  const [projectType, setProjectType] = useState('')
  const [projectId, setProjectId] = useState('')
  const [weather, setWeather] = useState('')

  // 作業者記録
  const [workerRecords, setWorkerRecords] = useState<WorkerRecord[]>([
    { ...INITIAL_WORKER_RECORD }
  ])

  // 使用材料記録
  const [materialRecords, setMaterialRecords] = useState<MaterialRecord[]>([
    { ...INITIAL_MATERIAL_RECORD }
  ])

  // 外注先記録
  const [subcontractorRecords, setSubcontractorRecords] = useState<SubcontractorRecord[]>([
    { ...INITIAL_SUBCONTRACTOR_RECORD }
  ])

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

  // 作業者記録の追加
  const handleAddWorkerRecord = useCallback(() => {
    if (workerRecords.length >= MAX_WORKER_RECORDS) {
      alert(`作業者記録は最大${MAX_WORKER_RECORDS}件までです`)
      return
    }
    const newId = (Math.max(...workerRecords.map(r => parseInt(r.id))) + 1).toString()
    setWorkerRecords(prev => [
      ...prev,
      { ...INITIAL_WORKER_RECORD, id: newId }
    ])
  }, [workerRecords.length])

  // 作業者記録の削除
  const handleDeleteWorkerRecord = useCallback((id: string) => {
    if (workerRecords.length === 1) {
      alert('作業者記録は最低1件必要です')
      return
    }
    setWorkerRecords(prev => prev.filter(record => record.id !== id))
  }, [workerRecords.length])

  // 使用材料記録の追加
  const handleAddMaterialRecord = useCallback(() => {
    if (materialRecords.length >= MAX_MATERIAL_RECORDS) {
      alert(`使用材料記録は最大${MAX_MATERIAL_RECORDS}件までです`)
      return
    }
    const newId = (Math.max(...materialRecords.map(r => parseInt(r.id))) + 1).toString()
    setMaterialRecords(prev => [
      ...prev,
      { ...INITIAL_MATERIAL_RECORD, id: newId }
    ])
  }, [materialRecords.length])

  // 使用材料記録の削除
  const handleDeleteMaterialRecord = useCallback((id: string) => {
    setMaterialRecords(prev => prev.filter(record => record.id !== id))
  }, [])

  // 外注先記録の追加
  const handleAddSubcontractorRecord = useCallback(() => {
    if (subcontractorRecords.length >= MAX_SUBCONTRACTOR_RECORDS) {
      alert(`外注先記録は最大${MAX_SUBCONTRACTOR_RECORDS}件までです`)
      return
    }
    const newId = (Math.max(...subcontractorRecords.map(r => parseInt(r.id))) + 1).toString()
    setSubcontractorRecords(prev => [
      ...prev,
      { ...INITIAL_SUBCONTRACTOR_RECORD, id: newId }
    ])
  }, [subcontractorRecords.length])

  // 外注先記録の削除
  const handleDeleteSubcontractorRecord = useCallback((id: string) => {
    setSubcontractorRecords(prev => prev.filter(record => record.id !== id))
  }, [])

  // テンプレートを適用
  const applyTemplate = useCallback((template: Template, projectLoaded: boolean) => {
    if (!projectLoaded && template.projectName) {
      setProjectName(template.projectName)
    }
    if (!projectLoaded && template.projectType) {
      setProjectType(template.projectType)
    }
    if (template.remoteDepartureTime) setRemoteDepartureTime(template.remoteDepartureTime)
    if (template.remoteArrivalTime) setRemoteArrivalTime(template.remoteArrivalTime)
    if (template.remoteDepartureTime2) setRemoteDepartureTime2(template.remoteDepartureTime2)
    if (template.remoteArrivalTime2) setRemoteArrivalTime2(template.remoteArrivalTime2)
    if (template.trafficGuardCount) setTrafficGuardCount(template.trafficGuardCount)
    if (template.trafficGuardStart) setTrafficGuardStart(template.trafficGuardStart)
    if (template.trafficGuardEnd) setTrafficGuardEnd(template.trafficGuardEnd)

    if (template.workerRecords) {
      try {
        const workers = JSON.parse(template.workerRecords)
        if (Array.isArray(workers) && workers.length > 0) {
          setWorkerRecords(workers.map((w: any, i: number) => ({
            id: (i + 1).toString(),
            name: w.name || '',
            startTime: w.startTime || '08:00',
            endTime: w.endTime || '17:00',
            manHours: w.manHours || w.workHours || 0,
            workType: w.workType || '',
            details: w.details || '',
            dailyHours: w.dailyHours || 0,
            totalHours: w.totalHours || 0,
          })))
        }
      } catch (e) {
        console.error('作業者記録パースエラー:', e)
      }
    }

    if (template.materialRecords) {
      try {
        const materials = JSON.parse(template.materialRecords)
        if (Array.isArray(materials) && materials.length > 0) {
          setMaterialRecords(materials.map((m: any, i: number) => ({
            id: (i + 1).toString(),
            name: m.name || '',
            volume: m.volume || '',
            volumeUnit: m.volumeUnit || 'ℓ',
            quantity: m.quantity || 0,
            unitPrice: m.unitPrice || 0,
            subcontractor: m.subcontractor || '',
          })))
        }
      } catch (e) {
        console.error('材料記録パースエラー:', e)
      }
    }

    if (template.subcontractorRecords) {
      try {
        const subs = JSON.parse(template.subcontractorRecords)
        if (Array.isArray(subs) && subs.length > 0) {
          setSubcontractorRecords(subs.map((s: any, i: number) => ({
            id: (i + 1).toString(),
            name: s.name || '',
            workerCount: s.workerCount || 0,
            workContent: s.workContent || '',
          })))
        }
      } catch (e) {
        console.error('外注先記録パースエラー:', e)
      }
    }
  }, [])

  // フォームリセット
  const resetForm = useCallback(() => {
    setWorkerRecords([{ ...INITIAL_WORKER_RECORD }])
    setMaterialRecords([{ ...INITIAL_MATERIAL_RECORD }])
    setSubcontractorRecords([{ ...INITIAL_SUBCONTRACTOR_RECORD }])
    setWeather('')
    setContactNotes('')
    setRemoteDepartureTime('')
    setRemoteArrivalTime('')
    setRemoteDepartureTime2('')
    setRemoteArrivalTime2('')
    setTrafficGuardCount(0)
    setTrafficGuardStart('')
    setTrafficGuardEnd('')
  }, [])

  // フォームデータ取得（下書き用）
  const getFormData = useCallback(() => ({
    date,
    projectName,
    projectType,
    projectId,
    weather,
    workerRecords,
    materialRecords,
    subcontractorRecords,
    remoteDepartureTime,
    remoteArrivalTime,
    remoteDepartureTime2,
    remoteArrivalTime2,
    trafficGuardCount,
    trafficGuardStart,
    trafficGuardEnd,
    contactNotes,
  }), [date, projectName, projectType, projectId, weather, workerRecords, materialRecords, subcontractorRecords, remoteDepartureTime, remoteArrivalTime, remoteDepartureTime2, remoteArrivalTime2, trafficGuardCount, trafficGuardStart, trafficGuardEnd, contactNotes])

  // 金額合計
  const totalAmount = materialRecords.reduce((sum, record) => sum + (record.quantity * record.unitPrice), 0)

  return {
    // 基本情報
    date, setDate,
    projectName, setProjectName,
    projectType, setProjectType,
    projectId, setProjectId,
    weather, setWeather,

    // 作業者記録
    workerRecords, setWorkerRecords,
    handleAddWorkerRecord,
    handleDeleteWorkerRecord,

    // 使用材料記録
    materialRecords, setMaterialRecords,
    handleAddMaterialRecord,
    handleDeleteMaterialRecord,
    totalAmount,

    // 外注先記録
    subcontractorRecords, setSubcontractorRecords,
    handleAddSubcontractorRecord,
    handleDeleteSubcontractorRecord,

    // 遠隔地・交通誘導警備員
    remoteDepartureTime, setRemoteDepartureTime,
    remoteArrivalTime, setRemoteArrivalTime,
    remoteDepartureTime2, setRemoteDepartureTime2,
    remoteArrivalTime2, setRemoteArrivalTime2,
    trafficGuardCount, setTrafficGuardCount,
    trafficGuardStart, setTrafficGuardStart,
    trafficGuardEnd, setTrafficGuardEnd,

    // 連絡事項
    contactNotes, setContactNotes,

    // ユーティリティ
    applyTemplate,
    resetForm,
    getFormData,
  }
}
