'use client'

export function CalendarLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-emerald-500 text-white text-[7px] font-bold text-center">営</span>
        営業日報
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-blue-500 text-white text-[7px] font-bold text-center">作</span>
        作業日報
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-emerald-500 text-white text-[7px] font-bold text-center ring-1 ring-amber-400">営</span>
        /
        <span className="inline-block w-4 h-3 leading-3 rounded bg-blue-500 text-white text-[7px] font-bold text-center ring-1 ring-amber-400">作</span>
        承認済み
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-rose-500 text-white text-[7px] font-bold text-center">有</span>
        有給
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-purple-500 text-white text-[7px] font-bold text-center">振</span>
        振替
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-teal-500 text-white text-[7px] font-bold text-center">代</span>
        代休
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-pink-500 text-white text-[7px] font-bold text-center">看</span>
        看護
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-orange-500 text-white text-[7px] font-bold text-center">介</span>
        介護
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-amber-500 text-white text-[7px] font-bold text-center">特</span>
        特別休暇
      </div>
      <div className="flex items-center gap-1">
        <span className="inline-block w-4 h-3 leading-3 rounded bg-gray-500 text-white text-[7px] font-bold text-center">他</span>
        その他
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-rose-50 border border-rose-200 rounded" />
        未提出
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded" />
        要確認
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded" />
        提出済
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-red-50 border border-red-200 rounded" />
        土日
      </div>
    </div>
  )
}
