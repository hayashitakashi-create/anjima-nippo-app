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

// ユーザー一覧取得
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        position: true,
        role: true,
        defaultReportType: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'ユーザー一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// ユーザー更新（権限変更など）
export async function PUT(request: NextRequest) {
  try {
    const auth = await checkAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { userId, role, defaultReportType, position } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (role !== undefined) updateData.role = role
    if (defaultReportType !== undefined) updateData.defaultReportType = defaultReportType
    if (position !== undefined) updateData.position = position

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        username: true,
        position: true,
        role: true,
        defaultReportType: true,
      },
    data: updateData,
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('ユーザー更新エラー:', error)
    return NextResponse.json(
      { error: 'ユーザーの更新に失敗しました' },
      { status: 500 }
    )
  }
}
