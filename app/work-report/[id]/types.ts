export interface WorkerRecord {
  id: string
  name: string
  startTime: string
  endTime: string
  manHours: number
  workType: string
  details: string
  dailyHours: number
  totalHours: number
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

export const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`
}
