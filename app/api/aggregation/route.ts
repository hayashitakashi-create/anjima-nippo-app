import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, authErrorResponse } from '@/lib/auth'
import {
  classifyWorkHours,
  calcTravelMinutes,
  minutesToHours,
  calculatePeriod,
  type LaborEntry,
} from '@/lib/aggregation-utils'

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
    const period = calculatePeriod(offset)
    const periodStart = period.start
    const periodEnd = period.end

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

    return NextResponse.json({
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        label: period.label,
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
