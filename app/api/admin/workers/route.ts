import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest, requirePermission, authErrorResponse } from '@/lib/auth'

// 作業者名一覧取得（認証済みユーザーならアクセス可能）
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const workers = await prisma.workerName.findMany({
      orderBy: [
        { isActive: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ workers }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('作業者名一覧取得エラー:', error)
    return NextResponse.json(
      { error: '作業者名一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 作業者名追加
export async function POST(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'manage_masters')
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()

    // 一括登録（初回デフォルト読み込み用）
    if (body.workers && Array.isArray(body.workers)) {
      const existing = await prisma.workerName.findMany({ select: { name: true } })
      const existingNames = new Set(existing.map(w => w.name))
      const newNames = body.workers.filter((n: string) => !existingNames.has(n))

      if (newNames.length > 0) {
        await prisma.$transaction(
          newNames.map((name: string, i: number) =>
            prisma.workerName.create({ data: { name, sortOrder: existing.length + i } })
          )
        )
      }

      return NextResponse.json({ message: `${newNames.length}件の作業者名を登録しました` })
    }

    const { name } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '作業者名は必須です' },
        { status: 400 }
      )
    }

    const worker = await prisma.workerName.create({
      data: {
        name: name.trim(),
      },
    })

    return NextResponse.json({ worker })
  } catch (error) {
    console.error('作業者名追加エラー:', error)
    return NextResponse.json(
      { error: '作業者名の追加に失敗しました' },
      { status: 500 }
    )
  }
}

// 作業者名更新（有効/無効切り替え、名前変更、並び替え）
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
        prisma.workerName.update({
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

    const worker = await prisma.workerName.update({
      where: { id },
      data,
    })

    return NextResponse.json({ worker })
  } catch (error) {
    console.error('作業者名更新エラー:', error)
    return NextResponse.json(
      { error: '作業者名の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 作業者名削除
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

    await prisma.workerName.delete({
      where: { id },
    })

    return NextResponse.json({ message: '作業者名を削除しました' })
  } catch (error) {
    console.error('作業者名削除エラー:', error)
    return NextResponse.json(
      { error: '作業者名の削除に失敗しました' },
      { status: 500 }
    )
  }
}
