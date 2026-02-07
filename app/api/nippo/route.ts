import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DailyReportInput } from '@/lib/types'
import { notifyReportSubmitted } from '@/lib/notifications'

// 日報一覧を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const dailyReports = await prisma.dailyReport.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        visitRecords: {
          orderBy: {
            order: 'asc',
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                position: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    return NextResponse.json(dailyReports)
  } catch (error) {
    console.error('日報取得エラー:', error)
    return NextResponse.json(
      { error: '日報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 日報を作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { approvalRouteId } = body as { approvalRouteId?: string } & DailyReportInput

    // 承認ルートから承認者役職リストを取得
    let approvalRoles: string[] = []
    let routeId: string | undefined = undefined

    if (approvalRouteId) {
      // 指定されたルートを使用
      const route = await prisma.approvalRoute.findUnique({
        where: { id: approvalRouteId },
      })
      if (route && route.isActive) {
        approvalRoles = JSON.parse(route.roles)
        routeId = route.id
      }
    }

    if (approvalRoles.length === 0) {
      // デフォルトルートを検索
      const defaultRoute = await prisma.approvalRoute.findFirst({
        where: { isDefault: true, isActive: true },
      })
      if (defaultRoute) {
        approvalRoles = JSON.parse(defaultRoute.roles)
        routeId = defaultRoute.id
      }
    }

    if (approvalRoles.length === 0) {
      // ルートが一つもない場合、最初の有効ルートを使用
      const firstRoute = await prisma.approvalRoute.findFirst({
        where: { isActive: true },
        orderBy: { order: 'asc' },
      })
      if (firstRoute) {
        approvalRoles = JSON.parse(firstRoute.roles)
        routeId = firstRoute.id
      }
    }

    if (approvalRoles.length === 0) {
      // フォールバック: ハードコード
      approvalRoles = ['社長', '専務', '常務', '部長']
    }

    const dailyReport = await prisma.dailyReport.create({
      data: {
        date: new Date(body.date),
        userId: body.userId,
        specialNotes: body.specialNotes,
        approvalRouteId: routeId || null,
        visitRecords: {
          create: body.visitRecords.map((record: any) => ({
            destination: record.destination,
            contactPerson: record.contactPerson,
            startTime: record.startTime,
            endTime: record.endTime,
            content: record.content,
            expense: record.expense,
            order: record.order,
          })),
        },
        approvals: {
          create: approvalRoles.map(role => ({
            approverRole: role,
            status: 'pending',
          })),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        visitRecords: {
          orderBy: {
            order: 'asc',
          },
        },
        approvals: true,
        approvalRoute: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // 通知: 管理者に日報提出を通知（非同期・エラーは握りつぶす）
    const reportDate = new Date(body.date)
    const dateStr = `${reportDate.getMonth() + 1}月${reportDate.getDate()}日`
    notifyReportSubmitted(
      dailyReport.user.name,
      dateStr,
      dailyReport.id,
      'sales'
    ).catch(() => {})

    return NextResponse.json(dailyReport, { status: 201 })
  } catch (error) {
    console.error('日報作成エラー:', error)
    return NextResponse.json(
      { error: '日報の作成に失敗しました' },
      { status: 500 }
    )
  }
}
