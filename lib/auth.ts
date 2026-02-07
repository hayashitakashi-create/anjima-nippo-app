import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

// JWT シークレットキー（環境変数から取得、なければランダム生成）
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'anjima-nippo-secret-key-change-in-production-2024'
)

// トークン有効期限: 30日
const TOKEN_EXPIRY = '30d'

// ログイン試行回数制限
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15分

// メモリ内でログイン試行を追跡（本番では Redis 等を推奨）
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

// JWT ペイロード型（joseの型を拡張）
export interface JWTPayload extends JoseJWTPayload {
  userId: string
  role: string
  name: string
}

// 認証済みユーザー型
export interface AuthenticatedUser {
  id: string
  name: string
  role: string
  position?: string | null
  defaultReportType?: string
}

/**
 * JWT トークンを生成
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

/**
 * JWT トークンを検証
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

/**
 * リクエストからトークンを取得して検証
 */
export async function getAuthFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = request.cookies.get('auth_token')?.value
  if (!token) return null

  const payload = await verifyToken(token)
  if (!payload) return null

  // データベースからユーザー情報を取得（最新の状態を確認）
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      role: true,
      position: true,
      defaultReportType: true,
      isActive: true,
    },
  })

  // ユーザーが存在しない or 無効化されている場合
  if (!user || !user.isActive) return null

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    position: user.position,
    defaultReportType: user.defaultReportType,
  }
}

/**
 * 認証が必要なAPIのガード（一般ユーザー）
 */
export async function requireAuth(request: NextRequest): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  const user = await getAuthFromRequest(request)
  if (!user) {
    return { error: 'ログインが必要です', status: 401 }
  }
  return { user }
}

/**
 * 管理者権限が必要なAPIのガード
 */
export async function requireAdmin(request: NextRequest): Promise<
  { user: AuthenticatedUser } | { error: string; status: number }
> {
  const user = await getAuthFromRequest(request)
  if (!user) {
    return { error: 'ログインが必要です', status: 401 }
  }
  if (user.role !== 'admin') {
    return { error: '管理者権限が必要です', status: 403 }
  }
  return { user }
}

/**
 * 認証エラーレスポンスを返す
 */
export function authErrorResponse(result: { error: string; status: number }): NextResponse {
  return NextResponse.json({ error: result.error }, { status: result.status })
}

/**
 * ログイン試行回数をチェック
 * @returns true: ログイン可能, false: ロックアウト中
 */
export function checkLoginAttempts(identifier: string): { allowed: boolean; remainingTime?: number } {
  const now = Date.now()
  const attempts = loginAttempts.get(identifier)

  if (!attempts) {
    return { allowed: true }
  }

  // ロックアウト期間が過ぎていたらリセット
  if (now - attempts.lastAttempt > LOCKOUT_DURATION_MS) {
    loginAttempts.delete(identifier)
    return { allowed: true }
  }

  // 試行回数超過
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_DURATION_MS - (now - attempts.lastAttempt)) / 1000)
    return { allowed: false, remainingTime }
  }

  return { allowed: true }
}

/**
 * ログイン失敗を記録
 */
export function recordLoginFailure(identifier: string): void {
  const now = Date.now()
  const attempts = loginAttempts.get(identifier)

  if (!attempts) {
    loginAttempts.set(identifier, { count: 1, lastAttempt: now })
  } else {
    attempts.count += 1
    attempts.lastAttempt = now
  }
}

/**
 * ログイン成功時に試行回数をリセット
 */
export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier)
}

/**
 * 認証用Cookieを設定
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30日
    path: '/',
  })
}

/**
 * 認証用Cookieを削除
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

/**
 * 後方互換性のため: 旧Cookie (userId) からの移行用
 * 旧Cookieがあれば読み取り、新トークンに移行
 */
export async function migrateOldSession(request: NextRequest): Promise<AuthenticatedUser | null> {
  const oldUserId = request.cookies.get('userId')?.value
  if (!oldUserId) return null

  const user = await prisma.user.findUnique({
    where: { id: oldUserId },
    select: {
      id: true,
      name: true,
      role: true,
      position: true,
      defaultReportType: true,
      isActive: true,
    },
  })

  if (!user || !user.isActive) return null

  return {
    id: user.id,
    name: user.name,
    role: user.role,
    position: user.position,
    defaultReportType: user.defaultReportType,
  }
}
