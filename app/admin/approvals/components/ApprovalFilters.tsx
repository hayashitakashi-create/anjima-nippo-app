'use client'

import { Search, ChevronUp, ChevronDown, User, Users, FileText, Calendar, X } from 'lucide-react'
import type { ManagedUser } from '../types'

interface Props {
  users: ManagedUser[]
  positionOptions: string[]
  selectedUserId: string
  setSelectedUserId: (v: string) => void
  selectedRole: string
  setSelectedRole: (v: string) => void
  selectedReportType: '' | 'sales' | 'work'
  setSelectedReportType: (v: '' | 'sales' | 'work') => void
  startDate: string
  setStartDate: (v: string) => void
  endDate: string
  setEndDate: (v: string) => void
  showFilters: boolean
  setShowFilters: (v: boolean) => void
  hasActiveFilters: boolean
  clearFilters: () => void
}

export function ApprovalFilters({
  users, positionOptions,
  selectedUserId, setSelectedUserId,
  selectedRole, setSelectedRole,
  selectedReportType, setSelectedReportType,
  startDate, setStartDate,
  endDate, setEndDate,
  showFilters, setShowFilters,
  hasActiveFilters, clearFilters,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">絞り込み条件</h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              適用中
            </span>
          )}
        </div>
        {showFilters ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {showFilters && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* ユーザー選択 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 text-gray-500" />
                氏名
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">全てのユーザー</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* 役職選択 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 text-gray-500" />
                役職
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">全ての役職</option>
                {positionOptions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            {/* 日報種別 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 text-gray-500" />
                日報種別
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value as '' | 'sales' | 'work')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                <option value="">両方</option>
                <option value="sales">営業日報</option>
                <option value="work">作業日報</option>
              </select>
            </div>

            {/* 開始日 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                開始日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>

            {/* 終了日 */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                終了日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 mr-1" />
                絞り込みをクリア
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
