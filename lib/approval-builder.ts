import { prisma } from '@/lib/prisma'

// 承認レコードの役職・承認者指定（dailyReportId/workReportId は呼び出し側で付与）
export interface ApproverSpec {
  approverRole: string
  approverUserId?: string
}

// 固定の役職承認枠（田邊様5/28 FB①: 営業/作業とも 常務・専務・社長）
const FIXED_ROLES = ['常務', '専務', '社長']

// 工種別の承認者を加味した承認枠リストを生成する (田邊様5/28 FB①)
// - 営業日報(sales): 固定3役職のみ
// - 作業日報(work): 固定3役職 + projectType に紐づく承認者(部長など・個人指定)
export async function buildApproverSpecs(opts: {
  reportType: 'sales' | 'work'
  projectTypeName?: string | null
}): Promise<ApproverSpec[]> {
  const specs: ApproverSpec[] = FIXED_ROLES.map((role) => ({ approverRole: role }))

  if (opts.reportType === 'work' && opts.projectTypeName) {
    const projectType = await prisma.projectType.findFirst({
      where: { name: opts.projectTypeName },
      select: { id: true },
    })
    if (projectType) {
      const approvers = await prisma.projectTypeApprover.findMany({
        where: { projectTypeId: projectType.id },
        orderBy: { order: 'asc' },
        select: { userId: true, approverRole: true },
      })
      for (const a of approvers) {
        // 個人指定の承認枠。canActOnApproval は「承認者」枠で approverUserId 本人一致を判定する
        specs.push({ approverRole: '承認者', approverUserId: a.userId })
      }
    }
  }

  return specs
}
