import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: 有効な承認ルート一覧を取得（ログインユーザー用）
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const routes = await prisma.approvalRoute.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    const parsedRoutes = routes.map(route => ({
      id: route.id,
      name: route.name,
      roles: JSON.parse(route.roles),
      isDefault: route.isDefault,
    }))

    return NextResponse.json({ routes: parsedRoutes })
  } catch (error) {
    console.error('承認ルート取得エラー:', error)
    return NextResponse.json(
      { error: '承認ルートの取得に失敗しました' },
      { status: 500 }
    )
  }
}
