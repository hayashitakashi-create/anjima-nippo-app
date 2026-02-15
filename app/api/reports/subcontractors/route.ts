import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // 月の開始日と終了日を計算
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // 外注先記録を日報と一緒に取得
    const workReports = await prisma.workReport.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        subcontractorRecords: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // 外注先別集計
    const subcontractorSummary: Record<string, {
      name: string
      totalWorkerCount: number
      totalDays: number
      workContents: Set<string>
      projects: Set<string>
      dailyRecords: { date: string; workerCount: number; workContent: string }[]
    }> = {}

    // 日別集計（グラフ用）
    const dailyUsage: Record<string, {
      date: string
      totalWorkerCount: number
      subcontractors: Record<string, number>
    }> = {}

    workReports.forEach(report => {
      const dateKey = report.date.toISOString().split('T')[0]

      if (!dailyUsage[dateKey]) {
        dailyUsage[dateKey] = {
          date: dateKey,
          totalWorkerCount: 0,
          subcontractors: {},
        }
      }

      report.subcontractorRecords.forEach(sub => {
        if (!sub.name) return

        const subKey = sub.name

        // 外注先別集計
        if (!subcontractorSummary[subKey]) {
          subcontractorSummary[subKey] = {
            name: sub.name,
            totalWorkerCount: 0,
            totalDays: 0,
            workContents: new Set(),
            projects: new Set(),
            dailyRecords: [],
          }
        }

        const workerCount = sub.workerCount || 0

        subcontractorSummary[subKey].totalWorkerCount += workerCount
        subcontractorSummary[subKey].totalDays++
        if (sub.workContent) {
          subcontractorSummary[subKey].workContents.add(sub.workContent)
        }
        subcontractorSummary[subKey].projects.add(report.projectName || '未設定')
        subcontractorSummary[subKey].dailyRecords.push({
          date: dateKey,
          workerCount,
          workContent: sub.workContent || '',
        })

        // 日別集計
        dailyUsage[dateKey].totalWorkerCount += workerCount
        dailyUsage[dateKey].subcontractors[subKey] =
          (dailyUsage[dateKey].subcontractors[subKey] || 0) + workerCount
      })
    })

    // データを整形
    const subcontractorData = Object.values(subcontractorSummary).map(s => ({
      name: s.name,
      totalWorkerCount: s.totalWorkerCount,
      totalDays: s.totalDays,
      avgWorkerPerDay: s.totalDays > 0 ? Math.round((s.totalWorkerCount / s.totalDays) * 10) / 10 : 0,
      workContents: Array.from(s.workContents),
      projectCount: s.projects.size,
      projects: Array.from(s.projects),
    })).sort((a, b) => b.totalWorkerCount - a.totalWorkerCount)

    // 日別データを配列に変換
    const dailyData = Object.values(dailyUsage).sort((a, b) => a.date.localeCompare(b.date))

    // 全体集計
    const totalSummary = {
      totalSubcontractors: subcontractorData.length,
      totalWorkerCount: subcontractorData.reduce((sum, s) => sum + s.totalWorkerCount, 0),
      totalDays: subcontractorData.reduce((sum, s) => sum + s.totalDays, 0),
      avgWorkerPerDay: dailyData.length > 0
        ? Math.round((subcontractorData.reduce((sum, s) => sum + s.totalWorkerCount, 0) / dailyData.filter(d => d.totalWorkerCount > 0).length) * 10) / 10
        : 0,
    }

    return NextResponse.json({
      year,
      month,
      totalSummary,
      subcontractorData,
      dailyData,
    })
  } catch (error) {
    console.error('外注先レポート取得エラー:', error)
    return NextResponse.json({ error: 'レポートの取得に失敗しました' }, { status: 500 })
  }
}
