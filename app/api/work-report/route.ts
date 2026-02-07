import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyReportSubmitted } from '@/lib/notifications'
import { requireAuth, authErrorResponse } from '@/lib/auth'

export interface WorkReportInput {
  date: string | Date
  userId: string
  projectRefId?: string
  projectName: string
  projectType?: string
  projectId?: string
  weather?: string
  contactNotes?: string
  remoteDepartureTime?: string
  remoteArrivalTime?: string
  remoteDepartureTime2?: string
  remoteArrivalTime2?: string
  trafficGuardCount?: number
  trafficGuardStart?: string
  trafficGuardEnd?: string
  workerRecords: Array<{
    name: string
    startTime?: string
    endTime?: string
    workHours?: number
    workType?: string
    details?: string
    dailyHours?: number
    totalHours?: number
    remainHours?: number
    order: number
  }>
  materialRecords: Array<{
    name: string
    volume?: string
    volumeUnit?: string
    quantity?: number
    unitPrice?: number
    amount?: number
    subcontractor?: string
    order: number
  }>
  subcontractorRecords: Array<{
    name: string
    workerCount?: number
    workContent?: string
    order: number
  }>
}

// 作業日報一覧を取得（ページネーション対応）
export async function GET(request: NextRequest) {
  try {
    // JWT認証
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const keyword = searchParams.get('keyword')?.trim() || ''
    const projectRefId = searchParams.get('projectRefId')

    // ページネーション
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const skip = (page - 1) * limit

    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (projectRefId) {
      where.projectRefId = projectRefId
    }

    // 期間フィルター
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.date.lte = end
      }
    }

    // キーワード検索（案件名、工事種別、工事番号、連絡事項、作業者名、工種、材料名、外注先名）
    if (keyword) {
      where.OR = [
        { projectName: { contains: keyword } },
        { projectType: { contains: keyword } },
        { projectId: { contains: keyword } },
        { contactNotes: { contains: keyword } },
        {
          workerRecords: {
            some: {
              OR: [
                { name: { contains: keyword } },
                { workType: { contains: keyword } },
                { details: { contains: keyword } },
              ]
            }
          }
        },
        {
          materialRecords: {
            some: {
              OR: [
                { name: { contains: keyword } },
                { subcontractor: { contains: keyword } },
              ]
            }
          }
        },
        {
          subcontractorRecords: {
            some: {
              OR: [
                { name: { contains: keyword } },
                { workContent: { contains: keyword } },
              ]
            }
          }
        },
      ]
    }

    // 総件数と一覧を並列取得
    const [total, workReports] = await Promise.all([
      prisma.workReport.count({ where }),
      prisma.workReport.findMany({
        where,
        skip,
        take: limit,
        include: {
          workerRecords: {
            orderBy: {
              order: 'asc',
            },
          },
          materialRecords: {
            orderBy: {
              order: 'asc',
            },
          },
          subcontractorRecords: {
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      }),
    ])

    return NextResponse.json({
      reports: workReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('作業日報取得エラー:', error)
    return NextResponse.json(
      { error: '作業日報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// 作業日報を作成
export async function POST(request: NextRequest) {
  try {
    const body: WorkReportInput = await request.json()

    const workReport = await prisma.workReport.create({
      data: {
        date: new Date(body.date),
        userId: body.userId,
        projectRefId: body.projectRefId,
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
          create: body.workerRecords.map((record) => ({
            name: record.name,
            startTime: record.startTime,
            endTime: record.endTime,
            workHours: record.workHours,
            workType: record.workType,
            details: record.details,
            dailyHours: record.dailyHours,
            totalHours: record.totalHours,
            remainHours: record.remainHours,
            order: record.order,
          })),
        },
        materialRecords: {
          create: body.materialRecords.map((record) => ({
            name: record.name,
            volume: record.volume,
            volumeUnit: record.volumeUnit,
            quantity: record.quantity,
            unitPrice: record.unitPrice,
            amount: record.amount,
            subcontractor: record.subcontractor,
            order: record.order,
          })),
        },
        subcontractorRecords: {
          create: (body.subcontractorRecords || []).map((record) => ({
            name: record.name,
            workerCount: record.workerCount,
            workContent: record.workContent,
            order: record.order,
          })),
        },
      },
      include: {
        workerRecords: {
          orderBy: {
            order: 'asc',
          },
        },
        materialRecords: {
          orderBy: {
            order: 'asc',
          },
        },
        subcontractorRecords: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    })

    // 通知: 管理者に日報提出を通知（非同期・エラーは握りつぶす）
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: { name: true },
    })
    if (user) {
      const reportDate = new Date(body.date)
      const dateStr = `${reportDate.getMonth() + 1}月${reportDate.getDate()}日`
      notifyReportSubmitted(user.name, dateStr, workReport.id, 'work').catch(() => {})
    }

    return NextResponse.json(workReport, { status: 201 })
  } catch (error) {
    console.error('作業日報作成エラー:', error)
    return NextResponse.json(
      { error: '作業日報の作成に失敗しました' },
      { status: 500 }
    )
  }
}
