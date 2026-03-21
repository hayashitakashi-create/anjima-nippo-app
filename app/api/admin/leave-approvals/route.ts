import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, authErrorResponse } from '@/lib/auth'
import { notifyLeaveApproved, notifyLeaveRejected } from '@/lib/notifications'

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'approve_reports')
    if ('error' in authResult) {
      return authErrorResponse(authResult)
    }
    const { user } = authResult

    const body = await request.json()
    const { leaveRequestId, leaveRequestIds, action } = body

    // 一括操作
    if (leaveRequestIds && Array.isArray(leaveRequestIds) && (action === 'bulk_approve' || action === 'bulk_reject')) {
      const newStatus = action === 'bulk_approve' ? 'approved' : 'rejected'

      const requests = await prisma.leaveRequest.findMany({
        where: { id: { in: leaveRequestIds }, status: 'pending' },
      })

      if (requests.length === 0) {
        return NextResponse.json({ error: '対象の休暇届が見つかりません' }, { status: 404 })
      }

      await prisma.leaveRequest.updateMany({
        where: { id: { in: requests.map(r => r.id) } },
        data: { status: newStatus },
      })

      // 通知（非同期）
      for (const req of requests) {
        const d = new Date(req.date)
        const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
        if (newStatus === 'approved') {
          notifyLeaveApproved(req.userId, dateStr, req.leaveType, user.name).catch(() => {})
        } else {
          notifyLeaveRejected(req.userId, dateStr, req.leaveType, user.name).catch(() => {})
        }
      }

      return NextResponse.json({ success: true, count: requests.length })
    }

    // 個別操作
    if (leaveRequestId && (action === 'approve' || action === 'reject')) {
      const leaveRequest = await prisma.leaveRequest.findUnique({
        where: { id: leaveRequestId },
      })

      if (!leaveRequest) {
        return NextResponse.json({ error: '休暇届が見つかりません' }, { status: 404 })
      }

      if (leaveRequest.status !== 'pending') {
        return NextResponse.json({ error: 'この休暇届は既に処理済みです' }, { status: 400 })
      }

      const newStatus = action === 'approve' ? 'approved' : 'rejected'

      const updated = await prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: { status: newStatus },
      })

      // 通知（非同期）
      const d = new Date(leaveRequest.date)
      const dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
      if (newStatus === 'approved') {
        notifyLeaveApproved(leaveRequest.userId, dateStr, leaveRequest.leaveType, user.name).catch(() => {})
      } else {
        notifyLeaveRejected(leaveRequest.userId, dateStr, leaveRequest.leaveType, user.name).catch(() => {})
      }

      return NextResponse.json({ leaveRequest: updated })
    }

    return NextResponse.json({ error: 'パラメータが不正です' }, { status: 400 })
  } catch (error) {
    console.error('休暇届承認エラー:', error)
    return NextResponse.json({ error: '処理に失敗しました' }, { status: 500 })
  }
}
