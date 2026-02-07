import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 物件一覧を取得（最適化版）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // active, completed, all

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    // 物件一覧と、各物件の日報数・最新日報日を効率的に取得
    const projects = await prisma.project.findMany({
      where,
      include: {
        _count: {
          select: { workReports: true }
        },
        workReports: {
          select: { date: true },
          orderBy: { date: 'desc' },
          take: 1, // 最新1件のみ取得（N+1対策）
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // 日報件数を追加
    const projectsWithCounts = projects.map(project => ({
      id: project.id,
      name: project.name,
      projectType: project.projectType,
      projectCode: project.projectCode,
      client: project.client,
      location: project.location,
      status: project.status,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      notes: project.notes,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      reportCount: project._count.workReports,
      lastReportDate: project.workReports[0]?.date || null,
    }))

    return NextResponse.json(projectsWithCounts)
  } catch (error) {
    console.error('物件取得エラー:', error)
    return NextResponse.json(
      { error: '物件の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 物件を新規登録
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const project = await prisma.project.create({
      data: {
        name: body.name,
        projectType: body.projectType,
        projectCode: body.projectCode,
        client: body.client,
        location: body.location,
        status: body.status || 'active',
      },
    })

    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    console.error('物件登録エラー:', error)
    return NextResponse.json(
      { error: '物件の登録に失敗しました' },
      { status: 500 }
    )
  }
}
