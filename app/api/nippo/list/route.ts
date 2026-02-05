import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    // ユーザーの日報一覧を取得（新しい順）
    const reports = await prisma.dailyReport.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
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
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('日報一覧取得エラー:', error)
    return NextResponse.json(
      { error: '日報一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}
