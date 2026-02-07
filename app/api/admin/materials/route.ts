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

// 材料一覧取得（認証済みユーザーならアクセス可能）
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const materials = await prisma.material.findMany({
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ materials })
  } catch (error) {
    console.error('材料一覧取得エラー:', error)
    return NextResponse.json(
      { error: '材料一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 材料追加
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
    const { name, defaultVolume, defaultUnit } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: '材料名は必須です' },
        { status: 400 }
      )
    }

    const material = await prisma.material.create({
      data: {
        name: name.trim(),
        defaultVolume: defaultVolume?.trim() || null,
        defaultUnit: defaultUnit?.trim() || null,
      },
    })

    return NextResponse.json({ material })
  } catch (error) {
    console.error('材料追加エラー:', error)
    return NextResponse.json(
      { error: '材料の追加に失敗しました' },
      { status: 500 }
    )
  }
}

// 材料更新（有効/無効切り替え）
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
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      )
    }

    const material = await prisma.material.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ material })
  } catch (error) {
    console.error('材料更新エラー:', error)
    return NextResponse.json(
      { error: '材料の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 材料削除
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

    await prisma.material.delete({
      where: { id },
    })

    return NextResponse.json({ message: '材料を削除しました' })
  } catch (error) {
    console.error('材料削除エラー:', error)
    return NextResponse.json(
      { error: '材料の削除に失敗しました' },
      { status: 500 }
    )
  }
}
