import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

// 通知一覧を取得
export async function GET(request: NextRequest) {
  try {
    // JWT認証
    const authUser = await getAuthFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: 'ログインしていません' }, { status: 401 })
    }
    const userId = authUser.id

    const searchParams = request.nextUrl.searchParams
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { userId }
    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // 未読数も返す
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error('通知取得エラー:', error)
    return NextResponse.json({ error: '通知の取得に失敗しました' }, { status: 500 })
  }
}

// 通知を既読にする
export async function PUT(request: NextRequest) {
  try {
    // JWT認証
    const authUser = await getAuthFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: 'ログインしていません' }, { status: 401 })
    }
    const userId = authUser.id

    const body = await request.json()
    const { notificationId, markAllRead } = body

    if (markAllRead) {
      // 全件既読
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true, message: '全て既読にしました' })
    }

    if (notificationId) {
      // 個別既読
      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'パラメータが不正です' }, { status: 400 })
  } catch (error) {
    console.error('通知既読エラー:', error)
    return NextResponse.json({ error: '通知の更新に失敗しました' }, { status: 500 })
  }
}
