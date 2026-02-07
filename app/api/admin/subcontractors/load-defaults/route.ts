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

// デフォルト外注先読み込み
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
    const { subcontractors } = body

    if (!Array.isArray(subcontractors)) {
      return NextResponse.json(
        { error: '不正なデータ形式です' },
        { status: 400 }
      )
    }

    // 既存の外注先名を取得
    const existingSubcontractors = await prisma.subcontractor.findMany({
      select: { name: true },
    })
    const existingNames = new Set(existingSubcontractors.map(s => s.name))

    // 重複を除いて一括作成
    const newSubcontractors = subcontractors
      .filter(name => name && !existingNames.has(name))
      .map(name => ({ name }))

    if (newSubcontractors.length === 0) {
      return NextResponse.json(
        { message: '追加する外注先がありません（すべて登録済み）' },
        { status: 200 }
      )
    }

    // createManyはlibsqlアダプターで非対応の場合があるため個別作成
    for (const sub of newSubcontractors) {
      await prisma.subcontractor.create({
        data: sub,
      })
    }

    return NextResponse.json({
      message: `${newSubcontractors.length}件の外注先を追加しました`,
    })
  } catch (error) {
    console.error('デフォルト外注先読み込みエラー:', error)
    return NextResponse.json(
      { error: 'デフォルト外注先の読み込みに失敗しました' },
      { status: 500 }
    )
  }
}
