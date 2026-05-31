import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

// 一般ユーザー向け: 自分の提出状況カレンダー (田邊様5/28 FB⑤)
// 未提出は空欄扱い(バツにしない)。期間は給与締めに合わせ 21日〜翌20日
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthFromRequest(request)
    if (!authUser) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const now = new Date()
    const base = now.getDate() >= 21
      ? new Date(now.getFullYear(), now.getMonth(), 21)
      : new Date(now.getFullYear(), now.getMonth() - 1, 21)
    const periodStart = new Date(base.getFullYear(), base.getMonth() + offset, 21)
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 20, 23, 59, 59, 999)

    const [salesReports, workReports, leaveRequests, me] = await Promise.all([
      prisma.dailyReport.findMany({
        where: { userId: authUser.id, date: { gte: periodStart, lte: periodEnd } },
        select: { id: true, date: true },
      }),
      prisma.workReport.findMany({
        where: { userId: authUser.id, date: { gte: periodStart, lte: periodEnd } },
        select: { id: true, date: true },
      }),
      prisma.leaveRequest.findMany({
        where: { userId: authUser.id, date: { gte: periodStart, lte: periodEnd } },
        select: { id: true, date: true, leaveType: true },
      }),
      prisma.user.findUnique({ where: { id: authUser.id }, select: { name: true } }),
    ])

    const toKey = (d: Date) => new Date(d).toISOString().split('T')[0]
    const salesDates = salesReports.map(r => toKey(r.date))
    const workDates = workReports.map(r => toKey(r.date))
    const leaveMap: Record<string, string> = {}
    leaveRequests.forEach(l => { leaveMap[toKey(l.date)] = l.leaveType })

    return NextResponse.json({
      userName: me?.name || '',
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      salesDates,
      workDates,
      leaveMap,
    })
  } catch (error) {
    console.error('提出カレンダー取得エラー:', error)
    return NextResponse.json({ error: '提出状況の取得に失敗しました' }, { status: 500 })
  }
}
