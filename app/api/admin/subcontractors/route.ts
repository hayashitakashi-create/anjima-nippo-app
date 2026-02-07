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

// 外注先一覧取得（認証済みユーザーならアクセス可能）
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const subcontractors = await prisma.subcontractor.findMany({
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ subcontractors })
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

// 外注先更新（有効/無効切り替え）
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

    const subcontractor = await prisma.subcontractor.update({
      where: { id },
      data: { isActive },
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
