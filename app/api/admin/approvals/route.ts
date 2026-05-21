import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyReportApproved, notifyReportRejected } from '@/lib/notifications'
import { requirePermission, authErrorResponse } from '@/lib/auth'
import { logAuditEvent } from '@/lib/audit-log'

// 承認者の役職/フラグ → 承認可能なapproverRoleの対応
function getApprovalRolesForUser(user: { position?: string | null; isAuthorizer?: boolean | null }): string[] {
  const roles: string[] = []
  switch (user.position) {
    case '部長':
    case '課長':
      roles.push('上長')
      break
    case '常務':
      roles.push('常務')
      break
    case '専務':
      roles.push('専務')
      break
    case '社長':
      roles.push('社長')
      break
  }
  if (user.isAuthorizer) {
    roles.push('承認者')
  }
  return roles
}

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

    // 営業日報一覧を取得（ページネーション対応）
    const salesReports = await prisma.dailyReport.findMany({
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

    // 作業日報一覧を取得（同じ status フィルタを適用）
    const workWhere: any = {}
    if (status === 'pending') {
      workWhere.approvals = { some: { status: 'pending' } }
    } else if (status === 'approved') {
      workWhere.approvals = { every: { status: 'approved' }, some: {} }
    } else if (status === 'rejected') {
      workWhere.approvals = { some: { status: 'rejected' } }
    } else {
      // 'all' でも承認レコードが付いている作業日報のみ
      workWhere.approvals = { some: {} }
    }
    const workReportsRaw = await prisma.workReport.findMany({
      where: workWhere,
      orderBy: { date: 'desc' },
      ...(usePagination ? { skip: (page - 1) * limit, take: limit } : {}),
      include: {
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

    // 作業日報の userId → User 情報を取得
    const workUserIds = [...new Set(workReportsRaw.map(r => r.userId))]
    const workUsers = workUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: workUserIds } },
          select: { id: true, name: true, position: true },
        })
      : []
    const workUserMap = new Map(workUsers.map(u => [u.id, u]))

    // 統合: 種別マーキングして date 降順で合体
    const reports = [
      ...salesReports.map(r => ({ ...r, reportType: 'sales' as const })),
      ...workReportsRaw.map(r => ({
        ...r,
        reportType: 'work' as const,
        user: workUserMap.get(r.userId) || { id: r.userId, name: '(不明)', position: null },
        visitRecords: [] as any[],
        approvalRoute: null,
        specialNotes: null,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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
          select: { id: true, name: true, position: true, defaultReportType: true },
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

      // ステータス3値判定（未提出 / 要確認 / 提出済）
      // 必要日報（defaultReportType: sales/work/both）と実提出（submissionTypeMap）から計算
      // 休暇日は対象外（leaveMapが優先表示されるため判定スキップ）
      const statusMap: Record<string, Record<string, 'none' | 'partial' | 'complete'>> = {}
      activeUsers.forEach(u => {
        statusMap[u.id] = {}
      })

      // 期間内の全日付を列挙
      const allDateKeys: string[] = []
      {
        const cursor = new Date(periodStart)
        while (cursor <= periodEnd) {
          allDateKeys.push(cursor.toISOString().split('T')[0])
          cursor.setDate(cursor.getDate() + 1)
        }
      }

      const todayKey = new Date().toISOString().split('T')[0]

      activeUsers.forEach(u => {
        const required = u.defaultReportType // 'sales' | 'work' | 'both'
        allDateKeys.forEach(dateKey => {
          // 未来日・休暇日はステータス判定スキップ
          if (dateKey > todayKey) return
          if (leaveMap[u.id]?.[dateKey]) return

          const types = submissionTypeMap[u.id]?.[dateKey] || []
          const hasSales = types.some(e => e.type === 'sales')
          const hasWork = types.some(e => e.type === 'work')

          let status: 'none' | 'partial' | 'complete'
          if (required === 'sales') {
            status = hasSales ? 'complete' : 'none'
          } else if (required === 'work') {
            status = hasWork ? 'complete' : 'none'
          } else {
            // both
            if (hasSales && hasWork) status = 'complete'
            else if (hasSales || hasWork) status = 'partial'
            else status = 'none'
          }
          statusMap[u.id][dateKey] = status
        })
      })

      submissionStatus = {
        users: activeUsers,
        year: displayYear,
        month: displayMonth,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        submissionMap,
        submissionTypeMap,
        statusMap,
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

      // 承認者の役職に対応するロールのみ更新
      const adminUser = await prisma.user.findUnique({ where: { id: admin.id }, select: { position: true, isAuthorizer: true } })
      const allowedRoles = getApprovalRolesForUser(adminUser || {})

      if (allowedRoles.length === 0) {
        return NextResponse.json(
          { error: '承認権限がありません（役職または「承認者」の設定が必要です）' },
          { status: 403 }
        )
      }

      // 承認者枠は本人の枠のみ、それ以外は役職一致で更新
      const nonAuthorizerRoles = allowedRoles.filter(r => r !== '承認者')
      const includesAuthorizer = allowedRoles.includes('承認者')

      await prisma.$transaction(async (tx) => {
        if (nonAuthorizerRoles.length > 0) {
          await tx.approval.updateMany({
            where: { dailyReportId: { in: reportIds }, approverRole: { in: nonAuthorizerRoles } },
            data: {
              status: newStatus,
              approverUserId: admin.id,
              approvedAt: newStatus === 'approved' ? new Date() : null,
            },
          })
        }
        if (includesAuthorizer) {
          await tx.approval.updateMany({
            where: { dailyReportId: { in: reportIds }, approverRole: '承認者', approverUserId: admin.id },
            data: {
              status: newStatus,
              approvedAt: newStatus === 'approved' ? new Date() : null,
            },
          })
        }
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

      // 承認者の役職に対応するロールのみ更新
      const adminUserForAll = await prisma.user.findUnique({ where: { id: admin.id }, select: { position: true, isAuthorizer: true } })
      const allowedRolesForAll = getApprovalRolesForUser(adminUserForAll || {})

      if (allowedRolesForAll.length === 0) {
        return NextResponse.json(
          { error: '承認権限がありません（役職または「承認者」の設定が必要です）' },
          { status: 403 }
        )
      }

      const nonAuthorizerRolesAll = allowedRolesForAll.filter(r => r !== '承認者')
      const includesAuthorizerAll = allowedRolesForAll.includes('承認者')

      if (nonAuthorizerRolesAll.length > 0) {
        await prisma.approval.updateMany({
          where: { dailyReportId: reportId, approverRole: { in: nonAuthorizerRolesAll } },
          data: {
            status: newStatus,
            approverUserId: admin.id,
            approvedAt: newStatus === 'approved' ? new Date() : null,
          },
        })
      }
      if (includesAuthorizerAll) {
        await prisma.approval.updateMany({
          where: { dailyReportId: reportId, approverRole: '承認者', approverUserId: admin.id },
          data: {
            status: newStatus,
            approvedAt: newStatus === 'approved' ? new Date() : null,
          },
        })
      }

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

    // 営業日報の Approval を検索、無ければ作業日報の WorkReportApproval を検索
    const salesApproval = await prisma.approval.findUnique({ where: { id: approvalId } })
    const workApproval = salesApproval ? null : await prisma.workReportApproval.findUnique({ where: { id: approvalId } })

    if (!salesApproval && !workApproval) {
      return NextResponse.json(
        { error: '承認レコードが見つかりません' },
        { status: 404 }
      )
    }

    const approval = salesApproval || workApproval!
    const isWorkReport = !!workApproval

    // 自己承認チェック（個別）
    const targetUserId = isWorkReport
      ? (await prisma.workReport.findUnique({ where: { id: workApproval!.workReportId }, select: { userId: true } }))?.userId
      : (await prisma.dailyReport.findUnique({ where: { id: salesApproval!.dailyReportId }, select: { userId: true } }))?.userId

    if (targetUserId === admin.id) {
      return NextResponse.json(
        { error: '自分の日報を承認することはできません' },
        { status: 403 }
      )
    }

    // 役職チェック: 承認者が該当する役職の承認のみ操作可能
    const adminUserIndiv = await prisma.user.findUnique({ where: { id: admin.id }, select: { position: true, isAuthorizer: true } })
    const allowedRolesIndiv = getApprovalRolesForUser(adminUserIndiv || {})
    if (allowedRolesIndiv.length === 0 || !allowedRolesIndiv.includes(approval.approverRole)) {
      return NextResponse.json(
        { error: `この承認は${approval.approverRole}のみ操作可能です` },
        { status: 403 }
      )
    }

    // 「承認者」枠は事前に approverUserId が設定されている場合、本人のみ操作可
    if (approval.approverRole === '承認者' && approval.approverUserId && approval.approverUserId !== admin.id) {
      return NextResponse.json(
        { error: 'この承認者枠は他の方の枠です' },
        { status: 403 }
      )
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    const updatedApproval = isWorkReport
      ? await prisma.workReportApproval.update({
          where: { id: approvalId },
          data: {
            status: newStatus,
            approverUserId: admin.id,
            approvedAt: newStatus === 'approved' ? new Date() : null,
          },
          include: { approver: { select: { id: true, name: true, position: true } } },
        })
      : await prisma.approval.update({
          where: { id: approvalId },
          data: {
            status: newStatus,
            approverUserId: admin.id,
            approvedAt: newStatus === 'approved' ? new Date() : null,
          },
          include: { approver: { select: { id: true, name: true, position: true } } },
        })

    const reportIdForNotify = isWorkReport ? workApproval!.workReportId : salesApproval!.dailyReportId
    if (targetUserId) {
      const reportDate = new Date()
      const dateStr = `${reportDate.getMonth() + 1}月${reportDate.getDate()}日`
      if (action === 'approve') {
        notifyReportApproved(targetUserId, dateStr, reportIdForNotify, admin.name).catch(() => {})
      } else {
        notifyReportRejected(targetUserId, dateStr, reportIdForNotify, admin.name).catch(() => {})
      }
    }

    logAuditEvent({
      userId: admin.id,
      action: action === 'approve' ? 'report_approved' : 'report_rejected',
      targetType: isWorkReport ? 'work_report' : 'nippo',
      targetId: reportIdForNotify,
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
