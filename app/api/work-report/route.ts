import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

// 作業日報一覧を取得
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const projectRefId = searchParams.get('projectRefId')
    const where: any = {}

    if (userId) {
      where.userId = userId
    }

    if (projectRefId) {
      where.projectRefId = projectRefId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const workReports = await prisma.workReport.findMany({
      where,
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
    })

    return NextResponse.json(workReports)
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

    return NextResponse.json(workReport, { status: 201 })
  } catch (error) {
    console.error('作業日報作成エラー:', error)
    return NextResponse.json(
      { error: '作業日報の作成に失敗しました' },
      { status: 500 }
    )
  }
}
