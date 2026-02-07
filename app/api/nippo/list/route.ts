import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // JWT認証に移行
    const authUser = await getAuthFromRequest(request)
    if (!authUser) {
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

    // ページネーションパラメータ
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100) // 最大100件
    const skip = (page - 1) * limit

    // where条件を構築
    const where: any = { userId: authUser.id }

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

    // 総件数を取得（並列実行）
    const [total, reports] = await Promise.all([
      prisma.dailyReport.count({ where }),
      prisma.dailyReport.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
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
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    })
  } catch (error) {
    console.error('日報一覧取得エラー:', error)
    return NextResponse.json(
      { error: '日報一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}
