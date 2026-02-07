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

// 工事種別一覧取得（認証済みユーザーならアクセス可能）
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const projectTypes = await prisma.projectType.findMany({
      orderBy: [
        { isActive: 'desc' },
        { order: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ projectTypes })
  } catch (error) {
    console.error('工事種別一覧取得エラー:', error)
    return NextResponse.json(
      { error: '工事種別一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 工事種別追加
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
    const { name } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '工事種別名は必須です' },
        { status: 400 }
      )
    }

    // 最大orderを取得
    const maxOrder = await prisma.projectType.aggregate({
      _max: { order: true },
    })

    const projectType = await prisma.projectType.create({
      data: {
        name: name.trim(),
        order: (maxOrder._max.order || 0) + 1,
      },
    })

    return NextResponse.json({ projectType })
  } catch (error) {
    console.error('工事種別追加エラー:', error)
    return NextResponse.json(
      { error: '工事種別の追加に失敗しました' },
      { status: 500 }
    )
  }
}

// 工事種別更新
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
    const { id, name, order, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      )
    }

    const updateData: { name?: string; order?: number; isActive?: boolean } = {}
    if (name !== undefined) updateData.name = name.trim()
    if (order !== undefined) updateData.order = order
    if (isActive !== undefined) updateData.isActive = isActive

    const projectType = await prisma.projectType.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ projectType })
  } catch (error) {
    console.error('工事種別更新エラー:', error)
    return NextResponse.json(
      { error: '工事種別の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 工事種別削除
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

    await prisma.projectType.delete({
      where: { id },
    })

    return NextResponse.json({ message: '工事種別を削除しました' })
  } catch (error) {
    console.error('工事種別削除エラー:', error)
    return NextResponse.json(
      { error: '工事種別の削除に失敗しました' },
      { status: 500 }
    )
  }
}
