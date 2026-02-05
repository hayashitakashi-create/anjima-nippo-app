/**
 * 訪問記録ブロックコンポーネント（モダンデザイン）
 *
 * 1訪問分の入力項目をカード形式でまとめたコンポーネント
 * 将来的に複数訪問記録の管理に対応できる設計
 */

import { useState } from 'react'
import { Building2, User, Clock, FileText, DollarSign, Trash2, AlertCircle } from 'lucide-react'
import TimeRangePicker from './TimeRangePicker'

export interface VisitRecordData {
  id: string
  destination: string
  contactPerson: string
  startTime: string
  endTime: string
  content: string
  expense: number
}

interface VisitRecordCardProps {
  index: number
  data: VisitRecordData
  onChange: (id: string, data: Partial<VisitRecordData>) => void
  onDelete?: (id: string) => void
  showDelete?: boolean
  errors?: {
    destination?: string
    content?: string
    timeRange?: string
  }
}

export default function VisitRecordCard({
  index,
  data,
  onChange,
  onDelete,
  showDelete = false,
  errors = {}
}: VisitRecordCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleFieldChange = (field: keyof VisitRecordData, value: any) => {
    onChange(data.id, { [field]: value })
  }

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete?.(data.id)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      // 3秒後に確認ダイアログを自動で閉じる
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow">
      {/* カードヘッダー */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-4 rounded-t-lg border-b border-emerald-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              訪問記録 {index + 1}
            </h3>
          </div>
          {showDelete && onDelete && (
            <div className="relative">
              {showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>本当に削除しますか？</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>削除</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* カードボディ */}
      <div className="p-6">

        <div className="space-y-5">
          {/* 訪問先・担当者氏名（横並び） */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 訪問先 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span>訪問先</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={data.destination}
                onChange={(e) => handleFieldChange('destination', e.target.value)}
                className="w-full px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="例: ○○株式会社"
              />
              {errors.destination && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.destination}
                </p>
              )}
            </div>

            {/* 担当者氏名 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>担当者氏名</span>
              </label>
              <input
                type="text"
                value={data.contactPerson}
                onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                className="w-full px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                placeholder="例: 田中 太郎様"
              />
            </div>
          </div>

          {/* 作業時間 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>作業時間</span>
              <span className="text-red-500">*</span>
            </label>
            <TimeRangePicker
              startTime={data.startTime}
              endTime={data.endTime}
              onStartTimeChange={(time) => handleFieldChange('startTime', time)}
              onEndTimeChange={(time) => handleFieldChange('endTime', time)}
              error={errors.timeRange}
            />
          </div>

          {/* 商談内容 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span>商談内容</span>
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={data.content}
              onChange={(e) => handleFieldChange('content', e.target.value)}
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-all"
              placeholder="訪問の目的や商談内容を記入してください"
            />
            <div className="flex justify-between items-center mt-2">
              <div>
                {errors.content && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.content}
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-500">
                {data.content.length} / 500文字
              </div>
            </div>
          </div>

          {/* 支出経費 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 text-gray-500" />
              <span>支出経費（円）</span>
            </label>
            <input
              type="number"
              value={data.expense || 0}
              onChange={(e) => handleFieldChange('expense', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              placeholder="0"
              min="0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
