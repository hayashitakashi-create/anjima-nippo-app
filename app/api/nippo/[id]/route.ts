import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { DailyReportInput } from '@/lib/types'

// 日報詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const userId = user.id
    const { id } = await params

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            position: true,
          }
        },
        visitRecords: {
          orderBy: { order: 'asc' }
        },
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                position: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!report) {
      return NextResponse.json(
        { error: '日報が見つかりません' },
        { status: 404 }
      )
    }

    // 自分の日報か閲覧権限があるか確認
    if (report.userId !== userId) {
      const permissions = await getUserPermissions(user.role)
      if (!permissions.view_all_reports) {
        return NextResponse.json(
          { error: 'この日報にアクセスする権限がありません' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('日報取得エラー:', error)
    return NextResponse.json(
      { error: '日報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 日報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const userId = user.id
    const { id } = await params
    const body: DailyReportInput = await request.json()

    // 既存の日報を確認
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id }
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: '日報が見つかりません' },
        { status: 404 }
      )
    }

    if (existingReport.userId !== userId) {
      return NextResponse.json(
        { error: 'この日報を更新する権限がありません' },
        { status: 403 }
      )
    }

    // 既存の訪問記録を削除して新しいものを作成
    await prisma.visitRecord.deleteMany({
      where: { dailyReportId: id }
    })

    const updatedReport = await prisma.dailyReport.update({
      where: { id },
      data: {
        date: new Date(body.date),
        specialNotes: body.specialNotes,
        visitRecords: {
          create: body.visitRecords.map((record) => ({
            destination: record.destination,
            contactPerson: record.contactPerson,
            startTime: record.startTime,
            endTime: record.endTime,
            content: record.content,
            expense: record.expense,
            order: record.order,
          })),
        },
      },
      include: {
        user: {
          select: {
            name: true,
            position: true,
          }
        },
        visitRecords: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('日報更新エラー:', error)
    return NextResponse.json(
      { error: '日報の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 日報削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const userId = user.id
    const { id } = await params

    const existingReport = await prisma.dailyReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: '日報が見つかりません' },
        { status: 404 }
      )
    }

    // 本人または編集権限のあるユーザーのみ削除可能
    if (existingReport.userId !== userId) {
      const permissions = await getUserPermissions(user.role)
      if (!permissions.edit_all_reports) {
        return NextResponse.json(
          { error: 'この日報を削除する権限がありません' },
          { status: 403 }
        )
      }
    }

    // onDelete: Cascade により訪問記録・承認レコードも自動削除
    await prisma.dailyReport.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: '日報を削除しました' })
  } catch (error) {
    console.error('日報削除エラー:', error)
    return NextResponse.json(
      { error: '日報の削除に失敗しました' },
      { status: 500 }
    )
  }
}
