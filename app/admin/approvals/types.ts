export interface Approval {
  id: string
  approverRole: string
  approverUserId?: string
  approvedAt?: string
  status: string
  approver?: {
    id: string
    name: string
    position?: string
  }
}

export interface VisitRecord {
  id: string
  destination: string
  contactPerson?: string
  startTime?: string
  endTime?: string
  content?: string
  expense?: number
}

export interface DailyReport {
  id: string
  date: string
  specialNotes?: string
  user: {
    id: string
    name: string
    position?: string
  }
  visitRecords: VisitRecord[]
  approvals: Approval[]
  approvalRoute?: {
    id: string
    name: string
  } | null
}

export interface ManagedUser {
  id: string
  name: string
  username: string
  position?: string
  role: string
  isActive?: boolean
}

export interface SubmissionStatus {
  users: { id: string; name: string; position?: string }[]
  year: number
  month: number
  periodStart: string
  periodEnd: string
  submissionMap: Record<string, Record<string, boolean>>
  submissionTypeMap?: Record<string, Record<string, { type: string; id: string }[]>>
  leaveMap?: Record<string, Record<string, { id: string; type: string; reason?: string; attachmentName?: string }>>
  approvalMap?: Record<string, Record<string, string>>
}

export const LEAVE_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '有給': { bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600' },
  '振替': { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-600' },
  '代休': { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-600' },
  '看護': { bg: 'bg-pink-500', text: 'text-white', border: 'border-pink-600' },
  '介護': { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' },
  '特別休暇': { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600' },
  'その他': { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-600' },
}

export const LEAVE_TYPE_SHORT: Record<string, string> = {
  '有給': '有',
  '振替': '振',
  '代休': '代',
  '看護': '看',
  '介護': '介',
  '特別休暇': '特',
  'その他': '他',
}

export function getReportStatus(approvals: Approval[]): 'pending' | 'approved' | 'rejected' | 'partial' {
  if (approvals.length === 0) return 'pending'
  const hasRejected = approvals.some(a => a.status === 'rejected')
  if (hasRejected) return 'rejected'
  const allApproved = approvals.every(a => a.status === 'approved')
  if (allApproved) return 'approved'
  const hasSomeApproved = approvals.some(a => a.status === 'approved')
  if (hasSomeApproved) return 'partial'
  return 'pending'
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'approved': return '承認済み'
    case 'rejected': return '差戻し'
    case 'partial': return '一部承認'
    case 'pending': return '承認待ち'
    default: return status
  }
}

export function getStatusStyle(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-200'
    case 'partial':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'pending':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）`
}
