import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { WorkReportInput } from '../route'
import { notifyReportSubmitted } from '@/lib/notifications'

// 工数をサーバー側で計算（1時間 = 0.125、昼休憩12:00-13:00を自動控除）
function calcWorkHours(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 0
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  if (endMinutes <= startMinutes) return 0

  let totalMinutes = endMinutes - startMinutes

  const lunchStart = 12 * 60
  const lunchEnd = 13 * 60
  if (startMinutes < lunchEnd && endMinutes > lunchStart) {
    const overlapStart = Math.max(startMinutes, lunchStart)
    const overlapEnd = Math.min(endMinutes, lunchEnd)
    totalMinutes -= (overlapEnd - overlapStart)
  }

  const hours = totalMinutes / 60
  return Number((hours * 0.125).toFixed(5))
}

// 作業日報の個別取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const userId = user.id

    const { id } = await params

    const report = await prisma.workReport.findUnique({
      where: { id },
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
        approvals: {
          include: {
            approver: { select: { id: true, name: true, position: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!report) {
      return NextResponse.json(
        { error: '作業日報が見つかりません' },
        { status: 404 }
      )
    }

    // 自分の日報か閲覧権限があるか確認
    if (report.userId !== userId) {
      const permissions = await getUserPermissions(user.role)
      if (!permissions.view_all_reports) {
        return NextResponse.json(
          { error: 'この作業日報にアクセスする権限がありません' },
          { status: 403 }
        )
      }
    }

    // 対象社員・入力者情報を付加
    const owner = await prisma.user.findUnique({
      where: { id: report.userId },
      select: { id: true, name: true, position: true },
    })
    let enteredBy: { id: string; name: string; position: string | null } | null = null
    if (report.enteredById && report.enteredById !== report.userId) {
      enteredBy = await prisma.user.findUnique({
        where: { id: report.enteredById },
        select: { id: true, name: true, position: true },
      })
    }

    return NextResponse.json({ ...report, user: owner, enteredBy })
  } catch (error) {
    console.error('作業日報取得エラー:', error)
    return NextResponse.json(
      { error: '作業日報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 作業日報の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const userId = user.id

    const { id } = await params
    const body: WorkReportInput = await request.json()

    // 既存の日報を確認
    const existingReport = await prisma.workReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: '作業日報が見つかりません' },
        { status: 404 }
      )
    }

    if (existingReport.userId !== userId) {
      return NextResponse.json(
        { error: 'この作業日報を更新する権限がありません' },
        { status: 403 }
      )
    }

    // トランザクションで子レコード削除＋日報更新を実行
    const updatedReport = await prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.workerRecord.deleteMany({ where: { workReportId: id } }),
        tx.materialRecord.deleteMany({ where: { workReportId: id } }),
        tx.subcontractorRecord.deleteMany({ where: { workReportId: id } }),
      ])

      return tx.workReport.update({
        where: { id },
        data: {
          date: new Date(body.date),
          projectName: body.projectName,
          projectType: body.projectType,
          projectId: body.projectId,
          weather: body.weather,
          contactNotes: body.contactNotes,
          remoteDepartureTime: body.remoteDepartureTime,
          remoteArrivalTime: body.remoteArrivalTime,
          remoteDepartureTime2: body.remoteDepartureTime2,
          remoteArrivalTime2: body.remoteArrivalTime2,
          trafficGuardCount: body.trafficGuardCount,
          trafficGuardStart: body.trafficGuardStart,
          trafficGuardEnd: body.trafficGuardEnd,
          workerRecords: {
            create: body.workerRecords.map((record: any) => ({
              name: record.name,
              startTime: record.startTime,
              endTime: record.endTime,
              workHours: record.workHours || calcWorkHours(record.startTime, record.endTime),
              workType: record.workType,
              details: record.details,
              dailyHours: record.dailyHours,
              totalHours: record.totalHours,
              remainHours: record.remainHours,
              order: record.order,
            })),
          },
          materialRecords: {
            create: body.materialRecords.map((record: any) => ({
              name: record.name,
              volume: record.volume,
              volumeUnit: record.volumeUnit,
              quantity: record.quantity,
              unitPrice: record.unitPrice,
              amount: (record.quantity || 0) * (record.unitPrice || 0),
              subcontractor: record.subcontractor,
              order: record.order,
            })),
          },
          subcontractorRecords: {
            create: (body.subcontractorRecords || []).map((record: any) => ({
              name: record.name,
              workerCount: record.workerCount,
              workContent: record.workContent,
              order: record.order,
            })),
          },
        },
        include: {
          workerRecords: { orderBy: { order: 'asc' } },
          materialRecords: { orderBy: { order: 'asc' } },
          subcontractorRecords: { orderBy: { order: 'asc' } },
        },
      })
    })

    // 差戻し状態の日報が編集された場合は「再申請」扱いにする
    // - 全 Approval を pending にリセット
    // - rejectComment クリア
    // - 管理者へ再提出通知
    const hadRejected = await prisma.workReportApproval.findFirst({
      where: { workReportId: id, status: 'rejected' },
      select: { id: true },
    })
    if (hadRejected) {
      await prisma.workReportApproval.updateMany({
        where: { workReportId: id },
        data: { status: 'pending', approvedAt: null, rejectComment: null },
      })
      // 通知（管理者全員に再提出）
      const reportUser = await prisma.user.findUnique({ where: { id: updatedReport.userId }, select: { name: true } })
      if (reportUser) {
        const d = new Date(updatedReport.date)
        const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`
        notifyReportSubmitted(reportUser.name, dateStr, updatedReport.id, 'work', true).catch(() => {})
      }
    }

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('作業日報更新エラー:', error)
    return NextResponse.json(
      { error: '作業日報の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 作業日報の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const userId = user.id

    const { id } = await params

    const existingReport = await prisma.workReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: '作業日報が見つかりません' },
        { status: 404 }
      )
    }

    // 本人または編集権限のあるユーザーのみ削除可能
    if (existingReport.userId !== userId) {
      const permissions = await getUserPermissions(user.role)
      if (!permissions.edit_all_reports) {
        return NextResponse.json(
          { error: 'この作業日報を削除する権限がありません' },
          { status: 403 }
        )
      }
    }

    // onDelete: Cascade により子レコードも自動削除
    await prisma.workReport.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: '作業日報を削除しました' })
  } catch (error) {
    console.error('作業日報削除エラー:', error)
    return NextResponse.json(
      { error: '作業日報の削除に失敗しました' },
      { status: 500 }
    )
  }
}
