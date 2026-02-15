'use client'

import { Clock, Copy } from 'lucide-react'
import { TIME_OPTIONS } from '../constants'
import { toHalfWidth } from '../utils'

interface RemoteTrafficCardProps {
  remoteDepartureTime: string
  setRemoteDepartureTime: (time: string) => void
  remoteArrivalTime: string
  setRemoteArrivalTime: (time: string) => void
  remoteDepartureTime2: string
  setRemoteDepartureTime2: (time: string) => void
  remoteArrivalTime2: string
  setRemoteArrivalTime2: (time: string) => void
  trafficGuardCount: number
  setTrafficGuardCount: (count: number) => void
  trafficGuardStart: string
  setTrafficGuardStart: (time: string) => void
  trafficGuardEnd: string
  setTrafficGuardEnd: (time: string) => void
  onCopyPrevious: () => void
  copyLoading: string
}

export function RemoteTrafficCard({
  remoteDepartureTime, setRemoteDepartureTime,
  remoteArrivalTime, setRemoteArrivalTime,
  remoteDepartureTime2, setRemoteDepartureTime2,
  remoteArrivalTime2, setRemoteArrivalTime2,
  trafficGuardCount, setTrafficGuardCount,
  trafficGuardStart, setTrafficGuardStart,
  trafficGuardEnd, setTrafficGuardEnd,
  onCopyPrevious,
  copyLoading,
}: RemoteTrafficCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-[#0E3091]" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">遠隔地・交通誘導警備員</h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">遠隔地の移動時間や交通誘導警備員の情報を入力してください</p>
          </div>
          <button
            type="button"
            onClick={onCopyPrevious}
            disabled={copyLoading === 'remote'}
            className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs sm:text-sm font-medium shadow-sm transition-all"
          >
            <Copy className="w-4 h-4" />
            <span className="hidden sm:inline">{copyLoading === 'remote' ? '取得中...' : '前日コピー'}</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* 遠隔地情報 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">遠隔地移動時間</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs sm:text-sm text-gray-600 mb-1 block">出発時刻</label>
                <select
                  value={remoteDepartureTime}
                  onChange={(e) => setRemoteDepartureTime(e.target.value)}
                  className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                >
                  <option value="">--:--</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs sm:text-sm text-gray-600 mb-1 block">現場着</label>
                <select
                  value={remoteArrivalTime}
                  onChange={(e) => setRemoteArrivalTime(e.target.value)}
                  className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                >
                  <option value="">--:--</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs sm:text-sm text-gray-600 mb-1 block">現場発</label>
                <select
                  value={remoteDepartureTime2}
                  onChange={(e) => setRemoteDepartureTime2(e.target.value)}
                  className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                >
                  <option value="">--:--</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs sm:text-sm text-gray-600 mb-1 block">会社着</label>
                <select
                  value={remoteArrivalTime2}
                  onChange={(e) => setRemoteArrivalTime2(e.target.value)}
                  className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                >
                  <option value="">--:--</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 交通誘導警備員情報 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">交通誘導警備員</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs sm:text-sm text-gray-600 mb-1 block">人数</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={trafficGuardCount || ''}
                  onChange={(e) => {
                    const halfWidth = toHalfWidth(e.target.value)
                    setTrafficGuardCount(parseInt(halfWidth) || 0)
                  }}
                  className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091]"
                  placeholder="人数"
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm text-gray-600 mb-1 block">開始時刻</label>
                <select
                  value={trafficGuardStart}
                  onChange={(e) => setTrafficGuardStart(e.target.value)}
                  className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                >
                  <option value="">--:--</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs sm:text-sm text-gray-600 mb-1 block">終了時刻</label>
                <select
                  value={trafficGuardEnd}
                  onChange={(e) => setTrafficGuardEnd(e.target.value)}
                  className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] focus:border-[#0E3091] bg-white"
                >
                  <option value="">--:--</option>
                  {TIME_OPTIONS.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
