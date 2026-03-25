import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyReportApproved, notifyReportRejected } from '@/lib/notifications'
import { requirePermission, authErrorResponse } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit-log'

// 承認待ち日報一覧を取得（管理者用）
export async function GET(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await requirePermission(request, 'approve_reports')
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

      // 並列でクエリ実行（営業日報 + 作業日報 + 休暇届の3つを取得）
      const [activeUsers, periodReports, periodWorkReports, periodLeaveRequests] = await Promise.all([
        prisma.user.findMany({
          where: { isActive: true, showInCalendar: true },
          select: { id: true, name: true, position: true },
          orderBy: { name: 'asc' },
        }),
        prisma.dailyReport.findMany({
          where: {
            date: { gte: periodStart, lte: periodEnd },
          },
          select: {
            id: true,
            userId: true,
            date: true,
            approvals: {
              select: { status: true },
              orderBy: { createdAt: 'desc' as const },
            },
          },
        }),
        // 作業日報も取得（作成者 + workerRecordsに含まれる作業者名で提出判定）
        prisma.workReport.findMany({
          where: {
            date: { gte: periodStart, lte: periodEnd },
          },
          select: {
            id: true,
            userId: true,
            date: true,
            workerRecords: {
              select: { name: true },
            },
          },
        }),
        // 休暇届を取得
        prisma.leaveRequest.findMany({
          where: {
            date: { gte: periodStart, lte: periodEnd },
          },
          select: {
            id: true,
            userId: true,
            date: true,
            leaveType: true,
            reason: true,
            attachmentName: true,
          },
        }),
      ])

      // ユーザー名からIDへのマッピングを作成（workerRecord.nameでの照合用）
      // スペース除去版でもマッピングを作成して柔軟に照合
      const nameToUserIds: Record<string, string[]> = {}
      const normalizedNameToUserIds: Record<string, string[]> = {}
      activeUsers.forEach(u => {
        // 元の名前でマッピング
        if (!nameToUserIds[u.name]) {
          nameToUserIds[u.name] = []
        }
        nameToUserIds[u.name].push(u.id)

        // 正規化（全角・半角スペース除去）版でもマッピング
        const normalized = u.name.replace(/[\s　]+/g, '')
        if (!normalizedNameToUserIds[normalized]) {
          normalizedNameToUserIds[normalized] = []
        }
        normalizedNameToUserIds[normalized].push(u.id)
      })

      // マップ作成（提出種別も記録: 'sales'=営業日報, 'work'=作業日報）
      const submissionMap: Record<string, Record<string, boolean>> = {}
      const submissionTypeMap: Record<string, Record<string, { type: string; id: string }[]>> = {}
      activeUsers.forEach(u => {
        submissionMap[u.id] = {}
        submissionTypeMap[u.id] = {}
      })

      // 承認状況マップ（userId -> dateKey -> 'approved' | 'pending'）
      const approvalMap: Record<string, Record<string, string>> = {}
      activeUsers.forEach(u => {
        approvalMap[u.id] = {}
      })

      // 営業日報の提出状況（作成者ベース）
      periodReports.forEach(r => {
        const dateKey = new Date(r.date).toISOString().split('T')[0]
        if (submissionMap[r.userId]) {
          submissionMap[r.userId][dateKey] = true
          if (!submissionTypeMap[r.userId][dateKey]) submissionTypeMap[r.userId][dateKey] = []
          if (!submissionTypeMap[r.userId][dateKey].some(e => e.type === 'sales')) submissionTypeMap[r.userId][dateKey].push({ type: 'sales', id: r.id })
          // 承認状況
          if (r.approvals && r.approvals.length > 0) {
            const allApproved = r.approvals.every((a: any) => a.status === 'approved')
            if (allApproved) {
              approvalMap[r.userId][dateKey] = 'approved'
            }
          }
        }
      })

      // 作業日報の提出状況（作成者 + workerRecordsに名前が含まれるユーザー）
      periodWorkReports.forEach(r => {
        const dateKey = new Date(r.date).toISOString().split('T')[0]
        // 作成者自身を提出済みにする
        if (submissionMap[r.userId]) {
          submissionMap[r.userId][dateKey] = true
          if (!submissionTypeMap[r.userId][dateKey]) submissionTypeMap[r.userId][dateKey] = []
          if (!submissionTypeMap[r.userId][dateKey].some(e => e.type === 'work' && e.id === r.id)) submissionTypeMap[r.userId][dateKey].push({ type: 'work', id: r.id })
        }
        // workerRecordsに含まれる名前と一致するユーザーも提出済みにする
        r.workerRecords.forEach(worker => {
          // まず完全一致を試す
          let matchedUserIds = nameToUserIds[worker.name]

          // 完全一致しない場合は、スペースを除去して照合
          if (!matchedUserIds) {
            const normalizedWorkerName = worker.name.replace(/[\s　]+/g, '')
            matchedUserIds = normalizedNameToUserIds[normalizedWorkerName]
          }

          if (matchedUserIds) {
            matchedUserIds.forEach(uid => {
              if (submissionMap[uid]) {
                submissionMap[uid][dateKey] = true
                if (!submissionTypeMap[uid][dateKey]) submissionTypeMap[uid][dateKey] = []
                if (!submissionTypeMap[uid][dateKey].some(e => e.type === 'work' && e.id === r.id)) submissionTypeMap[uid][dateKey].push({ type: 'work', id: r.id })
              }
            })
          }
        })
      })

      // 休暇マップ作成（userId -> dateKey -> { id, type, reason, attachmentName }）
      const leaveMap: Record<string, Record<string, { id: string; type: string; reason?: string; attachmentName?: string }>> = {}
      activeUsers.forEach(u => {
        leaveMap[u.id] = {}
      })
      periodLeaveRequests.forEach(r => {
        const dateKey = new Date(r.date).toISOString().split('T')[0]
        if (leaveMap[r.userId]) {
          leaveMap[r.userId][dateKey] = {
            id: r.id,
            type: r.leaveType,
            reason: r.reason || undefined,
            attachmentName: r.attachmentName || undefined,
          }
        }
      })

      submissionStatus = {
        users: activeUsers,
        year: displayYear,
        month: displayMonth,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        submissionMap,
        submissionTypeMap,
        leaveMap,
        approvalMap,
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
    const authResult = await requirePermission(request, 'approve_reports')
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

      // 自己承認チェック（一括）
      const ownReports = await prisma.dailyReport.findMany({
        where: { id: { in: reportIds }, userId: admin.id },
        select: { id: true },
      })
      if (ownReports.length > 0) {
        return NextResponse.json(
          { error: '自分の日報を承認することはできません' },
          { status: 403 }
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

      logAuditEvent({
        userId: admin.id,
        action: action === 'bulk_approve' ? 'report_bulk_approved' : 'report_bulk_rejected',
        targetType: 'nippo',
        details: { reportIds, count: reportIds.length },
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

      // 自己承認チェック
      const targetReport = await prisma.dailyReport.findUnique({
        where: { id: reportId },
        select: { userId: true },
      })
      if (targetReport?.userId === admin.id) {
        return NextResponse.json(
          { error: '自分の日報を承認することはできません' },
          { status: 403 }
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

      logAuditEvent({
        userId: admin.id,
        action: action === 'approve_all' ? 'report_approved' : 'report_rejected',
        targetType: 'nippo',
        targetId: reportId,
      })

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

    // 自己承認チェック（個別）
    const approvalReport = await prisma.dailyReport.findUnique({
      where: { id: approval.dailyReportId },
      select: { userId: true },
    })
    if (approvalReport?.userId === admin.id) {
      return NextResponse.json(
        { error: '自分の日報を承認することはできません' },
        { status: 403 }
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

    logAuditEvent({
      userId: admin.id,
      action: action === 'approve' ? 'report_approved' : 'report_rejected',
      targetType: 'nippo',
      targetId: approval.dailyReportId,
    })

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
