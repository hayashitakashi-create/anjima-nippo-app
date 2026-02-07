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

// デフォルト材料読み込み
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
    const { materials } = body

    if (!Array.isArray(materials)) {
      return NextResponse.json(
        { error: '不正なデータ形式です' },
        { status: 400 }
      )
    }

    // 既存の材料名を取得
    const existingMaterials = await prisma.material.findMany({
      select: { name: true },
    })
    const existingNames = new Set(existingMaterials.map(m => m.name))

    // 重複を除いて一括作成（名前だけの文字列配列またはオブジェクト配列に対応）
    const newMaterials = materials
      .map((m: any) => typeof m === 'string' ? { name: m } : { name: m.name })
      .filter((m: any) => m.name && !existingNames.has(m.name))

    if (newMaterials.length === 0) {
      return NextResponse.json(
        { message: '追加する材料がありません（すべて登録済み）' },
        { status: 200 }
      )
    }

    // createManyはlibsqlアダプターで非対応の場合があるため個別作成
    for (const mat of newMaterials) {
      await prisma.material.create({
        data: mat,
      })
    }

    return NextResponse.json({
      message: `${newMaterials.length}件の材料を追加しました`,
    })
  } catch (error) {
    console.error('デフォルト材料読み込みエラー:', error)
    return NextResponse.json(
      { error: 'デフォルト材料の読み込みに失敗しました' },
      { status: 500 }
    )
  }
}
