import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyReportApproved, notifyReportRejected } from '@/lib/notifications'
import { requireAdmin, authErrorResponse } from '@/lib/auth'

// 承認待ち日報一覧を取得（管理者用）
export async function GET(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all' // all, pending, approved, rejected
    const includeSubmissionStatus = searchParams.get('includeSubmissionStatus') === 'true'
    const calendarOffset = parseInt(searchParams.get('calendarOffset') || '0', 10)

    // ページネーション対応（デフォルトは全件取得 - 既存フロントとの互換性のため）
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '500', 10), 500)
    const usePagination = searchParams.get('paginate') === 'true'

    // where条件構築（DBでフィルタリング）
    const where: any = {}
    if (status === 'pending') {
      where.approvals = { some: { status: 'pending' } }
    } else if (status === 'approved') {
      where.approvals = { every: { status: 'approved' }, some: {} }
    } else if (status === 'rejected') {
      where.approvals = { some: { status: 'rejected' } }
    }

    // 総件数を取得
    const total = await prisma.dailyReport.count({ where })

    // 日報一覧を取得（ページネーション対応）
    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: { date: 'desc' },
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
        visitRecords: {
          orderBy: { order: 'asc' },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                position: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        approvalRoute: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // 提出状況サマリーを返す（カレンダー用）
    let submissionStatus = null
    if (includeSubmissionStatus) {
      // アクティブユーザーと期間内日報を並列取得
      const now = new Date()
      const currentDay = now.getDate()

      let basePeriodStart: Date
      if (currentDay >= 21) {
        basePeriodStart = new Date(now.getFullYear(), now.getMonth(), 21)
      } else {
        basePeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 21)
      }

      const periodStart = new Date(basePeriodStart.getFullYear(), basePeriodStart.getMonth() + calendarOffset, 21)
      const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 20, 23, 59, 59, 999)
      const displayYear = periodStart.getFullYear()
      const displayMonth = periodStart.getMonth() + 1

      // 並列でクエリ実行
      const [activeUsers, periodReports] = await Promise.all([
        prisma.user.findMany({
          where: { isActive: true, role: 'user' },
          select: { id: true, name: true, position: true },
          orderBy: { name: 'asc' },
        }),
        prisma.dailyReport.findMany({
          where: {
            date: { gte: periodStart, lte: periodEnd },
          },
          select: { userId: true, date: true },
        }),
      ])

      // マップ作成
      const submissionMap: Record<string, Record<string, boolean>> = {}
      activeUsers.forEach(u => {
        submissionMap[u.id] = {}
      })
      periodReports.forEach(r => {
        const dateKey = new Date(r.date).toISOString().split('T')[0]
        if (submissionMap[r.userId]) {
          submissionMap[r.userId][dateKey] = true
        }
      })

      submissionStatus = {
        users: activeUsers,
        year: displayYear,
        month: displayMonth,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        submissionMap,
      }
    }

    return NextResponse.json({
      reports,
      submissionStatus,
      ...(usePagination ? {
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        }
      } : {}),
    })
  } catch (error) {
    console.error('承認一覧取得エラー:', error)
    return NextResponse.json(
      { error: '承認一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 承認・差戻し処理
export async function PUT(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await requireAdmin(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }
    const admin = authResult.user

    const body = await request.json()
    const { approvalId, action, reportId, reportIds } = body

    // 複数日報の一括承認/差戻し（トランザクションで最適化）
    if (action === 'bulk_approve' || action === 'bulk_reject') {
      if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        return NextResponse.json(
          { error: 'reportIds は必須です' },
          { status: 400 }
        )
      }

      const newStatus = action === 'bulk_approve' ? 'approved' : 'rejected'

      // トランザクションで一括処理
      await prisma.$transaction(async (tx) => {
        await tx.approval.updateMany({
          where: { dailyReportId: { in: reportIds } },
          data: {
            status: newStatus,
            approverUserId: admin.id,
            approvedAt: newStatus === 'approved' ? new Date() : null,
          },
        })
      })

      // 通知は非同期でバックグラウンド処理
      const reports = await prisma.dailyReport.findMany({
        where: { id: { in: reportIds } },
        select: { id: true, date: true, userId: true },
      })

      reports.forEach(report => {
        const reportDate = new Date(report.date)
        const dateStr = `${reportDate.getMonth() + 1}月${reportDate.getDate()}日`
        if (action === 'bulk_approve') {
          notifyReportApproved(report.userId, dateStr, report.id, admin.name).catch(() => {})
        } else {
          notifyReportRejected(report.userId, dateStr, report.id, admin.name).catch(() => {})
        }
      })

      return NextResponse.json({
        success: true,
        message: action === 'bulk_approve' ? `${reportIds.length}件を承認しました` : `${reportIds.length}件を差戻ししました`,
        processedCount: reportIds.length,
      })
    }

    if (action === 'approve_all' || action === 'reject_all') {
      if (!reportId) {
        return NextResponse.json(
          { error: 'reportId は必須です' },
          { status: 400 }
        )
      }

      const newStatus = action === 'approve_all' ? 'approved' : 'rejected'

      await prisma.approval.updateMany({
        where: { dailyReportId: reportId },
        data: {
          status: newStatus,
          approverUserId: admin.id,
          approvedAt: newStatus === 'approved' ? new Date() : null,
        },
      })

      const updatedReport = await prisma.dailyReport.findUnique({
        where: { id: reportId },
        include: {
          user: {
            select: { id: true, name: true, position: true },
          },
          approvals: {
            include: {
              approver: {
                select: { id: true, name: true, position: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      })

      if (updatedReport) {
        const reportDate = new Date(updatedReport.date)
        const dateStr = `${reportDate.getMonth() + 1}月${reportDate.getDate()}日`
        if (action === 'approve_all') {
          notifyReportApproved(updatedReport.user.id, dateStr, reportId, admin.name).catch(() => {})
        } else {
          notifyReportRejected(updatedReport.user.id, dateStr, reportId, admin.name).catch(() => {})
        }
      }

      return NextResponse.json({
        success: true,
        message: action === 'approve_all' ? '承認しました' : '差戻ししました',
        report: updatedReport,
      })
    }

    // 個別承認
    if (!approvalId) {
      return NextResponse.json(
        { error: 'approvalId は必須です' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: '不正なアクションです' },
        { status: 400 }
      )
    }

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
    })

    if (!approval) {
      return NextResponse.json(
        { error: '承認レコードが見つかりません' },
        { status: 404 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const updatedApproval = await prisma.approval.update({
      where: { id: approvalId },
      data: {
        status: newStatus,
        approverUserId: admin.id,
        approvedAt: newStatus === 'approved' ? new Date() : null,
      },
      include: {
        approver: {
          select: { id: true, name: true, position: true },
        },
      },
    })

    const report = await prisma.dailyReport.findUnique({
      where: { id: approval.dailyReportId },
      select: { id: true, date: true, userId: true },
    })
    if (report) {
      const reportDate = new Date(report.date)
      const dateStr = `${reportDate.getMonth() + 1}月${reportDate.getDate()}日`
      if (action === 'approve') {
        notifyReportApproved(report.userId, dateStr, report.id, admin.name).catch(() => {})
      } else {
        notifyReportRejected(report.userId, dateStr, report.id, admin.name).catch(() => {})
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? '承認しました' : '差戻ししました',
      approval: updatedApproval,
    })
  } catch (error) {
    console.error('承認処理エラー:', error)
    return NextResponse.json(
      { error: '承認処理に失敗しました' },
      { status: 500 }
    )
  }
}
