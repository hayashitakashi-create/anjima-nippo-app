'use client'

import { Package, Plus, Trash2 } from 'lucide-react'
import type { MaterialRecord } from '../types'

interface MaterialMaster {
  name: string
  unitPrice: number
  defaultVolume?: string
}

interface Props {
  materialRecords: MaterialRecord[]
  setMaterialRecords: (records: MaterialRecord[]) => void
  isEditing: boolean
  onAdd: () => void
  onDelete: (id: string) => void
  materialMasterList: MaterialMaster[]
  totalAmount: number
}

export function MaterialRecordsCard({
  materialRecords, setMaterialRecords, isEditing, onAdd, onDelete, materialMasterList, totalAmount,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-[#0E3091]" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">使用材料・消耗品</h2>
              <span className="text-xs sm:text-sm text-gray-500">({materialRecords.length}件)</span>
            </div>
          </div>
          {isEditing && (
            <button
              type="button"
              onClick={onAdd}
              disabled={materialRecords.length >= 5}
              className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0E3091] text-white rounded-lg hover:bg-[#0a2470] disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">追加</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {materialRecords.length === 0 ? (
          <p className="text-gray-500 text-center py-4">使用材料記録はありません</p>
        ) : (
          materialRecords.map((record, index) => (
            <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">材料 {index + 1}</span>
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
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-10 gap-3 sm:gap-4">
                    <div className="col-span-2 sm:col-span-4">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">材料名</label>
                      <select
                        value={record.name}
                        onChange={(e) => {
                          const selectedName = e.target.value
                          const newRecords = [...materialRecords]
                          newRecords[index].name = selectedName
                          const master = materialMasterList.find(m => m.name === selectedName)
                          if (master) {
                            if (master.unitPrice > 0) {
                              newRecords[index].unitPrice = master.unitPrice
                            }
                            if (master.defaultVolume) {
                              newRecords[index].volume = master.defaultVolume
                            }
                          }
                          setMaterialRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                      >
                        <option value="">選択してください</option>
                        {materialMasterList.map(m => (
                          <option key={m.name} value={m.name}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">容量</label>
                      <input
                        type="text"
                        value={record.volume}
                        onChange={(e) => {
                          const newRecords = [...materialRecords]
                          newRecords[index].volume = e.target.value
                          setMaterialRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">数量</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={record.quantity || ''}
                        onChange={(e) => {
                          const newRecords = [...materialRecords]
                          newRecords[index].quantity = parseFloat(e.target.value) || 0
                          setMaterialRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                        placeholder="0"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1 block">
                        単価(円)
                      </label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={record.unitPrice || ''}
                        onChange={(e) => {
                          const newRecords = [...materialRecords]
                          newRecords[index].unitPrice = parseFloat(e.target.value) || 0
                          setMaterialRecords(newRecords)
                        }}
                        className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm text-gray-700">
                      金額 <span className="text-xs text-gray-500">(数量 × 単価)</span>: <span className="font-bold text-lg text-[#0E3091]">{(record.quantity * record.unitPrice).toLocaleString()}円</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-xs text-gray-500">材料名</span>
                    <p className="text-sm font-medium text-gray-900">{record.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">容量</span>
                    <p className="text-sm font-medium text-gray-900">{record.volume || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">数量 / 単価</span>
                    <p className="text-sm font-medium text-gray-900">{record.quantity} / {record.unitPrice.toLocaleString()}円</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">金額</span>
                    <p className="text-sm font-bold text-[#0E3091]">{(record.quantity * record.unitPrice).toLocaleString()}円</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

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
