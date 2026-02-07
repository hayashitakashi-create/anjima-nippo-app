import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, authErrorResponse } from '@/lib/auth'

/**
 * 時刻文字列 "HH:MM" を分(minutes)に変換
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/**
 * 2つの時間範囲の重複部分を分で返す
 * [start1, end1] と [start2, end2] の重複（分単位）
 */
function overlapMinutes(s1: number, e1: number, s2: number, e2: number): number {
  const start = Math.max(s1, e1 > s1 ? s1 : s1, s2)
  const end = Math.min(e1, e2)
  const overlapStart = Math.max(s1, s2)
  const overlapEnd = Math.min(e1, e2)
  return Math.max(0, overlapEnd - overlapStart)
}

/**
 * 勤務時間を時間帯別に分類する
 * startTime, endTime: "HH:MM" 形式
 *
 * 返り値: { normal: 分, overtime: 分, lateNight: 分 }
 * - normal: 8:00~17:00 の範囲内の時間
 * - overtime: 8:00~17:00 外の時間（深夜除く）
 * - lateNight: 22:00~5:00 の時間（overtimeに含まれる分から抽出）
 */
function classifyWorkHours(startTime: string, endTime: string): {
  normal: number    // 8:00~17:00 の分
  overtime: number  // 8:00~17:00外（深夜除く）の分
  lateNight: number // 22:00~5:00 の分
} {
  const start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)

  // endがstartより小さい場合は翌日扱い（例: 22:00 ~ 2:00）
  if (end <= start) {
    end += 24 * 60
  }

  const totalMinutes = end - start
  if (totalMinutes <= 0) return { normal: 0, overtime: 0, lateNight: 0 }

  // 通常時間帯: 8:00(480) ~ 17:00(1020)
  const normalStart = 8 * 60  // 480
  const normalEnd = 17 * 60   // 1020

  // 深夜時間帯: 22:00(1320) ~ 29:00(1740=翌5:00)
  // と 0:00(0) ~ 5:00(300)
  const lateNightStart1 = 22 * 60  // 1320
  const lateNightEnd1 = 29 * 60    // 1740 (翌5:00)
  const lateNightStart2 = 0
  const lateNightEnd2 = 5 * 60     // 300

  // 通常時間（8:00~17:00の重複）
  const normal = overlapMinutes(start, end, normalStart, normalEnd)

  // 深夜時間（22:00~翌5:00の重複）
  let lateNight = overlapMinutes(start, end, lateNightStart1, lateNightEnd1)
  // 日をまたがない場合の 0:00~5:00 もチェック
  lateNight += overlapMinutes(start, end, lateNightStart2, lateNightEnd2)

  // 時間外 = 合計 - 通常 - 深夜
  const overtime = Math.max(0, totalMinutes - normal - lateNight)

  return { normal, overtime, lateNight }
}

/**
 * 移動時間を計算（分）
 * remoteDepartureTime → remoteArrivalTime : 行きの移動
 * remoteDepartureTime2 → remoteArrivalTime2 : 帰りの移動
 */
function calcTravelMinutes(
  dep1: string | null,
  arr1: string | null,
  dep2: string | null,
  arr2: string | null
): number {
  let total = 0
  if (dep1 && arr1) {
    const d = timeToMinutes(dep1)
    const a = timeToMinutes(arr1)
    if (a > d) total += a - d
  }
  if (dep2 && arr2) {
    const d = timeToMinutes(dep2)
    const a = timeToMinutes(arr2)
    if (a > d) total += a - d
  }
  return total
}

