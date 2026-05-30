import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, authErrorResponse } from '@/lib/auth'

// 工種別承認者の取得 (田邊様5/28 FB①)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission(request, 'manage_masters')
  if ('error' in authResult) return authErrorResponse(authResult)

  const { id } = await params
  const approvers = await prisma.projectTypeApprover.findMany({
    where: { projectTypeId: id },
    orderBy: { order: 'asc' },
    include: { user: { select: { id: true, name: true, position: true } } },
  })
  return NextResponse.json({ approvers })
}

// 工種別承認者の全置換保存 (田邊様5/28 FB①)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requirePermission(request, 'manage_masters')
  if ('error' in authResult) return authErrorResponse(authResult)

  try {
    const { id } = await params
    const body = await request.json()
    const items: { userId: string; approverRole: string; order?: number }[] = body.approvers || []

    await prisma.$transaction([
      prisma.projectTypeApprover.deleteMany({ where: { projectTypeId: id } }),
      ...items.map((it, idx) =>
        prisma.projectTypeApprover.create({
          data: {
            projectTypeId: id,
            userId: it.userId,
            approverRole: it.approverRole,
            order: it.order ?? idx,
          },
        })
      ),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('工種別承認者保存エラー:', error)
    return NextResponse.json({ error: '承認者の保存に失敗しました' }, { status: 500 })
  }
}
