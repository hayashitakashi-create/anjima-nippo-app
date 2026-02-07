import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUnsubmittedUsers } from '@/lib/notifications'

// 未提出者リストを取得（管理者向け）
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: 'ログインしていません' }, { status: 401 })
    }

    // 管理者チェック
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: '管理者権限が必要です' }, { status: 403 })
    }

    const result = await getUnsubmittedUsers()
    return NextResponse.json(result)
  } catch (error) {
    console.error('未提出者取得エラー:', error)
    return NextResponse.json({ error: '未提出者の取得に失敗しました' }, { status: 500 })
  }
}
