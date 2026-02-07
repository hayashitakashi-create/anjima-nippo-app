import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyReportApproved, notifyReportRejected } from '@/lib/notifications'

// 管理者チェック
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, position: true, role: true },
  })

  if (!user || user.role !== 'admin') return null
  return user
}

// 承認待ち日報一覧を取得（管理者用）
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all' // all, pending, approved, rejected
    const includeSubmissionStatus = searchParams.get('includeSubmissionStatus') === 'true'
    const calendarOffset = parseInt(searchParams.get('calendarOffset') || '0', 10) // 0: 今期, -1: 前期, -2: 前々期...

    // 承認レコード付きの営業日報を取得
    const reports = await prisma.dailyReport.findMany({
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
      orderBy: { date: 'desc' },
    })

    // ステータスフィルタリング
    let filteredReports = reports
    if (status === 'pending') {
      filteredReports = reports.filter(r =>
        r.approvals.some(a => a.status === 'pending')
      )
    } else if (status === 'approved') {
      filteredReports = reports.filter(r =>
        r.approvals.length > 0 && r.approvals.every(a => a.status === 'approved')
      )
    } else if (status === 'rejected') {
      filteredReports = reports.filter(r =>
        r.approvals.some(a => a.status === 'rejected')
      )
    }

    // 提出状況サマリーを返す（カレンダー用）
    // 起算日: 毎月21日（前月21日〜当月20日を1期間とする）
    let submissionStatus = null
    if (includeSubmissionStatus) {
      const activeUsers = await prisma.user.findMany({
        where: { isActive: true, role: 'user' },
        select: { id: true, name: true, position: true },
        orderBy: { name: 'asc' },
      })

      // 起算日21日で期間を計算（calendarOffsetで期間をずらす）
      const now = new Date()
      const currentDay = now.getDate()

      let basePeriodStart: Date

      if (currentDay >= 21) {
        // 今月21日以降の場合: 今月21日が基準
        basePeriodStart = new Date(now.getFullYear(), now.getMonth(), 21)
      } else {
        // 今月20日以前の場合: 前月21日が基準
        basePeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 21)
      }

      // calendarOffsetを適用（負の値で過去の期間）
      const periodStart = new Date(basePeriodStart.getFullYear(), basePeriodStart.getMonth() + calendarOffset, 21)
      const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 20, 23, 59, 59, 999)
      const displayYear = periodStart.getFullYear()
      const displayMonth = periodStart.getMonth() + 1

      const periodReports = await prisma.dailyReport.findMany({
        where: {
          date: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
        select: { userId: true, date: true },
      })

      // ユーザーID→日付→bool のマップを作成
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

    return NextResponse.json({ reports: filteredReports, submissionStatus })
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
    const admin = await checkAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { approvalId, action, reportId, reportIds } = body
    // action: 'approve' | 'reject' | 'approve_all' | 'reject_all' | 'bulk_approve' | 'bulk_reject'

    // 複数日報の一括承認/差戻し
    if (action === 'bulk_approve' || action === 'bulk_reject') {
      if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        return NextResponse.json(
          { error: 'reportIds は必須です' },
          { status: 400 }
        )
      }

      const newStatus = action === 'bulk_approve' ? 'approved' : 'rejected'

      // 各日報の承認レコードを更新
      for (const rId of reportIds) {
        await prisma.approval.updateMany({
          where: { dailyReportId: rId },
          data: {
            status: newStatus,
            approverUserId: admin.id,
            approvedAt: newStatus === 'approved' ? new Date() : null,
          },
        })

        // 通知: 日報作成者に承認/差戻しを通知
        const report = await prisma.dailyReport.findUnique({
          where: { id: rId },
          include: {
            user: { select: { id: true, name: true } },
          },
        })
        if (report) {
          const reportDate = new Date(report.date)
          const dateStr = `${reportDate.getMonth() + 1}月${reportDate.getDate()}日`
          if (action === 'bulk_approve') {
            notifyReportApproved(report.user.id, dateStr, rId, admin.name).catch(() => {})
          } else {
            notifyReportRejected(report.user.id, dateStr, rId, admin.name).catch(() => {})
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: action === 'bulk_approve' ? `${reportIds.length}件を承認しました` : `${reportIds.length}件を差戻ししました`,
        processedCount: reportIds.length,
      })
    }

    if (action === 'approve_all' || action === 'reject_all') {
      // 日報の全承認レコードを一括更新
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

      // 更新後のデータを取得
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

      // 通知: 日報作成者に承認/差戻しを通知
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

    // 通知: 日報作成者に個別承認/差戻しを通知
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
