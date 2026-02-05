import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        position: true,
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('ユーザー取得エラー:', error)
    return NextResponse.json(
      { error: 'ユーザーの取得に失敗しました' },
      { status: 500 }
    )
  }
}
