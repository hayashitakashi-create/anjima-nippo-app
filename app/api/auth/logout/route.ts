import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'ログアウトしました' })

  // Cookieを削除
  response.cookies.delete('userId')

  return response
}
