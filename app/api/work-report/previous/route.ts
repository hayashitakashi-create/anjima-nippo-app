import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 前日の作業日報を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const currentDate = searchParams.get('date')
    const projectRefId = searchParams.get('projectRefId')

    if (!userId || !currentDate) {
      return NextResponse.json(
        { error: 'userId と date は必須です' },
        { status: 400 }
      )
    }

    // 現在の日付より前の最新の日報を取得
    const where: any = {
      userId,
      date: {
        lt: new Date(currentDate + 'T23:59:59.999Z'),
      },
    }

    // 物件IDがある場合はその物件に限定
    if (projectRefId) {
      where.projectRefId = projectRefId
    }

    const previousReport = await prisma.workReport.findFirst({
      where,
      include: {
        workerRecords: {
          orderBy: {
            order: 'asc',
          },
        },
        materialRecords: {
          orderBy: {
            order: 'asc',
          },
        },
        subcontractorRecords: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    if (!previousReport) {
      return NextResponse.json(null)
    }

    return NextResponse.json(previousReport)
  } catch (error) {
    console.error('前日日報取得エラー:', error)
    return NextResponse.json(
      { error: '前日の日報取得に失敗しました' },
      { status: 500 }
    )
  }
}
