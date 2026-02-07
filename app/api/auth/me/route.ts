import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest, migrateOldSession, createToken, setAuthCookie } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // 新しいJWT認証を試行
    let authUser = await getAuthFromRequest(request)

    // JWT認証に失敗した場合、旧Cookie (userId) からの移行を試行
    if (!authUser) {
      authUser = await migrateOldSession(request)

      // 旧セッションからの移行成功時は新しいトークンを発行
      if (authUser) {
        const user = await prisma.user.findUnique({
          where: { id: authUser.id },
          select: {
            id: true,
            name: true,
            username: true,
            position: true,
            role: true,
            defaultReportType: true,
          },
        })

        if (user) {
          const token = await createToken({
            userId: user.id,
            role: user.role,
            name: user.name,
          })

          const response = NextResponse.json({ user })
          setAuthCookie(response, token)
          return response
        }
      }
    }

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
        defaultReportType: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('ユーザー取得エラー:', error)
    return NextResponse.json(
      { error: 'ユーザー情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
