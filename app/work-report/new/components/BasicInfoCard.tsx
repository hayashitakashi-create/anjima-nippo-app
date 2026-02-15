'use client'

import { Calendar, Building2, User as UserIcon } from 'lucide-react'
import { User } from '../types'
import { WEATHER_OPTIONS } from '../constants'

interface BasicInfoCardProps {
  date: string
  setDate: (date: string) => void
  projectName: string
  setProjectName: (name: string) => void
  projectType: string
  setProjectType: (type: string) => void
  projectId: string
  setProjectId: (id: string) => void
  weather: string
  setWeather: (weather: string) => void
  currentUser: User | null
  projectLoaded: boolean
  projectTypesList: string[]
}

export function BasicInfoCard({
  date, setDate,
  projectName, setProjectName,
  projectType, setProjectType,
  projectId, setProjectId,
  weather, setWeather,
  currentUser,
  projectLoaded,
  projectTypesList,
}: BasicInfoCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="w-5 h-5 text-[#0E3091]" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">基本情報</h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-600">作業日報の基本情報を入力してください</p>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* 工事名 */}
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span>工事名</span>
              <span className="text-red-500">*</span>
            </label>
            {projectLoaded ? (
              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                {projectName}
              </div>
            ) : (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                placeholder="工事名を入力してください"
                required
              />
            )}
          </div>

          {/* 工事種別 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>工事種別</span>
            </label>
            {projectLoaded ? (
              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                {projectType || '未設定'}
              </div>
            ) : (
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
            )}
          </div>

          {/* 工事番号 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>工事番号</span>
            </label>
            {projectLoaded ? (
              <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                {projectId || '未設定'}
              </div>
            ) : (
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
                placeholder="工事番号を入力"
              />
            )}
          </div>

          {/* 氏名 */}
          <div className="lg:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <span>氏名</span>
            </label>
            <div className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg border border-gray-200 rounded-lg bg-gray-50">
              {currentUser ? (
                <span className="text-gray-900">
                  {currentUser.name} {currentUser.position ? `(${currentUser.position})` : ''}
                </span>
              ) : (
                <span className="text-gray-400">読み込み中...</span>
              )}
            </div>
          </div>

          {/* 日付 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>日付</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] transition-all"
              required
            />
          </div>

          {/* 天候 */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <span>天候</span>
            </label>
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
          </div>
        </div>
      </div>
    </div>
  )
}
