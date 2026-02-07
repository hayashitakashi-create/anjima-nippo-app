import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin, authErrorResponse } from '@/lib/auth'

// デフォルト単位リスト
const DEFAULT_UNITS = [
  { name: 'kg', order: 1 },
  { name: 'L', order: 2 },
  { name: 'ml', order: 3 },
]

// デフォルト単位を登録
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    // 既存の単位を確認
    const existingUnits = await prisma.unit.findMany({
      select: { name: true },
    })
    const existingNames = new Set(existingUnits.map(u => u.name))

    // 新規追加する単位
    const newUnits = DEFAULT_UNITS.filter(u => !existingNames.has(u.name))

    if (newUnits.length === 0) {
      return NextResponse.json({
        message: 'すべてのデフォルト単位は既に登録されています',
        added: 0,
      })
    }

    // バルクインサート
    const now = new Date()
    await prisma.unit.createMany({
      data: newUnits.map(u => ({
        name: u.name,
        order: u.order,
        updatedAt: now,
      })),
    })

    return NextResponse.json({
      message: `${newUnits.length}件のデフォルト単位を追加しました`,
      added: newUnits.length,
      units: newUnits.map(u => u.name),
    })
  } catch (error) {
    console.error('デフォルト単位登録エラー:', error)
    return NextResponse.json(
      { error: 'デフォルト単位の登録に失敗しました' },
      { status: 500 }
    )
  }
}
