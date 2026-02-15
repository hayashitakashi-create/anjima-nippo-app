'use client'

import { Users, Plus, Copy, Trash2 } from 'lucide-react'
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
  const updateRecord = (index: number, field: keyof WorkerRecord, value: any) => {
    const newRecords = [...workerRecords]
    ;(newRecords[index] as any)[field] = value
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
                    onChange={(e) => updateRecord(index, 'startTime', e.target.value)}
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
                    onChange={(e) => updateRecord(index, 'endTime', e.target.value)}
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
                  value={record.manHours || ''}
                  onChange={(e) => {
                    const halfWidth = toHalfWidth(e.target.value)
                    updateRecord(index, 'manHours', parseFloat(halfWidth) || 0)
                  }}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="0"
                />
              </div>

              {/* 工種 */}
              <div className="col-span-1 lg:col-span-3">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工種</label>
                <select
                  value={record.workType}
                  onChange={(e) => updateRecord(index, 'workType', e.target.value)}
                  className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                >
                  <option value="">選択してください</option>
                  {projectTypesList.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
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
