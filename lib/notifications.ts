import { prisma } from '@/lib/prisma'

// 管理者（admin）のユーザーIDを取得
async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true },
  })
  return admins.map(a => a.id)
}

// 営業日報が提出された時（管理者全員に通知）
export async function notifyReportSubmitted(
  reporterName: string,
  reportDate: string,
  reportId: string,
  reportType: 'sales' | 'work' = 'sales'
) {
  try {
    const adminIds = await getAdminUserIds()
    if (adminIds.length === 0) return

    const typeLabel = reportType === 'sales' ? '営業日報' : '作業日報'
    const linkUrl = reportType === 'sales' ? `/nippo/${reportId}` : `/work-report/${reportId}`

    const notifications = adminIds.map(userId => ({
      userId,
      type: 'report_submitted',
      title: `${typeLabel}が提出されました`,
      message: `${reporterName}さんが${reportDate}の${typeLabel}を提出しました`,
      linkUrl,
    }))

    await prisma.notification.createMany({ data: notifications })
  } catch (error) {
    console.error('通知作成エラー (提出):', error)
  }
}

// 承認完了時（日報作成者に通知）
export async function notifyReportApproved(
  reportUserId: string,
  reportDate: string,
  reportId: string,
  approverName: string,
) {
  try {
    await prisma.notification.create({
      data: {
        userId: reportUserId,
        type: 'report_approved',
        title: '日報が承認されました',
        message: `${reportDate}の営業日報が${approverName}さんにより承認されました`,
        linkUrl: `/nippo/${reportId}`,
      },
    })
  } catch (error) {
    console.error('通知作成エラー (承認):', error)
  }
}

// 差戻し時（日報作成者に通知）
export async function notifyReportRejected(
  reportUserId: string,
  reportDate: string,
  reportId: string,
  approverName: string,
) {
  try {
    await prisma.notification.create({
      data: {
        userId: reportUserId,
        type: 'report_rejected',
        title: '日報が差し戻されました',
        message: `${reportDate}の営業日報が${approverName}さんにより差し戻されました。内容をご確認ください`,
        linkUrl: `/nippo/${reportId}`,
      },
    })
  } catch (error) {
    console.error('通知作成エラー (差戻し):', error)
  }
}

// 休暇届が提出された時（管理者全員に通知）
export async function notifyLeaveSubmitted(
  applicantName: string,
  dateStr: string,
  leaveType: string,
) {
  try {
    const adminIds = await getAdminUserIds()
    if (adminIds.length === 0) return

    const notifications = adminIds.map(userId => ({
      userId,
      type: 'leave_submitted',
      title: '休暇届が提出されました',
      message: `${applicantName}さんが${dateStr}の${leaveType}を申請しました`,
      linkUrl: '/admin/leave-requests',
    }))

    await prisma.notification.createMany({ data: notifications })
  } catch (error) {
    console.error('通知作成エラー (休暇届提出):', error)
  }
}

// 休暇届が承認された時（申請者に通知）
export async function notifyLeaveApproved(
  userId: string,
  dateStr: string,
  leaveType: string,
  approverName: string,
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'leave_approved',
        title: '休暇届が承認されました',
        message: `${dateStr}の${leaveType}が${approverName}さんにより承認されました`,
        linkUrl: '/leave-requests',
      },
    })
  } catch (error) {
    console.error('通知作成エラー (休暇届承認):', error)
  }
}

// 休暇届が差戻しされた時（申請者に通知）
export async function notifyLeaveRejected(
  userId: string,
  dateStr: string,
  leaveType: string,
  approverName: string,
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'leave_rejected',
        title: '休暇届が差し戻されました',
        message: `${dateStr}の${leaveType}が${approverName}さんにより差し戻されました。内容をご確認ください`,
        linkUrl: '/leave-requests',
      },
    })
  } catch (error) {
    console.error('通知作成エラー (休暇届差戻し):', error)
  }
}

// 日報未提出リマインダー（管理者向け：当日日報を提出していないユーザーのリスト）
// 作業日報については、作成者だけでなくworkerRecordsに名前が含まれるユーザーも提出済みとみなす
export async function getUnsubmittedUsers(): Promise<{
  salesUnsubmitted: Array<{ id: string; name: string }>
  workUnsubmitted: Array<{ id: string; name: string }>
}> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 提出状況カレンダー表示対象（showInCalendar=true）と同じリストを使用
    // 田邊さんの「40名リスト」基準。承認権限があっても日報を書く人（部長・課長など）は含まれる
    const allUsers = await prisma.user.findMany({
      where: { isActive: true, showInCalendar: true },
      select: { id: true, name: true, defaultReportType: true },
    })

    // 今日の営業日報を提出したユーザーID
    const salesSubmittedIds = new Set(
      (await prisma.dailyReport.findMany({
        where: { date: { gte: today, lt: tomorrow } },
        select: { userId: true },
      })).map(r => r.userId)
    )

    // 今日の作業日報を取得（作成者 + workerRecordsの名前で判定）
    const todayWorkReports = await prisma.workReport.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      select: {
        userId: true,
        workerRecords: {
          select: { name: true },
        },
      },
    })

    // ユーザー名からIDへのマッピングを作成
    const nameToUserIds: Record<string, string[]> = {}
    allUsers.forEach(u => {
      if (!nameToUserIds[u.name]) {
        nameToUserIds[u.name] = []
      }
      nameToUserIds[u.name].push(u.id)
    })

    // 作業日報提出済みユーザーID（作成者 + workerRecordsに含まれるユーザー）
    const workSubmittedIds = new Set<string>()
    todayWorkReports.forEach(r => {
      // 作成者自身
      workSubmittedIds.add(r.userId)
      // workerRecordsに名前が含まれるユーザー
      r.workerRecords.forEach(worker => {
        const matchedUserIds = nameToUserIds[worker.name]
        if (matchedUserIds) {
          matchedUserIds.forEach(uid => workSubmittedIds.add(uid))
        }
      })
    })

    const salesUsers = allUsers.filter(u => u.defaultReportType === 'sales' || u.defaultReportType === 'both')
    const workUsers = allUsers.filter(u => u.defaultReportType === 'work' || u.defaultReportType === 'both')

    return {
      salesUnsubmitted: salesUsers
        .filter(u => !salesSubmittedIds.has(u.id))
        .map(u => ({ id: u.id, name: u.name })),
      workUnsubmitted: workUsers
        .filter(u => !workSubmittedIds.has(u.id))
        .map(u => ({ id: u.id, name: u.name })),
    }
  } catch (error) {
    console.error('未提出者取得エラー:', error)
    return { salesUnsubmitted: [], workUnsubmitted: [] }
  }
}
