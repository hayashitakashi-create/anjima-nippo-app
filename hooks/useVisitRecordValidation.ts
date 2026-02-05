/**
 * 訪問記録バリデーション用カスタムフック
 *
 * 機能:
 * - 日付・訪問先・商談内容・時刻のバリデーション
 * - エラーメッセージ管理
 * - 送信可否判定
 */

import { useMemo } from 'react'
import { VisitRecordData } from '@/components/VisitRecordCard'

interface ValidationErrors {
  date?: string
  visitRecords: {
    [key: string]: {
      destination?: string
      content?: string
      timeRange?: string
    }
  }
}

interface UseVisitRecordValidationProps {
  date: string
  visitRecords: VisitRecordData[]
}

interface UseVisitRecordValidationReturn {
  errors: ValidationErrors
  isValid: boolean
  errorCount: number
}

// 時刻文字列を分数に変換
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// 未来日チェック
const isFutureDate = (dateStr: string): boolean => {
  const selectedDate = new Date(dateStr)
  selectedDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return selectedDate > today
}

export function useVisitRecordValidation({
  date,
  visitRecords
}: UseVisitRecordValidationProps): UseVisitRecordValidationReturn {
  const errors = useMemo((): ValidationErrors => {
    const errs: ValidationErrors = {
      visitRecords: {}
    }

    // 日付バリデーション
    if (!date) {
      errs.date = '日付を選択してください'
    } else if (isFutureDate(date)) {
      errs.date = '未来の日付は選択できません'
    }

    // 訪問記録バリデーション
    visitRecords.forEach(record => {
      const recordErrors: ValidationErrors['visitRecords'][string] = {}

      // 訪問先
      if (!record.destination.trim()) {
        recordErrors.destination = '訪問先を入力してください'
      }

      // 商談内容
      if (!record.content.trim()) {
        recordErrors.content = '商談内容を入力してください'
      }

      // 時刻バリデーション
      if (record.startTime && record.endTime) {
        const startMinutes = timeToMinutes(record.startTime)
        const endMinutes = timeToMinutes(record.endTime)

        if (startMinutes >= endMinutes) {
          recordErrors.timeRange = '終了時刻は開始時刻より後に設定してください'
        }
      }

      // エラーがある場合のみ追加
      if (Object.keys(recordErrors).length > 0) {
        errs.visitRecords[record.id] = recordErrors
      }
    })

    return errs
  }, [date, visitRecords])

  // バリデーション結果
  const isValid = useMemo(() => {
    if (errors.date) return false
    if (Object.keys(errors.visitRecords).length > 0) return false
    return true
  }, [errors])

  // エラー数のカウント
  const errorCount = useMemo(() => {
    let count = 0
    if (errors.date) count++
    Object.values(errors.visitRecords).forEach(recordErrors => {
      count += Object.keys(recordErrors).length
    })
    return count
  }, [errors])

  return {
    errors,
    isValid,
    errorCount
  }
}
