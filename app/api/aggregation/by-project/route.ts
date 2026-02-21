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

// 現場別月次集計API（21日～翌月20日）
export async function GET(request: NextRequest) {
  try {
    // JWT認証（管理者のみ）
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // 21日～20日の期間計算
    const period = calculatePeriod(offset)
    const periodStart = period.start
    const periodEnd = period.end

    // 期間内の全作業日報を取得
    const workReports = await prisma.workReport.findMany({
      where: {
        date: { gte: periodStart, lte: periodEnd },
      },
      include: {
        workerRecords: { orderBy: { order: 'asc' } },
        materialRecords: { orderBy: { order: 'asc' } },
        subcontractorRecords: { orderBy: { order: 'asc' } },
      },
      orderBy: { date: 'asc' },
    })

    // projectRefId（fallback: projectName）でグルーピング
    const projectGroups = new Map<string, {
      projectRefId: string
      projectName: string
      projectType: string
      projectCode: string
      reports: typeof workReports
    }>()

    workReports.forEach(report => {
      const key = report.projectRefId || report.projectName || '（未設定）'
      if (!projectGroups.has(key)) {
        projectGroups.set(key, {
          projectRefId: report.projectRefId || '',
          projectName: report.projectName || '（未設定）',
          projectType: report.projectType || '',
          projectCode: report.projectId || '',
          reports: [],
        })
      }
      projectGroups.get(key)!.reports.push(report)
    })

    // 各プロジェクトグループごとに集計
    const projects = Array.from(projectGroups.values()).map(group => {
      // ① 労働時間集計
      const laborMap = new Map<string, LaborEntry>()

      group.reports.forEach(report => {
        const reportDate = new Date(report.date)
        const isSunday = reportDate.getDay() === 0

        const travelMins = calcTravelMinutes(
          report.remoteDepartureTime,
          report.remoteArrivalTime,
          report.remoteDepartureTime2,
          report.remoteArrivalTime2
        )

        report.workerRecords.forEach(worker => {
          if (!worker.name || worker.name.trim() === '') return
          const workerName = worker.name.trim()

          if (!laborMap.has(workerName)) {
            laborMap.set(workerName, {
              name: workerName,
              weekdayNormal: 0, weekdayOvertime: 0, weekdayLateNight: 0, weekdaySubtotal: 0,
              sundayNormal: 0, sundayOvertime: 0, sundayLateNight: 0, sundaySubtotal: 0,
              total: 0, travelMinutes: 0,
            })
          }

          const entry = laborMap.get(workerName)!

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
            const hours = (worker.workHours || worker.dailyHours || 0) * 60

            if (isSunday) {
              entry.sundayNormal += hours
              entry.sundaySubtotal += hours
            } else {
              entry.weekdayNormal += hours
              entry.weekdaySubtotal += hours
            }

            entry.total += hours
          }

          const workerCountInReport = report.workerRecords.filter(w => w.name && w.name.trim() !== '').length
          if (workerCountInReport > 0 && travelMins > 0) {
            entry.travelMinutes += travelMins / workerCountInReport
          }
        })
      })

      const labor = Array.from(laborMap.values())
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

      group.reports.forEach(report => {
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

      const materials = Array.from(materialMap.values())
        .sort((a, b) => a.name.localeCompare(b.name, 'ja'))

      // ③ 外注集計
      const subcontractorMap = new Map<string, {
        name: string
        totalWorkerCount: number
        totalDays: number
        dates: Set<string>
      }>()

      group.reports.forEach(report => {
        const dateKey = new Date(report.date).toISOString().split('T')[0]
        report.subcontractorRecords.forEach(sub => {
          if (!sub.name || sub.name.trim() === '') return
          const subName = sub.name.trim()
          if (!subcontractorMap.has(subName)) {
            subcontractorMap.set(subName, {
              name: subName,
              totalWorkerCount: 0,
              totalDays: 0,
              dates: new Set(),
            })
          }
          const entry = subcontractorMap.get(subName)!
          entry.totalWorkerCount += sub.workerCount || 0
          if (!entry.dates.has(dateKey)) {
            entry.dates.add(dateKey)
            entry.totalDays += 1
          }
        })
      })

      const subcontractors = Array.from(subcontractorMap.values())
        .map(({ name, totalWorkerCount, totalDays }) => ({ name, totalWorkerCount, totalDays }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ja'))

      const totalLaborHours = labor.reduce((sum, l) => sum + l.total, 0)
      const totalMaterialAmount = materials.reduce((sum, m) => sum + m.totalAmount, 0)
      const totalSubcontractorCount = subcontractors.reduce((sum, s) => sum + s.totalWorkerCount, 0)

      return {
        projectRefId: group.projectRefId,
        projectName: group.projectName,
        projectType: group.projectType,
        projectCode: group.projectCode,
        reportCount: group.reports.length,
        labor,
        materials,
        subcontractors,
        totals: {
          laborHours: totalLaborHours,
          materialAmount: totalMaterialAmount,
          subcontractorCount: totalSubcontractorCount,
        },
      }
    }).sort((a, b) => a.projectName.localeCompare(b.projectName, 'ja'))

    // 全体合計
    const grandTotals = {
      laborHours: projects.reduce((sum, p) => sum + p.totals.laborHours, 0),
      materialAmount: projects.reduce((sum, p) => sum + p.totals.materialAmount, 0),
      subcontractorCount: projects.reduce((sum, p) => sum + p.totals.subcontractorCount, 0),
    }

    return NextResponse.json({
      period: {
        start: periodStart.toISOString(),
        end: periodEnd.toISOString(),
        label: period.label,
      },
      projects,
      grandTotals,
    })
  } catch (error) {
    console.error('現場別集計エラー:', error)
    return NextResponse.json(
      { error: '現場別集計データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
