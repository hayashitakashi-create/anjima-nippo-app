import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest, requirePermission, authErrorResponse } from '@/lib/auth'

// 外注先一覧取得（認証済みユーザーならアクセス可能）
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const subcontractors = await prisma.subcontractor.findMany({
      orderBy: [
        { isActive: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ subcontractors }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('外注先一覧取得エラー:', error)
    return NextResponse.json(
      { error: '外注先一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 外注先追加
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'manage_masters')
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()
    const { name } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '外注先名は必須です' },
        { status: 400 }
      )
    }

    const subcontractor = await prisma.subcontractor.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json({ subcontractor })
  } catch (error) {
    console.error('外注先追加エラー:', error)
    return NextResponse.json(
      { error: '外注先の追加に失敗しました' },
      { status: 500 }
    )
  }
}

// 外注先更新（有効/無効切り替え、名前変更、並び替え）
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'manage_masters')
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()

    // 並び替え一括更新
    if (body.reorder && Array.isArray(body.reorder)) {
      const updates = body.reorder.map((item: { id: string; sortOrder: number }) =>
        prisma.subcontractor.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
      await Promise.all(updates)
      return NextResponse.json({ message: '並び替えを保存しました' })
    }

    const { id, isActive, name } = body

    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      )
    }

    const data: { isActive?: boolean; name?: string } = {}
    if (typeof isActive === 'boolean') data.isActive = isActive
    if (typeof name === 'string' && name.trim()) data.name = name.trim()

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: '更新する項目がありません' },
        { status: 400 }
      )
    }

    const subcontractor = await prisma.subcontractor.update({
      where: { id },
      data,
    })

    return NextResponse.json({ subcontractor })
  } catch (error) {
    console.error('外注先更新エラー:', error)
    return NextResponse.json(
      { error: '外注先の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 外注先削除
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'manage_masters')
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      )
    }

    await prisma.subcontractor.delete({
      where: { id },
    })

    return NextResponse.json({ message: '外注先を削除しました' })
  } catch (error) {
    console.error('外注先削除エラー:', error)
    return NextResponse.json(
      { error: '外注先の削除に失敗しました' },
      { status: 500 }
    )
  }
}
