import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    const userId = user.id

    const body = await request.json()
    const { reportIds } = body

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

    // 各日報に対して4段階承認レコードを作成
    const approvalRoles = ['上長', '常務', '専務', '社長']
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
