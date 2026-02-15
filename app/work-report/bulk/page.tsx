'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  Calendar,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

interface Template {
  id: string
  name: string
  projectName?: string
  projectType?: string
  workerRecords?: string
  materialRecords?: string
  subcontractorRecords?: string
}

interface ExistingReport {
  id: string
  date: string
  projectName: string
}

export default function BulkCreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set())
  const [existingReports, setExistingReports] = useState<Map<string, ExistingReport>>(new Map())
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    createdCount?: number
    skippedCount?: number
    skippedDates?: string[]
  } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    fetchExistingReports()
  }, [currentMonth])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates', { credentials: 'include' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates)
      }
    } catch (err) {
      console.error('テンプレート取得エラー:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingReports = async () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const startDate = new Date(year, month, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

    try {
      const res = await fetch(`/api/work-reports/bulk?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include',
      })
      if (res.ok) {
        const data = await res.json()
        const map = new Map<string, ExistingReport>()
        data.reports.forEach((r: ExistingReport) => {
          map.set(r.date, r)
        })
        setExistingReports(map)
      }
    } catch (err) {
      console.error('既存日報確認エラー:', err)
    }
  }

  const handleCreate = async () => {
    if (selectedDates.size === 0) {
      setError('日付を選択してください')
      return
    }

    setCreating(true)
    setError('')
    setResult(null)

    try {
      // テンプレートデータを取得
      let templateData = null
      if (selectedTemplate) {
        const template = templates.find(t => t.id === selectedTemplate)
        if (template) {
          templateData = {
            projectName: template.projectName,
            projectType: template.projectType,
            workerRecords: template.workerRecords ? JSON.parse(template.workerRecords) : [],
            materialRecords: template.materialRecords ? JSON.parse(template.materialRecords) : [],
            subcontractorRecords: template.subcontractorRecords ? JSON.parse(template.subcontractorRecords) : [],
          }
        }
      }

      const res = await fetch('/api/work-reports/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          dates: Array.from(selectedDates).sort(),
          template: templateData,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          createdCount: data.createdCount,
          skippedCount: data.skippedCount,
          skippedDates: data.skippedDates,
        })
        setSelectedDates(new Set())
        fetchExistingReports()
      } else {
        setError(data.error || '作成に失敗しました')
      }
    } catch (err) {
      setError('作成に失敗しました')
    } finally {
      setCreating(false)
    }
  }

  const toggleDate = (dateStr: string) => {
    const newSet = new Set(selectedDates)
    if (newSet.has(dateStr)) {
      newSet.delete(dateStr)
    } else {
      newSet.add(dateStr)
    }
    setSelectedDates(newSet)
  }

  const selectWeekdays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const newSet = new Set<string>()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dow = date.getDay()
      const dateStr = date.toISOString().split('T')[0]
      // 平日のみ（土日以外）かつ既存日報がない
      if (dow !== 0 && dow !== 6 && !existingReports.has(dateStr)) {
        newSet.add(dateStr)
      }
    }
    setSelectedDates(newSet)
  }

  const selectAll = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const newSet = new Set<string>()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      if (!existingReports.has(dateStr)) {
        newSet.add(dateStr)
      }
    }
    setSelectedDates(newSet)
  }

  const clearSelection = () => {
    setSelectedDates(new Set())
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    setSelectedDates(new Set())
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    setSelectedDates(new Set())
  }

  // カレンダー生成
  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: { date: Date | null; dateStr: string }[] = []

    // 月初の空白
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, dateStr: '' })
    }

    // 日付
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      days.push({
        date,
        dateStr: date.toISOString().split('T')[0],
      })
    }

    return days
  }

  const calendar = generateCalendar()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">一括日報作成</h1>
                <p className="text-xs text-gray-500 hidden sm:block">複数日分の日報をまとめて作成</p>
              </div>
            </div>
            <Link href="/dashboard" className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="TOP画面">
              <Home className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-6 py-6">
        {/* 結果メッセージ */}
        {result && result.success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <Check className="w-5 h-5 mr-2" />
              <span className="font-medium">{result.createdCount}件の日報を作成しました</span>
            </div>
            {result.skippedCount && result.skippedCount > 0 && (
              <p className="text-sm mt-1">
                {result.skippedCount}件はすでに日報が存在するためスキップしました
              </p>
            )}
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* 説明 */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-indigo-800 mb-2">一括日報作成について</h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>- カレンダーから複数の日付を選択して日報をまとめて作成できます</li>
            <li>- テンプレートを選択すると、作業者・材料・外注先が自動入力されます</li>
            <li>- すでに日報がある日（青色）は作成されません</li>
          </ul>
        </div>

        {/* テンプレート選択 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            テンプレートを選択（任意）
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">テンプレートなし（空の日報を作成）</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.name} {t.projectName && `- ${t.projectName}`}
              </option>
            ))}
          </select>
        </div>

        {/* カレンダー */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {/* 月選択 */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 一括選択ボタン */}
          <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap gap-2">
            <button onClick={selectWeekdays} className="px-3 py-1.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">
              平日を選択
            </button>
            <button onClick={selectAll} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              全日選択
            </button>
            <button onClick={clearSelection} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
              選択解除
            </button>
            <span className="ml-auto text-sm text-gray-500 self-center">
              {selectedDates.size}日選択中
            </span>
          </div>

          {/* カレンダーグリッド */}
          <div className="p-4">
            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['日', '月', '火', '水', '木', '金', '土'].map((dow, i) => (
                <div key={dow} className={`text-center text-xs font-medium py-1 ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'
                }`}>
                  {dow}
                </div>
              ))}
            </div>

            {/* 日付 */}
            <div className="grid grid-cols-7 gap-1">
              {calendar.map((item, i) => {
                if (!item.date) {
                  return <div key={i} className="aspect-square" />
                }

                const dateStr = item.dateStr
                const existing = existingReports.get(dateStr)
                const isSelected = selectedDates.has(dateStr)
                const dow = item.date.getDay()
                const isToday = dateStr === new Date().toISOString().split('T')[0]

                return (
                  <button
                    key={i}
                    onClick={() => !existing && toggleDate(dateStr)}
                    disabled={!!existing}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all
                      ${existing
                        ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                        : isSelected
                          ? 'bg-indigo-600 text-white'
                          : dow === 0
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : dow === 6
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : 'hover:bg-gray-100 text-gray-700'
                      }
                      ${isToday && !existing && !isSelected ? 'ring-2 ring-indigo-400' : ''}
                    `}
                    title={existing ? `日報あり: ${existing.projectName}` : undefined}
                  >
                    <span>{item.date.getDate()}</span>
                    {existing && <span className="text-[10px]">済</span>}
                    {isSelected && <Check className="w-3 h-3 mt-0.5" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 凡例 */}
          <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center"><span className="w-3 h-3 rounded bg-blue-100 mr-1"></span>日報あり</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded bg-indigo-600 mr-1"></span>選択中</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded ring-2 ring-indigo-400 mr-1"></span>今日</span>
          </div>
        </div>

        {/* 作成ボタン */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleCreate}
            disabled={creating || selectedDates.size === 0}
            className="inline-flex items-center px-6 py-3 text-lg font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                作成中...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 mr-2" />
                {selectedDates.size}日分の日報を作成
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
