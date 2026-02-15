import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 一括日報作成
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { dates, template } = body

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: '日付の指定が必要です' }, { status: 400 })
    }

    if (dates.length > 31) {
      return NextResponse.json({ error: '一度に作成できるのは31日分までです' }, { status: 400 })
    }

    // 既存の日報を確認
    const existingReports = await prisma.workReport.findMany({
      where: {
        userId,
        date: {
          in: dates.map((d: string) => new Date(d)),
        },
      },
      select: { date: true },
    })

    const existingDates = existingReports.map(r => r.date.toISOString().split('T')[0])
    const newDates = dates.filter((d: string) => !existingDates.includes(d))

    if (newDates.length === 0) {
      return NextResponse.json({
        error: '指定された日付には既に日報が存在します',
        existingDates,
      }, { status: 400 })
    }

    // 一括作成
    const createdReports = []

    for (const dateStr of newDates) {
      const reportDate = new Date(dateStr)

      // 日報を作成
      const report = await prisma.workReport.create({
        data: {
          date: reportDate,
          userId,
          projectRefId: template?.projectRefId || null,
          projectName: template?.projectName || '',
          projectType: template?.projectType || null,
          weather: null,
          contactNotes: null,
          remoteDepartureTime: template?.remoteDepartureTime || null,
          remoteArrivalTime: template?.remoteArrivalTime || null,
          remoteDepartureTime2: template?.remoteDepartureTime2 || null,
          remoteArrivalTime2: template?.remoteArrivalTime2 || null,
          trafficGuardCount: template?.trafficGuardCount || null,
          trafficGuardStart: template?.trafficGuardStart || null,
          trafficGuardEnd: template?.trafficGuardEnd || null,
        },
      })

      // 作業者記録を追加
      if (template?.workerRecords && Array.isArray(template.workerRecords)) {
        for (let i = 0; i < template.workerRecords.length; i++) {
          const worker = template.workerRecords[i]
          await prisma.workerRecord.create({
            data: {
              workReportId: report.id,
              name: worker.name || '',
              startTime: worker.startTime || null,
              endTime: worker.endTime || null,
              workHours: worker.workHours || null,
              workType: worker.workType || null,
              details: worker.details || null,
              dailyHours: worker.dailyHours || null,
              totalHours: worker.totalHours || null,
              remainHours: worker.remainHours || null,
              order: i,
            },
          })
        }
      }

      // 材料記録を追加
      if (template?.materialRecords && Array.isArray(template.materialRecords)) {
        for (let i = 0; i < template.materialRecords.length; i++) {
          const material = template.materialRecords[i]
          await prisma.materialRecord.create({
            data: {
              workReportId: report.id,
              name: material.name || '',
              volume: material.volume || null,
              volumeUnit: material.volumeUnit || null,
              quantity: material.quantity || null,
              unitPrice: material.unitPrice || null,
              amount: material.amount || null,
              subcontractor: material.subcontractor || null,
              order: i,
            },
          })
        }
      }

      // 外注先記録を追加
      if (template?.subcontractorRecords && Array.isArray(template.subcontractorRecords)) {
        for (let i = 0; i < template.subcontractorRecords.length; i++) {
          const sub = template.subcontractorRecords[i]
          await prisma.subcontractorRecord.create({
            data: {
              workReportId: report.id,
              name: sub.name || '',
              workerCount: sub.workerCount || null,
              workContent: sub.workContent || null,
              order: i,
            },
          })
        }
      }

      createdReports.push(report)
    }

    return NextResponse.json({
      success: true,
      createdCount: createdReports.length,
      skippedCount: existingDates.length,
      skippedDates: existingDates,
      createdReports: createdReports.map(r => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
      })),
    })
  } catch (error) {
    console.error('一括日報作成エラー:', error)
    return NextResponse.json({ error: '一括日報の作成に失敗しました' }, { status: 500 })
  }
}

// 指定期間の日報存在チェック
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json({ error: '開始日と終了日の指定が必要です' }, { status: 400 })
    }

    const reports = await prisma.workReport.findMany({
      where: {
        userId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      select: {
        id: true,
        date: true,
        projectName: true,
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({
      reports: reports.map(r => ({
        id: r.id,
        date: r.date.toISOString().split('T')[0],
        projectName: r.projectName,
      })),
    })
  } catch (error) {
    console.error('日報チェックエラー:', error)
    return NextResponse.json({ error: '日報の確認に失敗しました' }, { status: 500 })
  }
}
