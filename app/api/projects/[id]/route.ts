import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 物件を個別取得（日報一覧付き）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        workReports: {
          select: {
            id: true,
            date: true,
            userId: true,
            weather: true,
            projectName: true,
            projectType: true,
            contactNotes: true,
            workerRecords: {
              select: {
                id: true,
                name: true,
                workType: true,
                workHours: true,
              },
              orderBy: { order: 'asc' },
            },
            materialRecords: {
              select: {
                id: true,
                name: true,
                amount: true,
              },
              orderBy: { order: 'asc' },
            },
            subcontractorRecords: {
              select: {
                id: true,
                name: true,
                workerCount: true,
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: '物件が見つかりません' },
        { status: 404 }
      )
    }

    // 集計情報を追加
    const totalWorkerHours = project.workReports.reduce((sum, wr) => {
      return sum + wr.workerRecords.reduce((s, w) => s + (w.workHours || 0), 0)
    }, 0)

    const totalMaterialCost = project.workReports.reduce((sum, wr) => {
      return sum + wr.materialRecords.reduce((s, m) => s + (m.amount || 0), 0)
    }, 0)

    const totalWorkers = new Set(
      project.workReports.flatMap(wr => wr.workerRecords.map(w => w.name))
    ).size

    return NextResponse.json({
      ...project,
      summary: {
        reportCount: project.workReports.length,
        totalWorkerHours,
        totalMaterialCost,
        totalWorkers,
        lastReportDate: project.workReports[0]?.date || null,
      },
    })
  } catch (error) {
    console.error('物件取得エラー:', error)
    return NextResponse.json(
      { error: '物件の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 物件を更新（編集・アーカイブ・進捗率更新）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const data: any = {}

    // 更新可能なフィールドのみ設定
    if (body.name !== undefined) data.name = body.name
    if (body.projectType !== undefined) data.projectType = body.projectType
    if (body.projectCode !== undefined) data.projectCode = body.projectCode
    if (body.client !== undefined) data.client = body.client
    if (body.location !== undefined) data.location = body.location
    if (body.status !== undefined) data.status = body.status
    if (body.progress !== undefined) data.progress = body.progress
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.notes !== undefined) data.notes = body.notes

    const project = await prisma.project.update({
      where: { id },
      data,
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('物件更新エラー:', error)
    return NextResponse.json(
      { error: '物件の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 物件を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 紐づく日報があるか確認
    const reportCount = await prisma.workReport.count({
      where: { projectRefId: id },
    })

    if (reportCount > 0) {
      return NextResponse.json(
        { error: `この物件には${reportCount}件の日報が紐づいているため削除できません。アーカイブをご利用ください。` },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ message: '物件を削除しました' })
  } catch (error) {
    console.error('物件削除エラー:', error)
    return NextResponse.json(
      { error: '物件の削除に失敗しました' },
      { status: 500 }
    )
  }
}
