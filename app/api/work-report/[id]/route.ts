import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { WorkReportInput } from '../route'

// 管理者チェック
async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })
  return user?.role === 'admin'
}

// 作業日報の個別取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const { id } = await params

    const report = await prisma.workReport.findUnique({
      where: { id },
      include: {
        workerRecords: {
          orderBy: { order: 'asc' },
        },
        materialRecords: {
          orderBy: { order: 'asc' },
        },
        subcontractorRecords: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: '作業日報が見つかりません' },
        { status: 404 }
      )
    }

    // 自分の日報か確認
    if (report.userId !== userId) {
      return NextResponse.json(
        { error: 'この作業日報にアクセスする権限がありません' },
        { status: 403 }
      )
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('作業日報取得エラー:', error)
    return NextResponse.json(
      { error: '作業日報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 作業日報の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body: WorkReportInput = await request.json()

    // 既存の日報を確認
    const existingReport = await prisma.workReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: '作業日報が見つかりません' },
        { status: 404 }
      )
    }

    if (existingReport.userId !== userId) {
      return NextResponse.json(
        { error: 'この作業日報を更新する権限がありません' },
        { status: 403 }
      )
    }

    // 既存の子レコードを削除
    await Promise.all([
      prisma.workerRecord.deleteMany({ where: { workReportId: id } }),
      prisma.materialRecord.deleteMany({ where: { workReportId: id } }),
      prisma.subcontractorRecord.deleteMany({ where: { workReportId: id } }),
    ])

    // 日報を更新（子レコードも再作成）
    const updatedReport = await prisma.workReport.update({
      where: { id },
      data: {
        date: new Date(body.date),
        projectName: body.projectName,
        projectType: body.projectType,
        projectId: body.projectId,
        weather: body.weather,
        contactNotes: body.contactNotes,
        remoteDepartureTime: body.remoteDepartureTime,
        remoteArrivalTime: body.remoteArrivalTime,
        remoteDepartureTime2: body.remoteDepartureTime2,
        remoteArrivalTime2: body.remoteArrivalTime2,
        trafficGuardCount: body.trafficGuardCount,
        trafficGuardStart: body.trafficGuardStart,
        trafficGuardEnd: body.trafficGuardEnd,
        workerRecords: {
          create: body.workerRecords.map((record) => ({
            name: record.name,
            startTime: record.startTime,
            endTime: record.endTime,
            workHours: record.workHours,
            workType: record.workType,
            details: record.details,
            dailyHours: record.dailyHours,
            totalHours: record.totalHours,
            remainHours: record.remainHours,
            order: record.order,
          })),
        },
        materialRecords: {
          create: body.materialRecords.map((record) => ({
            name: record.name,
            volume: record.volume,
            volumeUnit: record.volumeUnit,
            quantity: record.quantity,
            unitPrice: record.unitPrice,
            amount: record.amount,
            subcontractor: record.subcontractor,
            order: record.order,
          })),
        },
        subcontractorRecords: {
          create: (body.subcontractorRecords || []).map((record) => ({
            name: record.name,
            workerCount: record.workerCount,
            workContent: record.workContent,
            order: record.order,
          })),
        },
      },
      include: {
        workerRecords: {
          orderBy: { order: 'asc' },
        },
        materialRecords: {
          orderBy: { order: 'asc' },
        },
        subcontractorRecords: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('作業日報更新エラー:', error)
    return NextResponse.json(
      { error: '作業日報の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 作業日報の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const { id } = await params

    const existingReport = await prisma.workReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: '作業日報が見つかりません' },
        { status: 404 }
      )
    }

    // 本人または管理者のみ削除可能
    const admin = await isAdmin(userId)
    if (existingReport.userId !== userId && !admin) {
      return NextResponse.json(
        { error: 'この作業日報を削除する権限がありません' },
        { status: 403 }
      )
    }

    // onDelete: Cascade により子レコードも自動削除
    await prisma.workReport.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: '作業日報を削除しました' })
  } catch (error) {
    console.error('作業日報削除エラー:', error)
    return NextResponse.json(
      { error: '作業日報の削除に失敗しました' },
      { status: 500 }
    )
  }
}
