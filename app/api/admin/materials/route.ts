import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest, requirePermission, authErrorResponse } from '@/lib/auth'

// 材料一覧取得（認証済みユーザーならアクセス可能）
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
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

    return NextResponse.json({ materials }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
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
    const authResult = await requirePermission(request, 'manage_masters')
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()
    const { name, defaultVolume, defaultUnit, defaultUnitPrice } = body

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
        defaultUnitPrice: defaultUnitPrice || 0,
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
    const authResult = await requirePermission(request, 'manage_masters')
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const body = await request.json()
    const { id, isActive, defaultUnitPrice } = body

    if (!id) {
      return NextResponse.json(
        { error: 'IDは必須です' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (defaultUnitPrice !== undefined) updateData.defaultUnitPrice = defaultUnitPrice

    const material = await prisma.material.update({
      where: { id },
      data: updateData,
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
