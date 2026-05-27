'use client'

import { Clock } from 'lucide-react'
import { toHalfWidth } from '../../new/utils'
import { TIME_OPTIONS } from '../../new/constants'

interface Props {
  isEditing: boolean
  remoteDepartureTime: string
  setRemoteDepartureTime: (v: string) => void
  remoteArrivalTime: string
  setRemoteArrivalTime: (v: string) => void
  remoteDepartureTime2: string
  setRemoteDepartureTime2: (v: string) => void
  remoteArrivalTime2: string
  setRemoteArrivalTime2: (v: string) => void
  trafficGuardCount: number
  setTrafficGuardCount: (v: number) => void
  trafficGuardStart: string
  setTrafficGuardStart: (v: string) => void
  trafficGuardEnd: string
  setTrafficGuardEnd: (v: string) => void
}

export function RemoteTrafficCard({
  isEditing,
  remoteDepartureTime, setRemoteDepartureTime,
  remoteArrivalTime, setRemoteArrivalTime,
  remoteDepartureTime2, setRemoteDepartureTime2,
  remoteArrivalTime2, setRemoteArrivalTime2,
  trafficGuardCount, setTrafficGuardCount,
  trafficGuardStart, setTrafficGuardStart,
  trafficGuardEnd, setTrafficGuardEnd,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200/50">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg border-b">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 text-[#0E3091]" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">遠隔地・交通誘導警備員</h2>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* 遠隔地情報 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">遠隔地移動時間</h3>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-1 block">出発時刻</label>
                  <select value={remoteDepartureTime} onChange={(e) => setRemoteDepartureTime(e.target.value)}
                    className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-1 block">現場着</label>
                  <select value={remoteArrivalTime} onChange={(e) => setRemoteArrivalTime(e.target.value)}
                    className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-1 block">現場発</label>
                  <select value={remoteDepartureTime2} onChange={(e) => setRemoteDepartureTime2(e.target.value)}
                    className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-1 block">会社着</label>
                  <select value={remoteArrivalTime2} onChange={(e) => setRemoteArrivalTime2(e.target.value)}
                    className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-gray-500">出発時刻</span>
                  <p className="text-sm font-medium text-gray-900">{remoteDepartureTime || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">現場着</span>
                  <p className="text-sm font-medium text-gray-900">{remoteArrivalTime || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">現場発</span>
                  <p className="text-sm font-medium text-gray-900">{remoteDepartureTime2 || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">会社着</span>
                  <p className="text-sm font-medium text-gray-900">{remoteArrivalTime2 || '-'}</p>
                </div>
              </div>
            )}
          </div>

          {/* 交通誘導警備員情報 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">交通誘導警備員</h3>
            {isEditing ? (
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
                    className="w-full h-[38px] px-2 sm:px-3 py-2 text-sm sm:text-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091]"
                    placeholder="人数"
                  />
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-1 block">開始時刻</label>
                  <select value={trafficGuardStart} onChange={(e) => setTrafficGuardStart(e.target.value)}
                    className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-1 block">終了時刻</label>
                  <select value={trafficGuardEnd} onChange={(e) => setTrafficGuardEnd(e.target.value)}
                    className="w-full h-[38px] px-1 sm:px-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E3091] bg-white">
                    <option value="">--:--</option>
                    {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <span className="text-xs text-gray-500">人数</span>
                  <p className="text-sm font-medium text-gray-900">{trafficGuardCount || 0}人</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">開始時刻</span>
                  <p className="text-sm font-medium text-gray-900">{trafficGuardStart || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">終了時刻</span>
                  <p className="text-sm font-medium text-gray-900">{trafficGuardEnd || '-'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
