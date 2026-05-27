'use client'

import { Briefcase, Plus, Trash2 } from 'lucide-react'
import { toHalfWidth } from '../../new/utils'
import type { SubcontractorRecord } from '../types'

interface Props {
  subcontractorRecords: SubcontractorRecord[]
  setSubcontractorRecords: (records: SubcontractorRecord[]) => void
  isEditing: boolean
  onAdd: () => void
  onDelete: (id: string) => void
  subcontractorMasterList: string[]
}

export function SubcontractorCard({
  subcontractorRecords, setSubcontractorRecords, isEditing, onAdd, onDelete, subcontractorMasterList,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-[#0E3091]" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">外注先</h2>
              <span className="text-xs sm:text-sm text-gray-500">({subcontractorRecords.length}件)</span>
            </div>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={onAdd}
              disabled={subcontractorRecords.length >= 10}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">追加</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {subcontractorRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-4">外注先記録はありません</p>
        ) : (
          subcontractorRecords.map((record, index) => (
            <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">外注先 {index + 1}</span>
                {isEditing && (
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">外注先名</label>
                    <input
                      type="text"
                      list={`subcontractor-list-${record.id}`}
                      value={record.name}
                      onChange={(e) => {
                        const newRecords = [...subcontractorRecords]
                        newRecords[index].name = e.target.value
                        setSubcontractorRecords(newRecords)
                      }}
                      className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                      placeholder="選択または直接入力"
                    />
                    <datalist id={`subcontractor-list-${record.id}`}>
                      {subcontractorMasterList.map(sub => (
                        <option key={sub} value={sub} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">人数</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={record.workerCount || ''}
                      onChange={(e) => {
                        const newRecords = [...subcontractorRecords]
                        const halfWidth = toHalfWidth(e.target.value)
                        newRecords[index].workerCount = parseInt(halfWidth) || 0
                        setSubcontractorRecords(newRecords)
                      }}
                      className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                      placeholder="人数"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">作業内容</label>
                    <input
                      type="text"
                      value={record.workContent}
                      onChange={(e) => {
                        const newRecords = [...subcontractorRecords]
                        newRecords[index].workContent = e.target.value
                        setSubcontractorRecords(newRecords)
                      }}
                      className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-xs text-gray-500">外注先名</span>
                    <p className="text-sm font-medium text-gray-900">{record.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">人数</span>
                    <p className="text-sm font-medium text-gray-900">{record.workerCount || 0}人</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">作業内容</span>
                    <p className="text-sm font-medium text-gray-900">{record.workContent || '-'}</p>
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
