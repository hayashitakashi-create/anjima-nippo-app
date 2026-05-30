export interface LeaveRequest {
  id: string
  userId: string
  enteredById?: string | null
  applicantName: string | null
  userName?: string | null
  enteredByName?: string | null
  date: string
  leaveType: string
  leaveUnit: string
  startTime: string | null
  endTime: string | null
  reason: string | null
  attachmentName: string | null
  attachmentType: string | null
  status: string
  createdAt: string
}

// 申請者セレクトで「アカウント未登録者（直接入力）」を表す sentinel 値
export const UNREGISTERED_APPLICANT = '__unregistered__'

export const LEAVE_UNITS = [
  { value: 'full', label: '全日' },
  { value: 'am', label: '午前半休' },
  { value: 'pm', label: '午後半休' },
  { value: 'hourly', label: '時間休' },
] as const

export const LEAVE_TYPES = ['有給', '振替', '代休', '看護', '介護', '特別休暇', '慶弔', 'その他']

export const LEAVE_TYPE_COLORS: Record<string, string> = {
  '有給': 'bg-blue-100 text-blue-800',
  '振替': 'bg-purple-100 text-purple-800',
  '代休': 'bg-teal-100 text-teal-800',
  '看護': 'bg-pink-100 text-pink-800',
  '介護': 'bg-orange-100 text-orange-800',
  '特別休暇': 'bg-amber-100 text-amber-800',
  '慶弔': 'bg-rose-100 text-rose-800',
  'その他': 'bg-gray-100 text-gray-800',
}

export const TIME_OPTIONS: string[] = (() => {
  const arr: string[] = []
  for (let h = 0; h < 24; h++) {
    arr.push(`${String(h).padStart(2, '0')}:00`)
  }
  return arr
})()

export const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土']
