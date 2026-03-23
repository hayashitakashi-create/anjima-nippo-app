import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { notifyLeaveSubmitted } from '@/lib/notifications'

// 休暇届一覧取得
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }
    const { user } = authResult

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const allUsers = searchParams.get('all') === 'true'
    const month = searchParams.get('month') // YYYY-MM format
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    // 管理者は全ユーザー取得可能、一般は自分のみ
    if (allUsers) {
      const perms = await getUserPermissions(user.role)
      if (!perms.view_all_reports) {
        where.userId = user.id
      }
    } else {
      where.userId = userId || user.id
    }

    if (month) {
      const [year, mon] = month.split('-').map(Number)
      const from = new Date(year, mon - 1, 1)
      const to = new Date(year, mon, 0, 23, 59, 59, 999)
      where.date = { gte: from, lte: to }
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        userId: true,
        date: true,
        leaveType: true,
        leaveUnit: true,
        startTime: true,
        endTime: true,
        reason: true,
        attachmentName: true,
        attachmentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // 全ユーザー取得時はユーザー名もJOIN
    if (allUsers || (userId && userId !== user.id)) {
      const userIds = [...new Set(leaveRequests.map(l => l.userId))]
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      })
      const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))
      const enriched = leaveRequests.map(l => ({ ...l, userName: userMap[l.userId] || '' }))
      return NextResponse.json({ leaveRequests: enriched })
    }

    return NextResponse.json({ leaveRequests })
  } catch (error) {
    console.error('休暇届取得エラー:', error)
    return NextResponse.json({ error: '休暇届の取得に失敗しました' }, { status: 500 })
  }
}

// 休暇届作成
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }
    const { user } = authResult

    const body = await request.json()
    const { date, leaveType, leaveUnit, startTime, endTime, reason, attachmentData, attachmentName, attachmentType } = body

    if (!date) {
      return NextResponse.json({ error: '日付は必須です' }, { status: 400 })
    }
    if (!leaveType) {
      return NextResponse.json({ error: '休暇種別は必須です' }, { status: 400 })
    }

    const validTypes = ['有給', '振替', '代休', '看護', '介護', '特別休暇', 'その他']
    if (!validTypes.includes(leaveType)) {
      return NextResponse.json({ error: '無効な休暇種別です' }, { status: 400 })
    }

    const validUnits = ['full', 'am', 'pm', 'hourly']
    const unit = leaveUnit || 'full'
    if (!validUnits.includes(unit)) {
      return NextResponse.json({ error: '無効な休暇単位です' }, { status: 400 })
    }

    // 時間休の場合は開始・終了時刻が必須
    if (unit === 'hourly' && (!startTime || !endTime)) {
      return NextResponse.json({ error: '時間休の場合は開始時刻と終了時刻を入力してください' }, { status: 400 })
    }

    // 同じ日に全日休暇が既にある場合はエラー
    const existingFullDay = await prisma.leaveRequest.findFirst({
      where: {
        userId: user.id,
        date: new Date(date),
        leaveUnit: 'full',
      },
    })
    if (existingFullDay) {
      return NextResponse.json({ error: 'この日付には既に全日の休暇届が登録されています' }, { status: 409 })
    }

    // 全日で申請する場合、同日に既存の休暇届があればエラー
    if (unit === 'full') {
      const existingAny = await prisma.leaveRequest.findFirst({
        where: { userId: user.id, date: new Date(date) },
      })
      if (existingAny) {
        return NextResponse.json({ error: 'この日付には既に休暇届が登録されています' }, { status: 409 })
      }
    }

    // 同じ時間帯（午前/午後）の重複チェック
    if (unit === 'am' || unit === 'pm') {
      const existingSameUnit = await prisma.leaveRequest.findFirst({
        where: { userId: user.id, date: new Date(date), leaveUnit: unit },
      })
      if (existingSameUnit) {
        return NextResponse.json({ error: `この日付には既に${unit === 'am' ? '午前' : '午後'}半休が登録されています` }, { status: 409 })
      }
    }

    // 添付ファイルサイズチェック (base64で約5MB = 約6.7MB文字列)
    if (attachmentData && attachmentData.length > 7_000_000) {
      return NextResponse.json({ error: '添付ファイルは5MB以下にしてください' }, { status: 400 })
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        date: new Date(date),
        leaveType,
        leaveUnit: unit,
        startTime: unit === 'hourly' ? startTime : null,
        endTime: unit === 'hourly' ? endTime : null,
        reason: reason || null,
        attachmentData: attachmentData || null,
        attachmentName: attachmentName || null,
        attachmentType: attachmentType || null,
        status: 'pending',
      },
    })

    // 管理者に通知（非同期）
    const dateObj = new Date(date)
    const dateStr = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`
    notifyLeaveSubmitted(user.name, dateStr, leaveType).catch(() => {})

    return NextResponse.json({ leaveRequest })
  } catch (error) {
    console.error('休暇届作成エラー:', error)
    return NextResponse.json({ error: '休暇届の作成に失敗しました' }, { status: 500 })
  }
}
