import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DailyReportInput } from '@/lib/types'
import { notifyReportSubmitted } from '@/lib/notifications'
import { requireAuth, authErrorResponse } from '@/lib/auth'

// 日報一覧を取得（ページネーション対応）
export async function GET(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // ページネーション
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const skip = (page - 1) * limit

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

    // 総件数と一覧を並列取得
    const [total, dailyReports] = await Promise.all([
      prisma.dailyReport.count({ where }),
      prisma.dailyReport.findMany({
        where,
        skip,
        take: limit,
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
      }),
    ])

    return NextResponse.json({
      reports: dailyReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
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
    // JWT認証
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()
    // 認証ユーザーのIDを使用（なりすまし防止）
    body.userId = authResult.user.id

    const dailyReport = await prisma.dailyReport.create({
      data: {
        date: new Date(body.date),
        userId: body.userId,
        specialNotes: body.specialNotes,
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
          create: [
            { approverRole: '上長', status: 'pending', },
            { approverRole: '常務', status: 'pending', },
            { approverRole: '専務', status: 'pending', },
            { approverRole: '社長', status: 'pending', },
          ],
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
