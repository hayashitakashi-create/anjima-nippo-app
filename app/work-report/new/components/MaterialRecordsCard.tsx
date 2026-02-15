'use client'

import { Package, Plus, Copy, Trash2 } from 'lucide-react'
import { MaterialRecord } from '../types'
import { MAX_MATERIAL_RECORDS } from '../constants'
import { toHalfWidth } from '../utils'

interface MaterialRecordsCardProps {
  materialRecords: MaterialRecord[]
  setMaterialRecords: (records: MaterialRecord[]) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onCopyPrevious: () => void
  copyLoading: string
  materialMasterList: string[]
  unitMasterList: string[]
  totalAmount: number
}

export function MaterialRecordsCard({
  materialRecords,
  setMaterialRecords,
  onAdd,
  onDelete,
  onCopyPrevious,
  copyLoading,
  materialMasterList,
  unitMasterList,
  totalAmount,
}: MaterialRecordsCardProps) {
  const updateRecord = (index: number, field: keyof MaterialRecord, value: any) => {
    const newRecords = [...materialRecords]
    ;(newRecords[index] as any)[field] = value
    setMaterialRecords(newRecords)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-[#0E3091]" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">使用材料・消耗品</h2>
              <span className="text-xs sm:text-sm text-gray-500">({materialRecords.length}/{MAX_MATERIAL_RECORDS}件)</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">使用した材料や消耗品を入力してください</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopyPrevious}
              disabled={copyLoading === 'material'}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">{copyLoading === 'material' ? '取得中...' : '前日コピー'}</span>
            </button>
            <button
              type="button"
              onClick={onAdd}
              disabled={materialRecords.length >= MAX_MATERIAL_RECORDS}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">追加</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {materialRecords.map((record, index) => (
          <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">材料 {index + 1}</span>
              <button
                type="button"
                onClick={() => onDelete(record.id)}
                className="text-red-600 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* 上段: 材料名 | 容量 | 単位 | 数量 | 単価 */}
            <div className="grid grid-cols-2 sm:grid-cols-12 gap-3 sm:gap-4">
              {/* 材料名 */}
              <div className="col-span-2 sm:col-span-4">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">材料名</label>
                <select
                  value={record.name}
                  onChange={(e) => updateRecord(index, 'name', e.target.value)}
                  className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                >
                  <option value="">選択してください</option>
                  {materialMasterList.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* 容量 */}
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">容量</label>
                <input
                  type="text"
                  value={record.volume}
                  onChange={(e) => updateRecord(index, 'volume', e.target.value)}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="容量"
                />
              </div>

              {/* 単位 */}
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">単位</label>
                <select
                  value={record.volumeUnit}
                  onChange={(e) => updateRecord(index, 'volumeUnit', e.target.value)}
                  className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                >
                  <option value="">選択</option>
                  {unitMasterList.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>

              {/* 数量 */}
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">数量</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={record.quantity || ''}
                  onChange={(e) => {
                    const halfWidth = toHalfWidth(e.target.value)
                    updateRecord(index, 'quantity', parseFloat(halfWidth) || 0)
                  }}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="0"
                />
              </div>

              {/* 単価 */}
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">単価(円)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={record.unitPrice ? record.unitPrice.toLocaleString() : ''}
                  onChange={(e) => {
                    const halfWidth = toHalfWidth(e.target.value)
                    const rawValue = halfWidth.replace(/,/g, '')
                    updateRecord(index, 'unitPrice', parseFloat(rawValue) || 0)
                  }}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="0"
                />
              </div>
            </div>

            {/* 金額（自動計算） */}
            <div className="mt-3">
              <div className="text-sm text-gray-700">
                金額: <span className="font-bold text-lg text-[#0E3091]">{(record.quantity * record.unitPrice).toLocaleString()}円</span>
              </div>
            </div>
          </div>
        ))}

        {/* 合計金額 */}
        {materialRecords.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">合計金額</span>
              <span className="text-xl font-bold text-[#0E3091]">{totalAmount.toLocaleString()}円</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
