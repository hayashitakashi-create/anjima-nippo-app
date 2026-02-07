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

// 作業日報一括取得（ユーザー・期間で絞り込み）
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.date.lte = end
      }
    }

    const workReports = await prisma.workReport.findMany({
      where,
      include: {
        workerRecords: {
          orderBy: { order: 'asc' },
        },
        materialRecords: {
          orderBy: { order: 'asc' },
        },
        subcontractorRecords: {
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [
        { date: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    // ユーザー情報を取得してマージ
    const userIds = [...new Set(workReports.map(r => r.userId))]
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    })
    const userMap = new Map(users.map(u => [u.id, u.name]))

    const reportsWithUserName = workReports.map(report => ({
      ...report,
      userName: userMap.get(report.userId) || '不明',
    }))

    return NextResponse.json({
      reports: reportsWithUserName,
      count: reportsWithUserName.length,
    })
  } catch (error) {
    console.error('一括日報取得エラー:', error)
    return NextResponse.json(
      { error: '日報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
