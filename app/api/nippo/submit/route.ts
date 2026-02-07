import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reportIds, approvalRouteId } = body

    if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
      return NextResponse.json(
        { error: '申請する日報を選択してください' },
        { status: 400 }
      )
    }

    // 選択された日報が申請者のものか確認
    const reports = await prisma.dailyReport.findMany({
      where: {
        id: { in: reportIds },
        userId
      },
      include: {
        approvals: true
      }
    })

    if (reports.length !== reportIds.length) {
      return NextResponse.json(
        { error: '不正な日報IDが含まれています' },
        { status: 400 }
      )
    }

    // 既に承認申請されている日報をチェック
    const alreadySubmitted = reports.filter(report =>
      report.approvals.length > 0
    )

    if (alreadySubmitted.length > 0) {
      return NextResponse.json(
        { error: '既に申請済みの日報が含まれています' },
        { status: 400 }
      )
    }

    // 承認ルートから承認者役職リストを取得
    let approvalRoles: string[] = []
    let routeId: string | undefined = undefined

    if (approvalRouteId) {
      const route = await prisma.approvalRoute.findUnique({
        where: { id: approvalRouteId },
      })
      if (route && route.isActive) {
        approvalRoles = JSON.parse(route.roles)
        routeId = route.id
      }
    }

    if (approvalRoles.length === 0) {
      const defaultRoute = await prisma.approvalRoute.findFirst({
        where: { isDefault: true, isActive: true },
      })
      if (defaultRoute) {
        approvalRoles = JSON.parse(defaultRoute.roles)
        routeId = defaultRoute.id
      }
    }

    if (approvalRoles.length === 0) {
      // フォールバック
      approvalRoles = ['社長', '専務', '常務', '部長']
    }

    // 各日報に対して承認レコードを作成
    const approvalRecords: { dailyReportId: string; approverRole: string; status: string }[] = []
    for (const reportId of reportIds) {
      for (const role of approvalRoles) {
        approvalRecords.push({
          dailyReportId: reportId,
          approverRole: role,
          status: 'pending',
        })
      }
    }

    await prisma.approval.createMany({
      data: approvalRecords
    })

    // 承認ルートIDを日報に記録
    if (routeId) {
      await prisma.dailyReport.updateMany({
        where: { id: { in: reportIds } },
        data: { approvalRouteId: routeId },
      })
    }

    return NextResponse.json({
      success: true,
      message: `${reportIds.length}件の日報を申請しました`,
      count: reportIds.length
    })
  } catch (error) {
    console.error('日報申請エラー:', error)
    return NextResponse.json(
      { error: '日報の申請に失敗しました' },
      { status: 500 }
    )
  }
}
