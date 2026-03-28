import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// 休暇届詳細取得（印刷用）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }
    const { user } = authResult
    const { id } = await params

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        applicantName: true,
        date: true,
        leaveType: true,
        leaveUnit: true,
        startTime: true,
        endTime: true,
        reason: true,
        attachmentName: true,
        status: true,
        createdAt: true,
      },
    })

    if (!leaveRequest) {
      return NextResponse.json({ error: '休暇届が見つかりません' }, { status: 404 })
    }

    // 自分以外の休暇届は管理者のみ閲覧可
    if (leaveRequest.userId !== user.id) {
      const perms = await getUserPermissions(user.role)
      if (!perms.view_all_reports) {
        return NextResponse.json({ error: '権限がありません' }, { status: 403 })
      }
    }

    // ユーザー名を取得
    const leaveUser = await prisma.user.findUnique({
      where: { id: leaveRequest.userId },
      select: { name: true, position: true },
    })

    return NextResponse.json({
      leaveRequest: {
        ...leaveRequest,
        userName: leaveUser?.name || '',
        userPosition: leaveUser?.position || '',
        applicantName: leaveRequest.applicantName || '',
      },
    })
  } catch (error) {
    console.error('休暇届詳細取得エラー:', error)
    return NextResponse.json({ error: '休暇届の取得に失敗しました' }, { status: 500 })
  }
}
