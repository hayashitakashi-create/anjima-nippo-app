'use client'

import { Users, Plus, Copy, Trash2, UserPlus } from 'lucide-react'
import { WorkerRecord } from '../types'
import { WORKER_NAMES, TIME_OPTIONS, MAX_WORKER_RECORDS } from '../constants'
import { toHalfWidth } from '../utils'

interface WorkerRecordsCardProps {
  workerRecords: WorkerRecord[]
  setWorkerRecords: (records: WorkerRecord[]) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onCopyPrevious: () => void
  copyLoading: string
  projectTypesList: string[]
}

export function WorkerRecordsCard({
  workerRecords,
  setWorkerRecords,
  onAdd,
  onDelete,
  onCopyPrevious,
  copyLoading,
  projectTypesList,
}: WorkerRecordsCardProps) {
  // 工数を自動計算（1時間 = 0.125、昼休憩12:00-13:00を自動控除）
  const calculateManHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    if (endMinutes <= startMinutes) return 0

    let totalMinutes = endMinutes - startMinutes

    // 昼休憩（12:00-13:00）が作業時間に含まれる場合、1時間を引く
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

  const updateRecord = (index: number, field: keyof WorkerRecord, value: any) => {
    const newRecords = [...workerRecords]
    ;(newRecords[index] as any)[field] = value
    setWorkerRecords(newRecords)
  }

  // 作業時間変更時に工数を自動計算
  const updateTimeAndCalculate = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newRecords = [...workerRecords]
    ;(newRecords[index] as any)[field] = value
    const startTime = field === 'startTime' ? value : newRecords[index].startTime
    const endTime = field === 'endTime' ? value : newRecords[index].endTime
    newRecords[index].manHours = calculateManHours(startTime, endTime)
    setWorkerRecords(newRecords)
  }

  // 工数の表示フォーマット（小数点第5位まで）
  const formatManHours = (value: number): string => {
    if (!value) return ''
    return value.toFixed(5)
  }

  // 作業者1の内容（氏名以外）で新しい作業者を追加
  const handleCopyWorker1 = () => {
    if (workerRecords.length >= MAX_WORKER_RECORDS) return
    const source = workerRecords[0]
    const newId = (workerRecords.length + 1).toString()
    const newRecords = [...workerRecords, {
      id: newId,
      name: '',
      startTime: source.startTime,
      endTime: source.endTime,
      manHours: source.manHours,
      workType: source.workType,
      details: source.details,
      dailyHours: source.dailyHours,
      totalHours: source.totalHours,
    }]
    setWorkerRecords(newRecords)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-[#0E3091]" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">作業者記録</h2>
              <span className="text-xs sm:text-sm text-gray-500">({workerRecords.length}/{MAX_WORKER_RECORDS}件)</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">作業者の情報を入力してください</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyWorker1}
              disabled={workerRecords.length >= MAX_WORKER_RECORDS}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">作業者1をコピー</span>
            </button>
            <button
              type="button"
              onClick={onCopyPrevious}
              disabled={copyLoading === 'worker'}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">{copyLoading === 'worker' ? '取得中...' : '前日コピー'}</span>
            </button>
            <button
              type="button"
              onClick={onAdd}
              disabled={workerRecords.length >= MAX_WORKER_RECORDS}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">追加</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {workerRecords.map((record, index) => (
          <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">作業者 {index + 1}</span>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => onDelete(record.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 上段: 氏名 | 作業時間(開始〜終了) | 工数 | 工種 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 sm:gap-4">
              {/* 氏名 */}
              <div className="col-span-2 sm:col-span-1 lg:col-span-3">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">氏名</label>
                <select
                  value={record.name}
                  onChange={(e) => updateRecord(index, 'name', e.target.value)}
                  className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                >
                  <option value="">選択してください</option>
                  {WORKER_NAMES.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* 作業時間（開始〜終了） */}
              <div className="col-span-2 sm:col-span-1 lg:col-span-4">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">作業時間</label>
                <div className="flex items-center gap-1">
                  <select
                    value={record.startTime}
                    onChange={(e) => updateTimeAndCalculate(index, 'startTime', e.target.value)}
                    className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  >
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <span className="text-gray-500 text-sm flex-shrink-0">〜</span>
                  <select
                    value={record.endTime}
                    onChange={(e) => updateTimeAndCalculate(index, 'endTime', e.target.value)}
                    className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  >
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 工数 */}
              <div className="col-span-1 lg:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formatManHours(record.manHours)}
                  onChange={(e) => {
                    const halfWidth = toHalfWidth(e.target.value)
                    updateRecord(index, 'manHours', parseFloat(halfWidth) || 0)
                  }}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-blue-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="0.000"
                />
              </div>

              {/* 工種 */}
              <div className="col-span-1 lg:col-span-3">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工種</label>
                <input
                  type="text"
                  value={record.workType}
                  onChange={(e) => updateRecord(index, 'workType', e.target.value)}
                  className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="工種を入力"
                />
              </div>
            </div>

            {/* 下段: 工数当日 | 工数累計 | 内容 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 sm:gap-4 mt-3">
              {/* 工数 当日 */}
              <div className="col-span-1 lg:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数 当日</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={record.dailyHours || ''}
                  onChange={(e) => {
                    const halfWidth = toHalfWidth(e.target.value)
                    updateRecord(index, 'dailyHours', parseFloat(halfWidth) || 0)
                  }}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="0"
                />
              </div>

              {/* 工数 累計 */}
              <div className="col-span-1 lg:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数 累計</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={record.totalHours || ''}
                  onChange={(e) => {
                    const halfWidth = toHalfWidth(e.target.value)
                    updateRecord(index, 'totalHours', parseFloat(halfWidth) || 0)
                  }}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="0"
                />
              </div>

              {/* 作業内容・内訳 */}
              <div className="col-span-2 sm:col-span-2 lg:col-span-8">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">内容</label>
                <textarea
                  value={record.details}
                  onChange={(e) => updateRecord(index, 'details', e.target.value)}
                  rows={2}
                  className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] resize-none"
                  placeholder="作業内容の詳細を入力"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
