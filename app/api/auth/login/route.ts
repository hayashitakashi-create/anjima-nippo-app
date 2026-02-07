import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードを入力してください' },
        { status: 400 }
      )
    }

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        password: true,
        position: true,
        role: true,
        isActive: true,
        defaultReportType: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // 無効化されたアカウントチェック
    if (user.isActive === false) {
      return NextResponse.json(
        { error: 'このアカウントは無効化されています。管理者にお問い合わせください。' },
        { status: 403 }
      )
    }

    // パスワードを確認
    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // セッション情報をCookieに保存
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        position: user.position,
        role: user.role,
        defaultReportType: user.defaultReportType,
      },
    })

    // HttpOnly Cookieでユーザー情報を保存（本番環境ではJWTなどを使用推奨）
    response.cookies.set('userId', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30日間
    })

    return response
  } catch (error) {
    console.error('ログインエラー:', error)
    return NextResponse.json(
      { error: 'ログインに失敗しました' },
      { status: 500 }
    )
  }
}
