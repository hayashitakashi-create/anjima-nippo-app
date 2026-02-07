import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, authErrorResponse } from '@/lib/auth'

// 単位一覧取得（認証済みユーザーならアクセス可能）
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const units = await prisma.unit.findMany({
      orderBy: [
        { isActive: 'desc' },
        { order: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ units })
  } catch (error) {
    console.error('単位一覧取得エラー:', error)
    return NextResponse.json(
      { error: '単位一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 単位追加
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()
    const { name } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '単位名は必須です' },
        { status: 400 }
      )
    }

    // 最大orderを取得
    const maxOrder = await prisma.unit.aggregate({
      _max: { order: true },
    })
    const newOrder = (maxOrder._max.order || 0) + 1

    const unit = await prisma.unit.create({
      data: {
        name: name.trim(),
        order: newOrder,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ unit })
  } catch (error) {
    console.error('単位追加エラー:', error)
    return NextResponse.json(
      { error: '単位の追加に失敗しました' },
      { status: 500 }
    )
  }
}

// 単位更新（有効/無効切り替え）
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      )
    }

    const unit = await prisma.unit.update({
      where: { id },
      data: { isActive, updatedAt: new Date() },
    })

    return NextResponse.json({ unit })
  } catch (error) {
    console.error('単位更新エラー:', error)
    return NextResponse.json(
      { error: '単位の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 単位削除
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
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

    await prisma.unit.delete({
      where: { id },
    })

    return NextResponse.json({ message: '単位を削除しました' })
  } catch (error) {
    console.error('単位削除エラー:', error)
    return NextResponse.json(
      { error: '単位の削除に失敗しました' },
      { status: 500 }
    )
  }
}
