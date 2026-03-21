import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'
import { getUserPermissions, type PermissionKey } from './permissions'

// JWT シークレットキー（環境変数から取得、必須）
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET 環境変数が設定されていません。本番環境では必ず設定してください。')
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

// トークン有効期限: 30日
const TOKEN_EXPIRY = '60d'

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
  isApprover?: boolean
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
      isApprover: true,
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
    isApprover: user.isApprover,
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
 * 特定の権限が必要なAPIのガード
 */
// 承認者に付与される追加権限
const APPROVER_PERMISSIONS: PermissionKey[] = ['approve_reports', 'view_all_reports']

export async function requirePermission(
  request: NextRequest,
  permission: PermissionKey
): Promise<{ user: AuthenticatedUser } | { error: string; status: number }> {
  const user = await getAuthFromRequest(request)
  if (!user) {
    return { error: 'ログインが必要です', status: 401 }
  }
  const permissions = await getUserPermissions(user.role)
  // 承認者は approve_reports と view_all_reports を追加で持つ
  const hasApproverPermission = user.isApprover && APPROVER_PERMISSIONS.includes(permission)
  if (!permissions[permission] && !hasApproverPermission) {
    return { error: 'この操作を行う権限がありません', status: 403 }
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
    maxAge: 60 * 60 * 24 * 60, // 60日
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

