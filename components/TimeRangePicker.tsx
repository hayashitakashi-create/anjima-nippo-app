/**
 * 時間範囲入力コンポーネント（モダンデザイン）
 *
 * 機能:
 * - 30分刻みの時刻選択
 * - 開始時間 < 終了時間のバリデーション
 * - エラー表示
 */

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

interface TimeRangePickerProps {
  startTime: string
  endTime: string
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  error?: string
  disabled?: boolean
}

// 時刻文字列を分数に変換（比較用）
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// 30分刻みの時刻リストを生成（00:00-23:30）
const generateTimeOptions = (): string[] => {
  const options: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
      options.push(timeStr)
    }
  }
  return options
}

const timeOptions = generateTimeOptions()

export default function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  error,
  disabled = false
}: TimeRangePickerProps) {
  const [validationError, setValidationError] = useState<string>('')

  // バリデーション: 開始時刻 < 終了時刻
  useEffect(() => {
    if (startTime && endTime) {
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)

      if (startMinutes >= endMinutes) {
        setValidationError('終了時刻は開始時刻より後に設定してください')
      } else {
        setValidationError('')
      }
    }
  }, [startTime, endTime])

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onStartTimeChange(e.target.value)
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onEndTimeChange(e.target.value)
  }

  const displayError = error || validationError

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 開始時間 */}
        <div>
          <label
            htmlFor="start-time"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            開始時間
          </label>
          <select
            id="start-time"
            value={startTime}
            onChange={handleStartTimeChange}
            disabled={disabled}
            className={`w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            style={{
              fontSize: '22px',
              padding: '18px 16px',
              minHeight: '64px',
              lineHeight: '1.2'
            }}
          >
            {timeOptions.map(time => (
              <option
                key={time}
                value={time}
                style={{
                  fontSize: '18px',
                  padding: '12px'
                }}
              >
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* 終了時間 */}
        <div>
          <label
            htmlFor="end-time"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            終了時間
          </label>
          <select
            id="end-time"
            value={endTime}
            onChange={handleEndTimeChange}
            disabled={disabled}
            className={`w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            style={{
              fontSize: '22px',
              padding: '18px 16px',
              minHeight: '64px',
              lineHeight: '1.2'
            }}
          >
            {timeOptions.map(time => (
              <option
                key={time}
                value={time}
                style={{
                  fontSize: '18px',
                  padding: '12px'
                }}
              >
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* エラーメッセージ */}
      {displayError && (
        <div className="flex items-center text-red-600 text-sm mt-2">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  )
}
