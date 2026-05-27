'use client'

import { Users, Plus, Trash2 } from 'lucide-react'
import { calculateManHoursFromTime } from '../../new/types'
import { toHalfWidth } from '../../new/utils'
import { TIME_OPTIONS } from '../../new/constants'
import type { WorkerRecord } from '../types'

const calculateManHours = calculateManHoursFromTime

interface Props {
  workerRecords: WorkerRecord[]
  setWorkerRecords: (records: WorkerRecord[]) => void
  isEditing: boolean
  onAdd: () => void
  onDelete: (id: string) => void
  workerNamesList: string[]
}

export function WorkerRecordsCard({
  workerRecords, setWorkerRecords, isEditing, onAdd, onDelete, workerNamesList,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-[#0E3091]" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">作業者記録</h2>
              <span className="text-xs sm:text-sm text-gray-500">({workerRecords.length}件)</span>
            </div>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={onAdd}
              disabled={workerRecords.length >= 50}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">追加</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {workerRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-4">作業者記録はありません</p>
        ) : (
          workerRecords.map((record, index) => (
            <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">作業者 {index + 1}</span>
                {isEditing && index > 0 && (
                  <button
                    type="button"
                    onClick={() => onDelete(record.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 sm:gap-4">
                    <div className="col-span-2 sm:col-span-1 lg:col-span-3">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">氏名</label>
                      <select
                        value={record.name}
                        onChange={(e) => {
                          const newRecords = [...workerRecords]
                          newRecords[index].name = e.target.value
                          setWorkerRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                      >
                        <option value="">選択してください</option>
                        {workerNamesList.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1 lg:col-span-4">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">作業時間</label>
                      <div className="flex items-center gap-1">
                        <select
                          value={record.startTime}
                          onChange={(e) => {
                            const newRecords = [...workerRecords]
                            newRecords[index].startTime = e.target.value
                            newRecords[index].manHours = calculateManHours(e.target.value, newRecords[index].endTime)
                            setWorkerRecords(newRecords)
                          }}
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                        >
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                        <span className="text-gray-500 text-sm flex-shrink-0">〜</span>
                        <select
                          value={record.endTime}
                          onChange={(e) => {
                            const newRecords = [...workerRecords]
                            newRecords[index].endTime = e.target.value
                            newRecords[index].manHours = calculateManHours(newRecords[index].startTime, e.target.value)
                            setWorkerRecords(newRecords)
                          }}
                          className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                        >
                          <option value="">--:--</option>
                          {TIME_OPTIONS.map(time => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-span-1 lg:col-span-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={record.manHours || ''}
                        onChange={(e) => {
                          const newRecords = [...workerRecords]
                          const halfWidth = toHalfWidth(e.target.value)
                          newRecords[index].manHours = parseFloat(halfWidth) || 0
                          setWorkerRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 lg:col-span-3">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工種</label>
                      <input
                        type="text"
                        value={record.workType}
                        onChange={(e) => {
                          const newRecords = [...workerRecords]
                          newRecords[index].workType = e.target.value
                          setWorkerRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                        placeholder="工種を入力"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-12 gap-3 sm:gap-4 mt-3">
                    <div className="col-span-1 lg:col-span-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数 当日</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={record.dailyHours || ''}
                        onChange={(e) => {
                          const newRecords = [...workerRecords]
                          const val = e.target.value
                          newRecords[index].dailyHours = val === '' ? 0 : parseFloat(val) || 0
                          setWorkerRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 lg:col-span-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">工数 累計</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={record.totalHours || ''}
                        onChange={(e) => {
                          const newRecords = [...workerRecords]
                          const val = e.target.value
                          newRecords[index].totalHours = val === '' ? 0 : parseFloat(val) || 0
                          setWorkerRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2 lg:col-span-8">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">内容</label>
                      <textarea
                        value={record.details}
                        onChange={(e) => {
                          const newRecords = [...workerRecords]
                          newRecords[index].details = e.target.value
                          setWorkerRecords(newRecords)
                        }}
                        rows={2}
                        className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] resize-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-xs text-gray-500">氏名</span>
                      <p className="text-sm font-medium text-gray-900">{record.name || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">作業時間</span>
                      <p className="text-sm font-medium text-gray-900">{record.startTime || '-'} 〜 {record.endTime || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">工数</span>
                      <p className="text-sm font-medium text-gray-900">{record.manHours || 0}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">工種</span>
                      <p className="text-sm font-medium text-gray-900">{record.workType || '-'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-xs text-gray-500">工数 当日</span>
                      <p className="text-sm font-medium text-gray-900">{record.dailyHours || 0}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">工数 累計</span>
                      <p className="text-sm font-medium text-gray-900">{record.totalHours || 0}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">内容</span>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{record.details || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
