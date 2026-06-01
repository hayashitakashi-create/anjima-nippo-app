import type { ClientUser } from './types'

export function getMyAllowedRoles(user: ClientUser | null | undefined): string[] {
  if (!user) return []
  const roles: string[] = []
  switch (user.position) {
    case '常務':
      roles.push('常務')
      break
    case '専務':
      roles.push('専務')
      break
    case '社長':
      roles.push('社長')
      break
  }
  if (user.isAuthorizer && !['社長', '専務', '常務'].includes(user.position || '')) {
    roles.push('承認者')
  }
  return roles
}

export function canActOnApproval(
  approval: { approverRole: string; approverUserId?: string | null; status: string },
  user: ClientUser | null | undefined
): boolean {
  if (!user) return false
  if (approval.status !== 'pending') return false
  const allowed = getMyAllowedRoles(user)
  if (!allowed.includes(approval.approverRole)) return false
  if (approval.approverRole === '承認者') {
    return !approval.approverUserId || approval.approverUserId === user.id
  }
  return true
}
