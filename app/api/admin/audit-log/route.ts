import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 管理者権限チェック
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value

  if (!userId) {
    return { error: 'ログインしていません', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })

  if (!user) {
    return { error: 'ユーザーが見つかりません', status: 404 }
  }

  if (user.role !== 'admin') {
    return { error: '管理者権限が必要です', status: 403 }
  }

  return { userId: user.id }
}

// 操作ログ一覧取得
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const targetType = searchParams.get('targetType') || undefined
    const action = searchParams.get('action') || undefined
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    // フィルタ条件を構築
    const where: any = {}
    if (targetType) {
      where.targetType = targetType
    }
    if (action) {
      where.action = action
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // 終了日は23:59:59まで含める
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    // ログ件数取得
    const total = await prisma.auditLog.count({ where })

    // ログ取得（ユーザー名をJOIN）
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    // ユーザー情報を取得
    const userIds = [...new Set(logs.map(log => log.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    })
    const userMap = new Map(users.map(u => [u.id, u.name]))

    // ログにユーザー名を追加
    const logsWithUser = logs.map(log => ({
      ...log,
      userName: userMap.get(log.userId) || '不明なユーザー',
    }))

    return NextResponse.json({
      logs: logsWithUser,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('操作ログ取得エラー:', error)
    return NextResponse.json(
      { error: '操作ログの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 操作ログ作成（内部API用）
export async function POST(request: NextRequest) {
  try {
    const auth = await checkAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { userId, action, targetType, targetId, details, ipAddress } = body

    if (!userId || !action || !targetType) {
      return NextResponse.json(
        { error: 'userId, action, targetType は必須です' },
        { status: 400 }
      )
    }

    const log = await prisma.auditLog.create({
      data: {
        userId,
        action,
        targetType,
        targetId: targetId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
      },
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    console.error('操作ログ作成エラー:', error)
    return NextResponse.json(
      { error: '操作ログの作成に失敗しました' },
      { status: 500 }
    )
  }
}
