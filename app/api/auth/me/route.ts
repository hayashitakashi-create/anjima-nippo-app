import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthFromRequest(request)

    if (!authUser) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    // 最新のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        username: true,
        position: true,
        role: true,
        isApprover: true,
        defaultReportType: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    const permissions = await getUserPermissions(user.role)
    // 承認者は追加権限を持つ
    if (user.isApprover) {
      permissions.approve_reports = true
      permissions.view_all_reports = true
    }
    return NextResponse.json({ user: { ...user, permissions } })
  } catch (error) {
    console.error('ユーザー取得エラー:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
