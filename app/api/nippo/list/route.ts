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

    // 検索パラメータ取得
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('keyword')?.trim() || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // where条件を構築
    const where: any = { userId }

    // 期間フィルター
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.date.lte = end
      }
    }

    // キーワード検索（訪問先、営業内容、面接者、特記事項）
    if (keyword) {
      where.OR = [
        { specialNotes: { contains: keyword } },
        {
          visitRecords: {
            some: {
              OR: [
                { destination: { contains: keyword } },
                { content: { contains: keyword } },
                { contactPerson: { contains: keyword } },
              ]
            }
          }
        }
      ]
    }

    // ユーザーの日報一覧を取得（新しい順）
    const reports = await prisma.dailyReport.findMany({
      where,
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
