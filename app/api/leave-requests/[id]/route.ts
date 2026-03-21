import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, authErrorResponse } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// 添付ファイル取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }
    const { id } = await params

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      select: { attachmentData: true, attachmentName: true, attachmentType: true },
    })

    if (!leaveRequest || !leaveRequest.attachmentData) {
      return NextResponse.json({ error: '添付ファイルが見つかりません' }, { status: 404 })
    }

    const buffer = Buffer.from(leaveRequest.attachmentData, 'base64')
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': leaveRequest.attachmentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(leaveRequest.attachmentName || 'attachment')}"`,
      },
    })
  } catch (error) {
    console.error('添付ファイル取得エラー:', error)
    return NextResponse.json({ error: '添付ファイルの取得に失敗しました' }, { status: 500 })
  }
}

// 休暇届削除
export async function DELETE(
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

    const existing = await prisma.leaveRequest.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: '休暇届が見つかりません' }, { status: 404 })
    }

    // 管理者は全員の休暇届を削除可能
    if (existing.userId !== user.id) {
      const perms = await getUserPermissions(user.role)
      if (!perms.view_all_reports) {
        return NextResponse.json({ error: '他のユーザーの休暇届は削除できません' }, { status: 403 })
      }
    }

    await prisma.leaveRequest.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: '休暇届を削除しました' })
  } catch (error) {
    console.error('休暇届削除エラー:', error)
    return NextResponse.json({ error: '休暇届の削除に失敗しました' }, { status: 500 })
  }
}
