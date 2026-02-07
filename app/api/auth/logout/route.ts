import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ message: 'ログアウトしました' })

  // 新しいJWT Cookieを削除
  clearAuthCookie(response)

  // 旧Cookie（userId）も削除（後方互換性）
  response.cookies.delete('userId')

  return response
}
