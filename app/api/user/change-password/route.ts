import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
    const { currentPassword, newPassword, confirmPassword } = body

    // 入力チェック
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'すべての項目を入力してください' },
        { status: 400 }
      )
    }

    // 新しいパスワードの長さチェック
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上である必要があります' },
        { status: 400 }
      )
    }

    // 確認パスワードの一致チェック
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: '新しいパスワードと確認用パスワードが一致しません' },
        { status: 400 }
      )
    }

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // 現在のパスワードを確認
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 400 }
      )
    }

    // 新しいパスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // パスワードを更新
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ message: 'パスワードを変更しました' })
  } catch (error) {
    console.error('パスワード変更エラー:', error)
    return NextResponse.json(
      { error: 'パスワードの変更に失敗しました' },
      { status: 500 }
    )
  }
}
