'use client'

import { Briefcase, Plus, Copy, Trash2 } from 'lucide-react'
import { SubcontractorRecord } from '../types'
import { MAX_SUBCONTRACTOR_RECORDS } from '../constants'
import { toHalfWidth } from '../utils'

interface SubcontractorCardProps {
  subcontractorRecords: SubcontractorRecord[]
  setSubcontractorRecords: (records: SubcontractorRecord[]) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onCopyPrevious: () => void
  copyLoading: string
  subcontractorMasterList: string[]
}

export function SubcontractorCard({
  subcontractorRecords,
  setSubcontractorRecords,
  onAdd,
  onDelete,
  onCopyPrevious,
  copyLoading,
  subcontractorMasterList,
}: SubcontractorCardProps) {
  const updateRecord = (index: number, field: keyof SubcontractorRecord, value: any) => {
    const newRecords = [...subcontractorRecords]
    ;(newRecords[index] as any)[field] = value
    setSubcontractorRecords(newRecords)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-5 h-5 text-[#0E3091]" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">外注先</h2>
              <span className="text-xs sm:text-sm text-gray-500">({subcontractorRecords.length}/{MAX_SUBCONTRACTOR_RECORDS}件)</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">外注先の情報を入力してください</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopyPrevious}
              disabled={copyLoading === 'subcontractor'}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">{copyLoading === 'subcontractor' ? '取得中...' : '前日コピー'}</span>
            </button>
            <button
              type="button"
              onClick={onAdd}
              disabled={subcontractorRecords.length >= MAX_SUBCONTRACTOR_RECORDS}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">追加</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {subcontractorRecords.map((record, index) => (
          <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">外注先 {index + 1}</span>
              <button
                type="button"
                onClick={() => onDelete(record.id)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* 外注先名 */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">外注先名</label>
                <select
                  value={record.name}
                  onChange={(e) => updateRecord(index, 'name', e.target.value)}
                  className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                >
                  <option value="">選択してください</option>
                  {subcontractorMasterList.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              {/* 人数 */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">人数</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={record.workerCount || ''}
                  onChange={(e) => {
                    const halfWidth = toHalfWidth(e.target.value)
                    updateRecord(index, 'workerCount', parseInt(halfWidth) || 0)
                  }}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="人数"
                />
              </div>

              {/* 作業内容 */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">作業内容</label>
                <input
                  type="text"
                  value={record.workContent}
                  onChange={(e) => updateRecord(index, 'workContent', e.target.value)}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="作業内容を入力"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
