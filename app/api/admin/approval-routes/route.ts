import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 管理者チェック
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  })

  if (!user || user.role !== 'admin') return null
  return user
}

// GET: 承認ルート一覧を取得
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const where = activeOnly ? { isActive: true } : {}

    const routes = await prisma.approvalRoute.findMany({
      where,
      orderBy: { order: 'asc' },
    })

    // roles を JSON パースして返す
    const parsedRoutes = routes.map(route => ({
      ...route,
      roles: JSON.parse(route.roles),
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

// POST: 新規承認ルート作成
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, roles, isDefault } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'ルート名は必須です' },
        { status: 400 }
      )
    }

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: '承認者役職を1つ以上設定してください' },
        { status: 400 }
      )
    }

    // isDefault が true の場合、他のデフォルトを解除
    if (isDefault) {
      await prisma.approvalRoute.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    // 最大 order を取得
    const maxOrder = await prisma.approvalRoute.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const route = await prisma.approvalRoute.create({
      data: {
        name: name.trim(),
        roles: JSON.stringify(roles),
        isDefault: isDefault || false,
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    return NextResponse.json({
      route: { ...route, roles: JSON.parse(route.roles) },
      message: '承認ルートを作成しました',
    }, { status: 201 })
  } catch (error) {
    console.error('承認ルート作成エラー:', error)
    return NextResponse.json(
      { error: '承認ルートの作成に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: 承認ルート更新
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, name, roles, isDefault, isActive, order } = body

    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      )
    }

    const existing = await prisma.approvalRoute.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: '承認ルートが見つかりません' },
        { status: 404 }
      )
    }

    // isDefault が true の場合、他のデフォルトを解除
    if (isDefault === true) {
      await prisma.approvalRoute.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (roles !== undefined) updateData.roles = JSON.stringify(roles)
    if (isDefault !== undefined) updateData.isDefault = isDefault
    if (isActive !== undefined) updateData.isActive = isActive
    if (order !== undefined) updateData.order = order

    const route = await prisma.approvalRoute.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      route: { ...route, roles: JSON.parse(route.roles) },
      message: '承認ルートを更新しました',
    })
  } catch (error) {
    console.error('承認ルート更新エラー:', error)
    return NextResponse.json(
      { error: '承認ルートの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: 承認ルート削除
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      )
    }

    // 使用中かチェック
    const usageCount = await prisma.dailyReport.count({
      where: { approvalRouteId: id },
    })

    if (usageCount > 0) {
      return NextResponse.json(
        { error: `このルートは${usageCount}件の日報で使用されているため削除できません。無効化をお勧めします。` },
        { status: 400 }
      )
    }

    await prisma.approvalRoute.delete({
      where: { id },
    })

    return NextResponse.json({
      message: '承認ルートを削除しました',
    })
  } catch (error) {
    console.error('承認ルート削除エラー:', error)
    return NextResponse.json(
      { error: '承認ルートの削除に失敗しました' },
      { status: 500 }
    )
  }
}