// 月次集計API（21日～翌月20日）
export async function GET(request: NextRequest) {
  try {
    // JWT認証（管理者のみ）
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const projectFilter = searchParams.get('projectRefId') || ''

    // 21日～20日の期間計算
    const now = new Date()
    const currentDay = now.getDate()

    let basePeriodStart: Date
    if (currentDay >= 21) {
      basePeriodStart = new Date(now.getFullYear(), now.getMonth(), 21)
    } else {
      basePeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 21)
    }

    const periodStart = new Date(
      basePeriodStart.getFullYear(),
      basePeriodStart.getMonth() + offset,
      21
    )
    const periodEnd = new Date(
      periodStart.getFullYear(),
      periodStart.getMonth() + 1,
      20,
      23, 59, 59, 999
    )

    // 作業日報のwhere条件
    const reportWhere: any = {
      date: { gte: periodStart, lte: periodEnd },
    }
    if (projectFilter) {
      reportWhere.projectRefId = projectFilter
    }

    // 並列クエリ
    const [workReports, projects] = await Promise.all([
      prisma.workReport.findMany({
        where: reportWhere,
        include: {
          workerRecords: { orderBy: { order: 'asc' } },
          materialRecords: { orderBy: { order: 'asc' } },
          subcontractorRecords: { orderBy: { order: 'asc' } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.project.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ])

    // ① 労働時間集計: 作業員名でグループ化、曜日・時間帯別
    interface LaborEntry {
      name: string
      // 月曜〜土曜
      weekdayNormal: number      // 8:00~17:00 (分)
      weekdayOvertime: number    // 8:00~17:00外 (分)
      weekdayLateNight: number   // うち22:00~5:00 (分)
      weekdaySubtotal: number    // 小計 (分)
      // 日曜
      sundayNormal: number
      sundayOvertime: number
      sundayLateNight: number
      sundaySubtotal: number
      // 合計・移動
      total: number              // 合計 (分)
      travelMinutes: number      // 移動時間 (分)
    }

    const laborMap = new Map<string, LaborEntry>()

    workReports.forEach(report => {
      const reportDate = new Date(report.date)
      const dayOfWeek = reportDate.getDay() // 0=日, 1=月, ..., 6=土
      const isSunday = dayOfWeek === 0

      // 移動時間（日報単位）
      const travelMins = calcTravelMinutes(
        report.remoteDepartureTime,
        report.remoteArrivalTime,
        report.remoteDepartureTime2,
        report.remoteArrivalTime2
      )

      report.workerRecords.forEach(worker => {
        if (!worker.name || worker.name.trim() === '') return
        const key = worker.name.trim()

        if (!laborMap.has(key)) {
          laborMap.set(key, {
            name: key,
            weekdayNormal: 0, weekdayOvertime: 0, weekdayLateNight: 0, weekdaySubtotal: 0,
            sundayNormal: 0, sundayOvertime: 0, sundayLateNight: 0, sundaySubtotal: 0,
            total: 0, travelMinutes: 0,
          })
        }

        const entry = laborMap.get(key)!

        // startTime/endTimeがあれば時間帯分類
        if (worker.startTime && worker.endTime) {
          const { normal, overtime, lateNight } = classifyWorkHours(worker.startTime, worker.endTime)
          const subtotal = normal + overtime + lateNight

          if (isSunday) {
            entry.sundayNormal += normal
            entry.sundayOvertime += overtime
            entry.sundayLateNight += lateNight
            entry.sundaySubtotal += subtotal
          } else {
            entry.weekdayNormal += normal
            entry.weekdayOvertime += overtime
            entry.weekdayLateNight += lateNight
            entry.weekdaySubtotal += subtotal
          }

          entry.total += subtotal
        } else if (worker.workHours || worker.dailyHours) {
          // startTime/endTimeがない場合はworkHoursをそのまま通常時間に加算
          const hours = (worker.workHours || worker.dailyHours || 0) * 60 // 時間→分

          if (isSunday) {
            entry.sundayNormal += hours
            entry.sundaySubtotal += hours
          } else {
            entry.weekdayNormal += hours
            entry.weekdaySubtotal += hours
          }

          entry.total += hours
        }

        // 移動時間は作業員に均等割り（日報単位なので作業員数で割る）
        const workerCountInReport = report.workerRecords.filter(w => w.name && w.name.trim() !== '').length
        if (workerCountInReport > 0 && travelMins > 0) {
          entry.travelMinutes += travelMins / workerCountInReport
        }
      })
    })

    // 分→時間（小数2桁）に変換
    const minutesToHours = (mins: number) => parseFloat((mins / 60).toFixed(2))

    const laborSummary = Array.from(laborMap.values())
      .map(entry => ({
        name: entry.name,
        weekdayNormal: minutesToHours(entry.weekdayNormal),
        weekdayOvertime: minutesToHours(entry.weekdayOvertime),
        weekdayLateNight: minutesToHours(entry.weekdayLateNight),
        weekdaySubtotal: minutesToHours(entry.weekdaySubtotal),
        sundayNormal: minutesToHours(entry.sundayNormal),
        sundayOvertime: minutesToHours(entry.sundayOvertime),
        sundayLateNight: minutesToHours(entry.sundayLateNight),
        sundaySubtotal: minutesToHours(entry.sundaySubtotal),
        total: minutesToHours(entry.total),
        travelTime: minutesToHours(entry.travelMinutes),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'))

    // ② 材料集計
    const materialMap = new Map<string, {
      name: string
      volume: string
      volumeUnit: string
      unitPrice: number
      totalQuantity: number
      totalAmount: number
    }>()

    workReports.forEach(report => {
      report.materialRecords.forEach(mat => {
        if (!mat.name || mat.name.trim() === '') return
        const vol = mat.volume || ''
        const volUnit = mat.volumeUnit || ''
        const price = mat.unitPrice || 0
        const key = `${mat.name.trim()}|${vol}|${volUnit}|${price}`
        if (!materialMap.has(key)) {
          materialMap.set(key, {
            name: mat.name.trim(),
            volume: vol,
            volumeUnit: volUnit,
            unitPrice: price,
            totalQuantity: 0,
            totalAmount: 0,
          })
        }
        const entry = materialMap.get(key)!
        entry.totalQuantity += mat.quantity || 0
        entry.totalAmount += mat.amount || 0
      })
    })

    const materialSummary = Array.from(materialMap.values())
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'))

    // ③ 外注集計
    const subcontractorMap = new Map<string, {
      name: string
      totalWorkerCount: number
      totalDays: number
      dates: Set<string>
    }>()

    workReports.forEach(report => {
      const dateKey = new Date(report.date).toISOString().split('T')[0]
      report.subcontractorRecords.forEach(sub => {
        if (!sub.name || sub.name.trim() === '') return
        const key = sub.name.trim()
        if (!subcontractorMap.has(key)) {
          subcontractorMap.set(key, {
            name: key,
            totalWorkerCount: 0,
            totalDays: 0,
            dates: new Set(),
          })
        }
        const entry = subcontractorMap.get(key)!
        entry.totalWorkerCount += sub.workerCount || 0
        if (!entry.dates.has(dateKey)) {
          entry.dates.add(dateKey)
          entry.totalDays += 1
        }
      })
    })

    const subcontractorSummary = Array.from(subcontractorMap.values())
      .map(({ name, totalWorkerCount, totalDays }) => ({ name, totalWorkerCount, totalDays }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ja'))

    // 期間表示用
    const periodLabel = `${periodStart.getFullYear()}/${periodStart.getMonth() + 1}/${periodStart.getDate()} - ${periodEnd.getFullYear()}/${periodEnd.getMonth() + 1}/${periodEnd.getDate()}`

    return NextResponse.json({
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        label: periodLabel,
      },
      reportCount: workReports.length,
      labor: laborSummary,
      materials: materialSummary,
      subcontractors: subcontractorSummary,
      projects,
      totals: {
        laborHours: laborSummary.reduce((sum, l) => sum + l.total, 0),
        materialAmount: materialSummary.reduce((sum, m) => sum + m.totalAmount, 0),
        subcontractorCount: subcontractorSummary.reduce((sum, s) => sum + s.totalWorkerCount, 0),
      },
    })
  } catch (error) {
    console.error('集計エラー:', error)
    return NextResponse.json(
      { error: '集計データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
