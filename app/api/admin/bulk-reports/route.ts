import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, authErrorResponse } from '@/lib/auth'

// 日報一括取得（作業日報 + 営業日報対応）
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'bulk_print')
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('reportType') || 'all' // 'work' | 'sales' | 'all'
    const projectName = searchParams.get('projectName') || ''

    // 日付条件の組み立て
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      dateFilter.lte = end
    }

    const results: any[] = []

    // 作業日報の取得
    if (reportType === 'work' || reportType === 'all') {
      const workWhere: any = {}
      if (userId) workWhere.userId = userId
      if (startDate || endDate) workWhere.date = dateFilter
      if (projectName) {
        workWhere.projectName = { contains: projectName }
      }

      const workReports = await prisma.workReport.findMany({
        where: workWhere,
        include: {
          workerRecords: { orderBy: { order: 'asc' } },
          materialRecords: { orderBy: { order: 'asc' } },
          subcontractorRecords: { orderBy: { order: 'asc' } },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      })

      // ユーザー名マージ
      const workUserIds = [...new Set(workReports.map(r => r.userId))]
      const workUsers = workUserIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: workUserIds } },
            select: { id: true, name: true },
          })
        : []
      const workUserMap = new Map(workUsers.map(u => [u.id, u.name]))

      workReports.forEach(report => {
        results.push({
          ...report,
          reportType: 'work',
          userName: workUserMap.get(report.userId) || '不明',
        })
      })
    }

    // 営業日報の取得
    if (reportType === 'sales' || reportType === 'all') {
      const salesWhere: any = {}
      if (userId) salesWhere.userId = userId
      if (startDate || endDate) salesWhere.date = dateFilter

      const dailyReports = await prisma.dailyReport.findMany({
        where: salesWhere,
        include: {
          user: { select: { id: true, name: true, position: true } },
          visitRecords: { orderBy: { order: 'asc' } },
          approvals: {
            include: {
              approver: { select: { name: true, position: true } },
            },
          },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
      })

      dailyReports.forEach(report => {
        results.push({
          id: report.id,
          date: report.date,
          userId: report.userId,
          reportType: 'sales',
          userName: report.user.name,
          userPosition: report.user.position,
          specialNotes: report.specialNotes,
          visitRecords: report.visitRecords,
          approvals: report.approvals,
        })
      })
    }

    // 日付順でソート
    results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({
      reports: results,
      count: results.length,
    })
  } catch (error) {
    console.error('一括日報取得エラー:', error)
    return NextResponse.json(
      { error: '日報の取得に失敗しました' },
      { status: 500 }
    )
  }
}
