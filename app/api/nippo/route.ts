import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DailyReportInput } from '@/lib/types'

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
    const body: DailyReportInput = await request.json()

    const dailyReport = await prisma.dailyReport.create({
      data: {
        date: new Date(body.date),
        userId: body.userId,
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
        approvals: {
          create: [
            { approverRole: '社長', status: 'pending' },
            { approverRole: '専務', status: 'pending' },
            { approverRole: '常務', status: 'pending' },
            { approverRole: '部長', status: 'pending' },
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
      },
    })

    return NextResponse.json(dailyReport, { status: 201 })
  } catch (error) {
    console.error('日報作成エラー:', error)
    return NextResponse.json(
      { error: '日報の作成に失敗しました' },
      { status: 500 }
    )
  }
}
