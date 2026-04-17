import { z } from 'zod'

// 共通
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, '日付はYYYY-MM-DD形式で入力してください')
const timeString = z.string().regex(/^\d{2}:\d{2}$/, '時刻はHH:MM形式で入力してください').optional().nullable()

// 作業日報
export const workerRecordSchema = z.object({
  name: z.string().min(1).max(100),
  startTime: timeString,
  endTime: timeString,
  workHours: z.number().min(0).max(24).optional().nullable(),
  workType: z.string().max(100).optional().nullable(),
  details: z.string().max(1000).optional().nullable(),
  dailyHours: z.number().min(0).optional().nullable(),
  totalHours: z.number().min(0).optional().nullable(),
  remainHours: z.number().optional().nullable(),
  order: z.number().int().min(0),
})

export const materialRecordSchema = z.object({
  name: z.string().min(1).max(200),
  volume: z.string().max(50).optional().nullable(),
  volumeUnit: z.string().max(20).optional().nullable(),
  quantity: z.number().min(0).optional().nullable(),
  unitPrice: z.number().min(0).optional().nullable(),
  subcontractor: z.string().max(200).optional().nullable(),
  order: z.number().int().min(0),
})

export const subcontractorRecordSchema = z.object({
  name: z.string().min(1).max(200),
  workerCount: z.number().int().min(0).optional().nullable(),
  workContent: z.string().max(500).optional().nullable(),
  order: z.number().int().min(0),
})

export const workReportCreateSchema = z.object({
  date: dateString,
  projectName: z.string().min(1, '工事名は必須です').max(200),
  projectType: z.string().max(100).optional().nullable(),
  projectId: z.string().max(100).optional().nullable(),
  projectRefId: z.string().optional().nullable(),
  weather: z.string().max(50).optional().nullable(),
  contactNotes: z.string().max(2000).optional().nullable(),
  remoteDepartureTime: timeString,
  remoteArrivalTime: timeString,
  remoteDepartureTime2: timeString,
  remoteArrivalTime2: timeString,
  trafficGuardCount: z.number().int().min(0).max(100).optional().nullable(),
  trafficGuardStart: timeString,
  trafficGuardEnd: timeString,
  workerRecords: z.array(workerRecordSchema).max(50),
  materialRecords: z.array(materialRecordSchema).max(50),
  subcontractorRecords: z.array(subcontractorRecordSchema).max(20).optional().default([]),
})

// 営業日報
export const visitRecordSchema = z.object({
  destination: z.string().max(200).optional().nullable(),
  contactPerson: z.string().max(100).optional().nullable(),
  startTime: timeString,
  endTime: timeString,
  content: z.string().max(2000).optional().nullable(),
  expense: z.number().min(0).optional().nullable(),
  order: z.number().int().min(0),
})

export const nippoCreateSchema = z.object({
  date: dateString,
  specialNotes: z.string().max(5000).optional().nullable(),
  visitRecords: z.array(visitRecordSchema).max(30),
})

// 休暇届
export const leaveRequestSchema = z.object({
  applicantName: z.string().max(100).optional().nullable(),
  date: dateString,
  leaveType: z.enum(['有給', '振替', '代休', '看護', '介護', '特別休暇', '慶弔', 'その他']),
  leaveUnit: z.enum(['full', 'am', 'pm', 'hourly']).optional().default('full'),
  startTime: timeString,
  endTime: timeString,
  familyName: z.string().max(100).optional().nullable(),
  familyBirthdate: z.string().max(50).optional().nullable(),
  familyRelationship: z.string().max(50).optional().nullable(),
  adoptionDate: z.string().max(50).optional().nullable(),
  specialAdoptionDate: z.string().max(50).optional().nullable(),
  careReason: z.string().max(500).optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
  attachmentData: z.string().max(7_000_000).optional().nullable(),
  attachmentName: z.string().max(200).optional().nullable(),
  attachmentType: z.string().max(100).optional().nullable(),
})

// ユーザー作成
export const userCreateSchema = z.object({
  name: z.string().min(1, '氏名は必須です').max(100),
  username: z.string().min(1, 'ユーザー名は必須です').max(200),
  password: z.string().min(8, 'パスワードは8文字以上で設定してください').max(200),
  position: z.string().max(100).optional().nullable(),
  role: z.enum(['admin', 'user']).optional().default('user'),
  defaultReportType: z.enum(['work', 'sales', 'both']).optional().default('work'),
})

// バリデーション結果のヘルパー
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const firstError = result.error.issues[0]
  return { success: false, error: firstError?.message || '入力値が不正です' }
}
