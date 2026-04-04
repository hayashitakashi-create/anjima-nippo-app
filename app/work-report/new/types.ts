// 作業日報の型定義

export type { ClientUser as User } from '@/lib/types'

export interface WorkerRecord {
  id: string
  name: string
  startTime: string
  endTime: string
  manHours: number    // 工数
  workType: string
  details: string
  dailyHours: number  // 工数 当日
  totalHours: number  // 工数 累計
}

export interface MaterialRecord {
  id: string
  name: string
  volume: string
  volumeUnit: string
  quantity: number
  unitPrice: number
  subcontractor: string
}

export interface SubcontractorRecord {
  id: string
  name: string
  workerCount: number
  workContent: string
}

export interface Template {
  id: string
  name: string
  projectRefId?: string
  projectName?: string
  projectType?: string
  remoteDepartureTime?: string
  remoteArrivalTime?: string
  remoteDepartureTime2?: string
  remoteArrivalTime2?: string
  trafficGuardCount?: number
  trafficGuardStart?: string
  trafficGuardEnd?: string
  workerRecords?: string
  materialRecords?: string
  subcontractorRecords?: string
  isShared: boolean
}

// フォームの状態
export interface WorkReportFormState {
  date: string
  projectName: string
  projectType: string
  projectId: string
  weather: string
  workerRecords: WorkerRecord[]
  materialRecords: MaterialRecord[]
  subcontractorRecords: SubcontractorRecord[]
  remoteDepartureTime: string
  remoteArrivalTime: string
  remoteDepartureTime2: string
  remoteArrivalTime2: string
  trafficGuardCount: number
  trafficGuardStart: string
  trafficGuardEnd: string
  contactNotes: string
}

// 工数を自動計算（1時間 = 0.125、昼休憩12:00-13:00を自動控除）
export function calculateManHoursFromTime(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  if (endMinutes <= startMinutes) return 0

  let totalMinutes = endMinutes - startMinutes

  const lunchStart = 12 * 60
  const lunchEnd = 13 * 60
  if (startMinutes < lunchEnd && endMinutes > lunchStart) {
    const overlapStart = Math.max(startMinutes, lunchStart)
    const overlapEnd = Math.min(endMinutes, lunchEnd)
    totalMinutes -= (overlapEnd - overlapStart)
  }

  const hours = totalMinutes / 60
  return Number((hours * 0.125).toFixed(5))
}

// 初期値
export const INITIAL_WORKER_RECORD: WorkerRecord = {
  id: '1',
  name: '',
  startTime: '08:00',
  endTime: '17:00',
  manHours: calculateManHoursFromTime('08:00', '17:00'),
  workType: '',
  details: '',
  dailyHours: 0,
  totalHours: 0
}

export const INITIAL_MATERIAL_RECORD: MaterialRecord = {
  id: '1',
  name: '',
  volume: '',
  volumeUnit: 'ℓ',
  quantity: 0,
  unitPrice: 0,
  subcontractor: ''
}

export const INITIAL_SUBCONTRACTOR_RECORD: SubcontractorRecord = {
  id: '1',
  name: '',
  workerCount: 0,
  workContent: ''
}
