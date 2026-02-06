import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 物件を個別取得
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

    return NextResponse.json(project)
  } catch (error) {
    console.error('物件取得エラー:', error)
    return NextResponse.json(
      { error: '物件の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 物件を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        projectType: body.projectType,
        projectCode: body.projectCode,
        client: body.client,
        location: body.location,
        status: body.status,
      },
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
