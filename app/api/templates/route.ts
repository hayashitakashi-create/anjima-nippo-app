import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// テンプレート一覧取得
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // 自分のテンプレート + 共有テンプレートを取得
    const templates = await prisma.workReportTemplate.findMany({
      where: {
        OR: [
          { userId: userId },
          { isShared: true },
        ],
      },
      orderBy: [
        { isShared: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('テンプレート取得エラー:', error)
    return NextResponse.json({ error: 'テンプレートの取得に失敗しました' }, { status: 500 })
  }
}

// テンプレート作成
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      projectRefId,
      projectName,
      projectType,
      remoteDepartureTime,
      remoteArrivalTime,
      remoteDepartureTime2,
      remoteArrivalTime2,
      trafficGuardCount,
      trafficGuardStart,
      trafficGuardEnd,
      workerRecords,
      materialRecords,
      subcontractorRecords,
      isShared,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'テンプレート名は必須です' }, { status: 400 })
    }

    const template = await prisma.workReportTemplate.create({
      data: {
        userId,
        name,
        projectRefId: projectRefId || null,
        projectName: projectName || null,
        projectType: projectType || null,
        remoteDepartureTime: remoteDepartureTime || null,
        remoteArrivalTime: remoteArrivalTime || null,
        remoteDepartureTime2: remoteDepartureTime2 || null,
        remoteArrivalTime2: remoteArrivalTime2 || null,
        trafficGuardCount: trafficGuardCount || null,
        trafficGuardStart: trafficGuardStart || null,
        trafficGuardEnd: trafficGuardEnd || null,
        workerRecords: workerRecords ? JSON.stringify(workerRecords) : null,
        materialRecords: materialRecords ? JSON.stringify(materialRecords) : null,
        subcontractorRecords: subcontractorRecords ? JSON.stringify(subcontractorRecords) : null,
        isShared: isShared || false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('テンプレート作成エラー:', error)
    return NextResponse.json({ error: 'テンプレートの作成に失敗しました' }, { status: 500 })
  }
}

// テンプレート更新
export async function PUT(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'テンプレートIDは必須です' }, { status: 400 })
    }

    // 自分のテンプレートか確認
    const existing = await prisma.workReportTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'テンプレートが見つかりません' }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: '他のユーザーのテンプレートは編集できません' }, { status: 403 })
    }

    const template = await prisma.workReportTemplate.update({
      where: { id },
      data: {
        name: updateData.name,
        projectRefId: updateData.projectRefId || null,
        projectName: updateData.projectName || null,
        projectType: updateData.projectType || null,
        remoteDepartureTime: updateData.remoteDepartureTime || null,
        remoteArrivalTime: updateData.remoteArrivalTime || null,
        remoteDepartureTime2: updateData.remoteDepartureTime2 || null,
        remoteArrivalTime2: updateData.remoteArrivalTime2 || null,
        trafficGuardCount: updateData.trafficGuardCount || null,
        trafficGuardStart: updateData.trafficGuardStart || null,
        trafficGuardEnd: updateData.trafficGuardEnd || null,
        workerRecords: updateData.workerRecords ? JSON.stringify(updateData.workerRecords) : null,
        materialRecords: updateData.materialRecords ? JSON.stringify(updateData.materialRecords) : null,
        subcontractorRecords: updateData.subcontractorRecords ? JSON.stringify(updateData.subcontractorRecords) : null,
        isShared: updateData.isShared || false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('テンプレート更新エラー:', error)
    return NextResponse.json({ error: 'テンプレートの更新に失敗しました' }, { status: 500 })
  }
}

// テンプレート削除
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'テンプレートIDは必須です' }, { status: 400 })
    }

    // 自分のテンプレートか確認
    const existing = await prisma.workReportTemplate.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'テンプレートが見つかりません' }, { status: 404 })
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ error: '他のユーザーのテンプレートは削除できません' }, { status: 403 })
    }

    await prisma.workReportTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('テンプレート削除エラー:', error)
    return NextResponse.json({ error: 'テンプレートの削除に失敗しました' }, { status: 500 })
  }
}
