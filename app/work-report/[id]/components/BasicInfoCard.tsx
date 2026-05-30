'use client'

import { Calendar, User, Building2 } from 'lucide-react'
import { WEATHER_OPTIONS } from '../../new/constants'
import { formatDate } from '../types'

interface ReportUser {
  id: string
  name: string
  position?: string | null
}

interface Props {
  isEditing: boolean
  projectName: string
  setProjectName: (v: string) => void
  projectType: string
  setProjectType: (v: string) => void
  projectId: string
  setProjectId: (v: string) => void
  date: string
  setDate: (v: string) => void
  weather: string
  setWeather: (v: string) => void
  projectTypesList: string[]
  reportOwner: ReportUser | null
  enteredBy: ReportUser | null
}

export function BasicInfoCard({
  isEditing,
  projectName, setProjectName,
  projectType, setProjectType,
  projectId, setProjectId,
  date, setDate,
  weather, setWeather,
  projectTypesList,
  reportOwner, enteredBy,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-[#0E3091]" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">基本情報</h2>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 工事名 */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span>工事名</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                required
              />
            ) : (
              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                {projectName || '-'}
              </div>
            )}
          </div>

          {/* 工事種別 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>工事種別</span>
            </label>
            {isEditing ? (
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
              >
                <option value="">選択してください</option>
                {projectTypesList.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                {projectType || '-'}
              </div>
            )}
          </div>

          {/* 工事番号 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>工事番号</span>
            </label>
            {isEditing ? (
              <input
                type="text"
                value={projectId || ''}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
              />
            ) : (
              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                {projectId || '-'}
              </div>
            )}
          </div>

          {/* 氏名（記入者） */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <span>氏名（記入者）</span>
            </label>
            <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50">
              {reportOwner ? (
                <span className="text-gray-900">
                  {reportOwner.name}{reportOwner.position ? ` (${reportOwner.position})` : ''}
                </span>
              ) : (
                <span className="text-gray-400">読み込み中...</span>
              )}
            </div>
            {enteredBy && (
              <p className="mt-1 text-xs text-amber-700">
                入力者: {enteredBy.name}{enteredBy.position ? `（${enteredBy.position}）` : ''}（代理入力）
              </p>
            )}
          </div>

          {/* 日付 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>日付</span>
            </label>
            {isEditing ? (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                required
              />
            ) : (
              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                {formatDate(date)}
              </div>
            )}
          </div>

          {/* 天候 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>天候</span>
            </label>
            {isEditing ? (
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
              >
                <option value="">選択してください</option>
                {WEATHER_OPTIONS.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                {weather || '-'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
