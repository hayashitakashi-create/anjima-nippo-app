'use client'

import { Filter } from 'lucide-react'

interface Stats {
  all: number
  pending: number
  approved: number
  rejected: number
}

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected'

interface Props {
  filter: FilterKey
  setFilter: (v: FilterKey) => void
  stats: Stats
}

export function StatsBadges({ filter, setFilter, stats }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {[
        { key: 'pending' as const, label: '承認待ち', count: stats.pending, color: 'orange' },
        { key: 'all' as const, label: 'すべて', count: stats.all, color: 'gray' },
        { key: 'approved' as const, label: '承認済み', count: stats.approved, color: 'emerald' },
        { key: 'rejected' as const, label: '差戻し', count: stats.rejected, color: 'red' },
      ].map(tab => (
        <button
          key={tab.key}
          onClick={() => setFilter(tab.key)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === tab.key
              ? tab.color === 'orange' ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                : tab.color === 'emerald' ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                : tab.color === 'red' ? 'bg-red-100 text-red-700 border-2 border-red-300'
                : 'bg-purple-100 text-purple-700 border-2 border-purple-300'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          {tab.label}
          <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
            filter === tab.key ? 'bg-white/50' : 'bg-gray-100'
          }`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}
