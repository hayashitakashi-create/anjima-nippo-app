import { NextRequest, NextResponse } from 'next/server'
import { getUnsubmittedUsers } from '@/lib/notifications'
import { requirePermission, authErrorResponse } from '@/lib/auth'

// 未提出者リストを取得（管理者向け）
export async function GET(request: NextRequest) {
  try {
    const authResult = await requirePermission(request, 'view_all_reports')
    if ('error' in authResult) return authErrorResponse(authResult)

    const result = await getUnsubmittedUsers()
    return NextResponse.json(result)
  } catch (error) {
    console.error('未提出者取得エラー:', error)
    return NextResponse.json({ error: '未提出者の取得に失敗しました' }, { status: 500 })
  }
}
