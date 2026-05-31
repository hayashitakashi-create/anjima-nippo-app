import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }
    const userId = user.id

    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名を入力してください' },
        { status: 400 }
      )
    }

    // ユーザー名はメール形式に限定しない（任意文字列・一意であればOK / 田邊様5/28 FB⑧）

    // ユーザー名の重複チェック（自分以外）
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json(
        { error: 'このユーザー名は既に使用されています' },
        { status: 400 }
      )
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username },
      select: {
        id: true,
        name: true,
        username: true,
        position: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('ユーザー情報更新エラー:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の更新に失敗しました' },
      { status: 500 }
    )
  }
}
