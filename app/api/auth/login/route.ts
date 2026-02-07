import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import {
  createToken,
  setAuthCookie,
  checkLoginAttempts,
  recordLoginFailure,
  resetLoginAttempts,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'ユーザー名とパスワードを入力してください' },
        { status: 400 }
      )
    }

    // ログイン試行回数チェック（ユーザー名ベース）
    const attemptCheck = checkLoginAttempts(username)
    if (!attemptCheck.allowed) {
      return NextResponse.json(
        {
          error: `ログイン試行回数が上限を超えました。${Math.ceil(attemptCheck.remainingTime! / 60)}分後に再試行してください。`,
          locked: true,
          remainingTime: attemptCheck.remainingTime,
        },
        { status: 429 }
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
      recordLoginFailure(username)
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
      recordLoginFailure(username)
      return NextResponse.json(
        { error: 'ユーザー名またはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // ログイン成功 - 試行回数リセット
    resetLoginAttempts(username)

    // JWT トークンを生成
    const token = await createToken({
      userId: user.id,
      role: user.role,
      name: user.name,
    })

    // レスポンスを作成
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

    // 新しいJWT Cookieを設定
    setAuthCookie(response, token)

    // 旧Cookie（userId）も設定（後方互換性のため、徐々に削除予定）
    response.cookies.set('userId', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
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
