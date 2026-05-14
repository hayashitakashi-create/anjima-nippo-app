import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

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
    const targetUserId = searchParams.get('userId') // 任意。未指定なら本人 or 全員（権限による）

    // ページネーションパラメータ
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100) // 最大100件
    const skip = (page - 1) * limit

    // 全員の日報を閲覧できるか
    const permissions = await getUserPermissions(authUser.role)
    const canViewAll = permissions.view_all_reports

    // where条件を構築
    // - userIdパラメータ指定: その人の日報のみ（権限チェック）
    // - 未指定 + canViewAll: 全員
    // - 未指定 + canViewAllなし: 本人のみ
    const where: any = {}
    if (targetUserId) {
      if (!canViewAll && targetUserId !== authUser.id) {
        return NextResponse.json({ error: '他ユーザーの日報を閲覧する権限がありません' }, { status: 403 })
      }
      where.userId = targetUserId
    } else if (!canViewAll) {
      where.userId = authUser.id
    }

    // 期間フィルター
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate + 'T00:00:00.000Z')
      if (endDate) {
        where.date.lte = new Date(endDate + 'T23:59:59.999Z')
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

    // 代理入力時の入力者情報を付加（一覧で誰が入力したか確認できるように）
    const entererIds = Array.from(
      new Set(
        reports
          .map((r) => r.enteredById)
          .filter((id): id is string => !!id)
          .filter((id) => reports.find((r) => r.enteredById === id && r.userId !== id))
      )
    )
    const entererUsers = entererIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: entererIds } },
          select: { id: true, name: true, position: true },
        })
      : []
    const entererMap = new Map(entererUsers.map((u) => [u.id, u]))
    const reportsWithEnteredBy = reports.map((r) => ({
      ...r,
      enteredBy:
        r.enteredById && r.enteredById !== r.userId
          ? entererMap.get(r.enteredById) || null
          : null,
    }))

    return NextResponse.json({
      reports: reportsWithEnteredBy,
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
