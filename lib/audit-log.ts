import { prisma } from '@/lib/prisma'

export async function logAuditEvent(params: {
  userId: string
  action: string
  targetType: string
  targetId?: string
  details?: Record<string, any>
  ipAddress?: string
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId || null,
        details: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
      },
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw error - audit logging should not break the main operation
  }
}
