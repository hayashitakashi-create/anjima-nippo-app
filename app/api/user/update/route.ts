import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json(
        { error: 'ユーザー名（メールアドレス）を入力してください' },
        { status: 400 }
      )
    }

    // メールアドレスの簡単なバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(username)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      )
    }

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
