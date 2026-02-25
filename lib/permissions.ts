import { prisma } from './prisma'

// 権限キー型
export type PermissionKey =
  | 'view_all_reports'
  | 'edit_all_reports'
  | 'approve_reports'
  | 'manage_users'
  | 'manage_masters'
  | 'system_settings'
  | 'view_audit_log'
  | 'bulk_print'
  | 'view_aggregation'
  | 'view_all_analytics'

// 権限定義
export const PERMISSION_DEFINITIONS: {
  key: PermissionKey
  label: string
  description: string
}[] = [
  { key: 'view_all_reports', label: '全員の日報閲覧', description: '他ユーザーの日報を閲覧可能' },
  { key: 'edit_all_reports', label: '全員の日報編集', description: '他ユーザーの日報を編集可能' },
  { key: 'approve_reports', label: '日報の承認', description: '日報を承認・差し戻し可能' },
  { key: 'manage_users', label: 'ユーザー管理', description: 'ユーザーの追加・編集・削除' },
  { key: 'manage_masters', label: 'マスタ管理', description: '案件・材料・外注先等の管理' },
  { key: 'system_settings', label: 'システム設定', description: 'システム全体の設定変更' },
  { key: 'view_audit_log', label: '操作ログ閲覧', description: '操作ログの閲覧' },
  { key: 'bulk_print', label: '一括印刷', description: '日報の一括印刷' },
  { key: 'view_aggregation', label: '集計閲覧', description: '労働時間・現場別集計の閲覧' },
  { key: 'view_all_analytics', label: '全社分析', description: '全社員の分析データ閲覧' },
]

// ロール別デフォルト権限
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<PermissionKey, boolean>> = {
  admin: {
    view_all_reports: true,
    edit_all_reports: true,
    approve_reports: true,
    manage_users: true,
    manage_masters: true,
    system_settings: true,
    view_audit_log: true,
    bulk_print: true,
    view_aggregation: true,
    view_all_analytics: true,
  },
  user: {
    view_all_reports: false,
    edit_all_reports: false,
    approve_reports: false,
    manage_users: false,
    manage_masters: false,
    system_settings: false,
    view_audit_log: false,
    bulk_print: false,
    view_aggregation: false,
    view_all_analytics: false,
  },
}

// 管理者が常にONでなければならない権限キー（ロックアウト防止）
export const ADMIN_LOCKED_PERMISSIONS: PermissionKey[] = ['system_settings', 'manage_users']

export type RolePermissions = Record<string, Record<PermissionKey, boolean>>

/**
 * DBから role_permissions を読み取り、デフォルト値とマージして返す
 */
export async function getRolePermissions(): Promise<RolePermissions> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'role_permissions' },
    })

    if (!setting) {
      return DEFAULT_ROLE_PERMISSIONS
    }

    const stored: RolePermissions = JSON.parse(setting.value)

    // デフォルト値とマージ（新しい権限キーが追加された場合にも対応）
    const merged: RolePermissions = {}
    for (const role of Object.keys(DEFAULT_ROLE_PERMISSIONS)) {
      merged[role] = { ...DEFAULT_ROLE_PERMISSIONS[role] }
      if (stored[role]) {
        for (const key of Object.keys(merged[role]) as PermissionKey[]) {
          if (typeof stored[role][key] === 'boolean') {
            merged[role][key] = stored[role][key]
          }
        }
      }
      // 管理者のロック権限を強制ON
      if (role === 'admin') {
        for (const lockedKey of ADMIN_LOCKED_PERMISSIONS) {
          merged[role][lockedKey] = true
        }
      }
    }

    return merged
  } catch {
    return DEFAULT_ROLE_PERMISSIONS
  }
}

/**
 * 特定ロールの権限マップを返す
 */
export async function getUserPermissions(role: string): Promise<Record<PermissionKey, boolean>> {
  const allPermissions = await getRolePermissions()
  return allPermissions[role] || DEFAULT_ROLE_PERMISSIONS.user
}
