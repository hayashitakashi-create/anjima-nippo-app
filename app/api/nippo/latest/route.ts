import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    // ユーザーの最新の日報を取得
    const latestReport = await prisma.dailyReport.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true }
    })

    if (!latestReport) {
      // 日報がない場合は今月の21日を返す
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      return NextResponse.json({
        date: `${year}-${String(month).padStart(2, '0')}-21`
      })
    }

    // 最新日報の翌日を計算
    const latestDate = new Date(latestReport.date)
    latestDate.setDate(latestDate.getDate() + 1)

    const year = latestDate.getFullYear()
    const month = String(latestDate.getMonth() + 1).padStart(2, '0')
    const day = String(latestDate.getDate()).padStart(2, '0')

    return NextResponse.json({
      date: `${year}-${month}-${day}`
    })
  } catch (error) {
    console.error('最新日報取得エラー:', error)
    return NextResponse.json(
      { error: '最新日報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
