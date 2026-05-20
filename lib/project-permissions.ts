// 案件削除を許可するユーザーID（田邊沙帆・林　崇のみ）
// クライアント/サーバー両方から import 可能（prisma 等のサーバー依存を含まない）
export const PROJECT_DELETE_ALLOWED_USER_IDS: string[] = [
  'cmlaavq4k000cyl1ob7o3pyo5', // 田邊沙帆
  'cmmulndvi0000822roznduf98', // 林　崇
]

export function canDeleteProject(userId: string | undefined | null): boolean {
  if (!userId) return false
  return PROJECT_DELETE_ALLOWED_USER_IDS.includes(userId)
}
