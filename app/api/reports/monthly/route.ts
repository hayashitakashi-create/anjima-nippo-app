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

    // 日報データを取得
    const workReports = await prisma.workReport.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        workerRecords: true,
        materialRecords: true,
        subcontractorRecords: true,
        project: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // 物件別集計
    const projectSummary: Record<string, {
      projectName: string
      projectType: string
      totalManHours: number
      totalDailyHours: number
      workerCount: number
      reportCount: number
      workers: Set<string>
    }> = {}

    // 作業者別集計
    const workerSummary: Record<string, {
      name: string
      totalManHours: number
      totalDailyHours: number
      projectCount: number
      reportCount: number
      projects: Set<string>
    }> = {}

    workReports.forEach(report => {
      const projectKey = report.projectName || '未設定'

      if (!projectSummary[projectKey]) {
        projectSummary[projectKey] = {
          projectName: report.projectName || '未設定',
          projectType: report.projectType || '',
          totalManHours: 0,
          totalDailyHours: 0,
          workerCount: 0,
          reportCount: 0,
          workers: new Set(),
        }
      }

      projectSummary[projectKey].reportCount++

      report.workerRecords.forEach(worker => {
        // 物件別集計に追加
        projectSummary[projectKey].totalManHours += worker.workHours || 0
        projectSummary[projectKey].totalDailyHours += worker.dailyHours || 0
        if (worker.name) {
          projectSummary[projectKey].workers.add(worker.name)
        }

        // 作業者別集計
        if (worker.name) {
          if (!workerSummary[worker.name]) {
            workerSummary[worker.name] = {
              name: worker.name,
              totalManHours: 0,
              totalDailyHours: 0,
              projectCount: 0,
              reportCount: 0,
              projects: new Set(),
            }
          }
          workerSummary[worker.name].totalManHours += worker.workHours || 0
          workerSummary[worker.name].totalDailyHours += worker.dailyHours || 0
          workerSummary[worker.name].reportCount++
          workerSummary[worker.name].projects.add(projectKey)
        }
      })
    })

    // Set をカウントに変換
    const projectData = Object.values(projectSummary).map(p => ({
      ...p,
      workerCount: p.workers.size,
      workers: undefined,
    })).sort((a, b) => b.totalManHours - a.totalManHours)

    const workerData = Object.values(workerSummary).map(w => ({
      ...w,
      projectCount: w.projects.size,
      projects: undefined,
    })).sort((a, b) => b.totalManHours - a.totalManHours)

    // 全体集計
    const totalSummary = {
      totalReports: workReports.length,
      totalManHours: projectData.reduce((sum, p) => sum + p.totalManHours, 0),
      totalDailyHours: projectData.reduce((sum, p) => sum + p.totalDailyHours, 0),
      totalProjects: projectData.length,
      totalWorkers: workerData.length,
    }

    return NextResponse.json({
      year,
      month,
      totalSummary,
      projectData,
      workerData,
    })
  } catch (error) {
    console.error('月次レポート取得エラー:', error)
    return NextResponse.json({ error: 'レポートの取得に失敗しました' }, { status: 500 })
  }
}
