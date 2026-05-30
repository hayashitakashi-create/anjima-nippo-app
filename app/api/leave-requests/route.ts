import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { notifyLeaveSubmitted } from '@/lib/notifications'
import { leaveRequestSchema, validateRequest } from '@/lib/validations'

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
    const scope = searchParams.get('scope') // 'mine' | 'others' | 'all'
    const month = searchParams.get('month')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    // 名前比較は空白（半角・全角）除去後の一致で行う
    const normalize = (s: string | null | undefined) => (s || '').replace(/[\s　]+/g, '')
    const normalizedUserName = normalize(user.name)

    // 「自分の休暇届」判定はクエリでは完全に絞れないため、月フィルタ後にアプリ側で絞る
    let postFilterScope: 'mine' | 'others' | null = null

    if (scope === 'others') {
      const perms = await getUserPermissions(user.role)
      if (!perms.view_all_reports) {
        postFilterScope = 'mine'
      } else {
        postFilterScope = 'others'
      }
    } else if (scope === 'all' || allUsers) {
      const perms = await getUserPermissions(user.role)
      if (!perms.view_all_reports) {
        postFilterScope = 'mine'
      }
      // 管理者なら全件 (postFilterScope = null)
    } else if (userId) {
      where.userId = userId
    } else {
      postFilterScope = 'mine'
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

    const allLeaveRequests = await prisma.leaveRequest.findMany({
      where,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        userId: true,
        enteredById: true,
        applicantName: true,
        date: true,
        leaveType: true,
        leaveUnit: true,
        startTime: true,
        endTime: true,
        familyName: true,
        familyBirthdate: true,
        familyRelationship: true,
        adoptionDate: true,
        specialAdoptionDate: true,
        careReason: true,
        reason: true,
        attachmentName: true,
        attachmentType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      } as any,
    }) as any[]

    // 「自分の休暇届」判定: userId 一致を優先 / 過去データ互換で applicantName 一致もカバー
    const isMine = (l: { applicantName: string | null; userId: string }) => {
      if (l.userId === user.id) return true
      if (l.applicantName && normalize(l.applicantName) === normalizedUserName) return true
      return false
    }

    let leaveRequests = allLeaveRequests
    if (postFilterScope === 'mine') {
      leaveRequests = allLeaveRequests.filter(isMine)
    } else if (postFilterScope === 'others') {
      leaveRequests = allLeaveRequests.filter(l => !isMine(l))
    }

    // userId / enteredById をユーザー名で JOIN
    const userIds = new Set<string>()
    for (const l of leaveRequests) {
      if (l.userId) userIds.add(l.userId)
      if (l.enteredById) userIds.add(l.enteredById)
    }
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] } },
      select: { id: true, name: true },
    })
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))
    const enriched = leaveRequests.map((l: any) => {
      // 未登録者の代理申請(userId=代理記入者本人)は applicantName を申請者名として優先表示
      const isUnregisteredProxy = l.enteredById && l.enteredById === l.userId
      return {
        ...l,
        userName: isUnregisteredProxy ? (l.applicantName || '') : (userMap[l.userId] || l.applicantName || ''),
        enteredByName: l.enteredById ? (userMap[l.enteredById] || '') : null,
      }
    })
    return NextResponse.json({ leaveRequests: enriched })
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
    const validation = validateRequest(leaveRequestSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { applicantName, date, leaveType, leaveUnit, startTime, endTime, familyName, familyBirthdate, familyRelationship, adoptionDate, specialAdoptionDate, careReason, reason, attachmentData, attachmentName, attachmentType } = validation.data
    const targetUserId = (body.targetUserId as string | undefined) || undefined
    // アカウント未登録者（実習生など）の代理申請: userId=代理記入者本人 / applicantName=手入力の申請者名
    const proxyForUnregistered = !!body.proxyForUnregistered
    const unit = leaveUnit
    const isCareLeave = leaveType === '看護' || leaveType === '介護'

    // 申請者・代理記入者の判定
    const ownerUserId = targetUserId || user.id
    const isProxy = (!!targetUserId && targetUserId !== user.id) || proxyForUnregistered
    const enteredById = isProxy ? user.id : null

    // 申請者本人の表示名を取得（通知用）
    let applicantDisplayName = applicantName || user.name
    if (isProxy && !proxyForUnregistered) {
      const owner = await prisma.user.findUnique({ where: { id: ownerUserId } })
      applicantDisplayName = owner?.name || applicantName || ''
    }
    // 未登録者モードは手入力の applicantName をそのまま申請者名として使う

    // 重複チェックの単位: 未登録者は applicantName で区別、それ以外は userId
    const dupWhere: { date: Date } & ({ userId: string } | { applicantName: string }) =
      proxyForUnregistered
        ? { applicantName: applicantName ?? '', date: new Date(date) }
        : { userId: ownerUserId, date: new Date(date) }

    // 時間休の場合は開始・終了時刻が必須
    if (unit === 'hourly' && (!startTime || !endTime)) {
      return NextResponse.json({ error: '時間休の場合は開始時刻と終了時刻を入力してください' }, { status: 400 })
    }

    // 同じ日に全日休暇が既にある場合はエラー
    const existingFullDay = await prisma.leaveRequest.findFirst({
      where: { ...dupWhere, leaveUnit: 'full' },
    })
    if (existingFullDay) {
      return NextResponse.json({ error: 'この日付には既に全日の休暇届が登録されています' }, { status: 409 })
    }

    // 全日で申請する場合、同日に既存の休暇届があればエラー
    if (unit === 'full') {
      const existingAny = await prisma.leaveRequest.findFirst({
        where: dupWhere,
      })
      if (existingAny) {
        return NextResponse.json({ error: 'この日付には既に休暇届が登録されています' }, { status: 409 })
      }
    }

    // 同じ時間帯（午前/午後）の重複チェック
    if (unit === 'am' || unit === 'pm') {
      const existingSameUnit = await prisma.leaveRequest.findFirst({
        where: { ...dupWhere, leaveUnit: unit },
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
        userId: ownerUserId,
        enteredById,
        applicantName: applicantName || applicantDisplayName || null,
        date: new Date(date),
        leaveType,
        leaveUnit: unit,
        startTime: unit === 'hourly' ? startTime : null,
        endTime: unit === 'hourly' ? endTime : null,
        familyName: isCareLeave ? (familyName || null) : null,
        familyBirthdate: isCareLeave ? (familyBirthdate || null) : null,
        familyRelationship: isCareLeave ? (familyRelationship || null) : null,
        adoptionDate: isCareLeave ? (adoptionDate || null) : null,
        specialAdoptionDate: isCareLeave ? (specialAdoptionDate || null) : null,
        careReason: isCareLeave ? (careReason || null) : null,
        reason: reason || null,
        attachmentData: attachmentData || null,
        attachmentName: attachmentName || null,
        attachmentType: attachmentType || null,
        status: 'pending',
      } as any,
    })

    // 管理者に通知（非同期）申請者名 + 代理入力者名（代理時のみ）
    const dateObj = new Date(date)
    const dateStr = `${dateObj.getFullYear()}/${dateObj.getMonth() + 1}/${dateObj.getDate()}`
    const proxySuffix = isProxy ? `（代理記入: ${user.name}）` : ''
    notifyLeaveSubmitted(`${applicantDisplayName}${proxySuffix}`, dateStr, leaveType).catch(() => {})

    return NextResponse.json({ leaveRequest })
  } catch (error) {
    console.error('休暇届作成エラー:', error)
    return NextResponse.json({ error: '休暇届の作成に失敗しました' }, { status: 500 })
  }
}
