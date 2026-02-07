import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 管理者権限チェック
async function checkAdmin(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value

  if (!userId) {
    return { error: 'ログインしていません', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })

  if (!user) {
    return { error: 'ユーザーが見つかりません', status: 404 }
  }

  if (user.role !== 'admin') {
    return { error: '管理者権限が必要です', status: 403 }
  }

  return { userId: user.id }
}

// デフォルト値の定義
const DEFAULT_SETTINGS = {
  // 会社情報
  company_name: '安島工業株式会社',
  company_address: '',
  company_phone: '',
  company_fax: '',
  // 承認設定
  approval_roles: JSON.stringify(['会長', '社長', '副社長', '専務', '常務', '取締役', '部長', '次長', '課長', '係長', '主任']),
  auto_approve_days: '0',
  // 日報設定
  report_reminder_enabled: 'true',
  report_reminder_time: '17:00',
  default_work_hours_start: '08:00',
  default_work_hours_end: '17:00',
  // システム設定
  session_timeout_hours: '720',
}

// GET: 全設定または特定の設定を取得
export async function GET(request: NextRequest) {
  try {
    const auth = await checkAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      // 特定の設定を取得
      const setting = await prisma.systemSetting.findUnique({
        where: { key },
        select: { key: true, value: true, updatedAt: true },
      })

      if (!setting) {
        // デフォルト値を返す
        const defaultValue = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS]
        if (defaultValue !== undefined) {
          return NextResponse.json({
            settings: { [key]: parseValue(key, defaultValue) },
          })
        }
        return NextResponse.json(
          { error: '設定が見つかりません' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        settings: { [key]: parseValue(key, setting.value) },
      })
    }

    // 全設定を取得
    const settings = await prisma.systemSetting.findMany({
      select: { key: true, value: true, updatedAt: true },
    })

    // DBの設定とデフォルト値をマージ
    const settingsMap: Record<string, any> = {}

    // デフォルト値を設定
    Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
      settingsMap[key] = parseValue(key, value)
    })

    // DBの値で上書き
    settings.forEach(setting => {
      settingsMap[setting.key] = parseValue(setting.key, setting.value)
    })

    return NextResponse.json({ settings: settingsMap })
  } catch (error) {
    console.error('設定取得エラー:', error)
    return NextResponse.json(
      { error: '設定の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: 設定を更新または作成
export async function PUT(request: NextRequest) {
  try {
    const auth = await checkAdmin(request)
    if ('error' in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      )
    }

    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: '設定キーが必要です' },
        { status: 400 }
      )
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: '設定値が必要です' },
        { status: 400 }
      )
    }

    // 値を検証
    const validationError = validateSetting(key, value)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // 値を文字列として保存（必要に応じてJSON化）
    const stringValue = stringifyValue(key, value)

    // Upsert（存在すれば更新、なければ作成）
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: stringValue },
      create: { key, value: stringValue },
      select: { key: true, value: true, updatedAt: true },
    })

    return NextResponse.json({
      setting: {
        key: setting.key,
        value: parseValue(setting.key, setting.value),
        updatedAt: setting.updatedAt,
      },
      message: '設定を更新しました',
    })
  } catch (error) {
    console.error('設定更新エラー:', error)
    return NextResponse.json(
      { error: '設定の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// 値を適切な型にパース
function parseValue(key: string, value: string): any {
  // JSON配列として保存される設定
  if (key === 'approval_roles') {
    try {
      return JSON.parse(value)
    } catch {
      return []
    }
  }

  // ブール値として扱う設定
  if (key === 'report_reminder_enabled') {
    return value === 'true'
  }

  // 数値として扱う設定
  if (key === 'auto_approve_days' || key === 'session_timeout_hours') {
    return parseInt(value, 10) || 0
  }

  // 文字列として返す
  return value
}

// 値を文字列化して保存
function stringifyValue(key: string, value: any): string {
  if (key === 'approval_roles') {
    return JSON.stringify(Array.isArray(value) ? value : [])
  }

  if (key === 'report_reminder_enabled') {
    return value ? 'true' : 'false'
  }

  if (key === 'auto_approve_days' || key === 'session_timeout_hours') {
    return String(parseInt(value, 10) || 0)
  }

  return String(value)
}

// 設定値のバリデーション
function validateSetting(key: string, value: any): string | null {
  switch (key) {
    case 'company_name':
      if (typeof value !== 'string' || value.trim().length === 0) {
        return '会社名は必須です'
      }
      break

    case 'approval_roles':
      if (!Array.isArray(value)) {
        return '承認者役職リストは配列である必要があります'
      }
      break

    case 'auto_approve_days':
      const days = parseInt(value, 10)
      if (isNaN(days) || days < 0) {
        return '自動承認日数は0以上の数値である必要があります'
      }
      break

    case 'report_reminder_time':
    case 'default_work_hours_start':
    case 'default_work_hours_end':
      if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) {
        return '時刻はHH:MM形式で入力してください'
      }
      break

    case 'session_timeout_hours':
      const timeout = parseInt(value, 10)
      if (isNaN(timeout) || timeout < 1) {
        return 'セッションタイムアウトは1時間以上である必要があります'
      }
      break
  }

  return null
}
