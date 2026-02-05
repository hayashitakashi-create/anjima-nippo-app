/**
 * 作業時間範囲管理用カスタムフック
 *
 * 機能:
 * - 開始/終了時刻の状態管理
 * - バリデーション
 * - 作業時間の計算
 */

import { useState, useCallback, useMemo } from 'react'

interface UseTimeRangeOptions {
  initialStartTime?: string
  initialEndTime?: string
}

interface UseTimeRangeReturn {
  startTime: string
  endTime: string
  setStartTime: (time: string) => void
  setEndTime: (time: string) => void
  isValid: boolean
  errorMessage: string
  workDurationMinutes: number
  workDurationHours: number
  reset: () => void
}

// 時刻文字列を分数に変換
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// 分数を時間に変換（例: 90 → 1.5）
const minutesToHours = (minutes: number): number => {
  return Math.round((minutes / 60) * 10) / 10
}

export function useTimeRange({
  initialStartTime = '08:00',
  initialEndTime = '10:00'
}: UseTimeRangeOptions = {}): UseTimeRangeReturn {
  const [startTime, setStartTime] = useState(initialStartTime)
  const [endTime, setEndTime] = useState(initialEndTime)

  // バリデーション
  const { isValid, errorMessage } = useMemo(() => {
    if (!startTime || !endTime) {
      return { isValid: false, errorMessage: '時刻を選択してください' }
    }

    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)

    if (startMinutes >= endMinutes) {
      return {
        isValid: false,
        errorMessage: '終了時刻は開始時刻より後に設定してください'
      }
    }

    return { isValid: true, errorMessage: '' }
  }, [startTime, endTime])

  // 作業時間の計算
  const workDurationMinutes = useMemo(() => {
    if (!isValid) return 0
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    return endMinutes - startMinutes
  }, [startTime, endTime, isValid])

  const workDurationHours = useMemo(() => {
    return minutesToHours(workDurationMinutes)
  }, [workDurationMinutes])

  // リセット
  const reset = useCallback(() => {
    setStartTime(initialStartTime)
    setEndTime(initialEndTime)
  }, [initialStartTime, initialEndTime])

  return {
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    isValid,
    errorMessage,
    workDurationMinutes,
    workDurationHours,
    reset
  }
}
