import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

// GET: 有効な承認ルート一覧を取得（ログインユーザー用）
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const routes = await prisma.approvalRoute.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    const parsedRoutes = routes.map(route => {
      let roles: string[] = []
      try { roles = JSON.parse(route.roles) } catch {}
      return {
        id: route.id,
        name: route.name,
        roles,
        isDefault: route.isDefault,
      }
    })

    return NextResponse.json({ routes: parsedRoutes })
  } catch (error) {
    console.error('承認ルート取得エラー:', error)
    return NextResponse.json(
      { error: '承認ルートの取得に失敗しました' },
      { status: 500 }
    )
  }
}
