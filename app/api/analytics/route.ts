import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインしていません' },
        { status: 401 }
      )
    }

    // 管理者チェック
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
    }

    const isAdmin = user.role === 'admin'

    // クエリパラメータ
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6') // 過去何ヶ月分
    const targetUserId = searchParams.get('userId') // 特定ユーザーの分析（管理者のみ）

    // 分析対象のユーザーID
    const filterUserId = isAdmin && targetUserId === 'all' ? undefined : (isAdmin && targetUserId ? targetUserId : userId)

    // 期間の開始日
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    startDate.setDate(1)
    startDate.setHours(0, 0, 0, 0)

    const dateFilter = { gte: startDate }
    const userFilter = filterUserId ? { userId: filterUserId } : {}

    // === 1. 月別日報件数推移 ===
    const dailyReports = await prisma.dailyReport.findMany({
      where: { ...userFilter, date: dateFilter },
      select: { date: true },
    })

    const workReports = await prisma.workReport.findMany({
      where: { ...userFilter, date: dateFilter },
      select: { date: true },
    })

    // 月別にグルーピング
    const monthlyNippo: Record<string, number> = {}
    const monthlyWork: Record<string, number> = {}

    for (let i = 0; i <= months; i++) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyNippo[key] = 0
      monthlyWork[key] = 0
    }

    dailyReports.forEach(r => {
      const d = new Date(r.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in monthlyNippo) monthlyNippo[key]++
    })

    workReports.forEach(r => {
      const d = new Date(r.date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (key in monthlyWork) monthlyWork[key]++
    })

    // ソートして配列に
    const sortedKeys = Object.keys(monthlyNippo).sort()
    const monthlyTrend = sortedKeys.map(key => ({
      month: key,
      label: `${parseInt(key.split('-')[1])}月`,
      nippoCount: monthlyNippo[key],
      workCount: monthlyWork[key],
      total: monthlyNippo[key] + monthlyWork[key],
    }))

    // === 2. 訪問先ランキング（営業日報） ===
    const visitRecords = await prisma.visitRecord.findMany({
      where: {
        dailyReport: { ...userFilter, date: dateFilter },
      },
      select: { destination: true, expense: true },
    })

    const destMap: Record<string, { count: number; totalExpense: number }> = {}
    visitRecords.forEach(v => {
      const dest = v.destination.trim()
      if (!dest) return
      if (!destMap[dest]) destMap[dest] = { count: 0, totalExpense: 0 }
      destMap[dest].count++
      destMap[dest].totalExpense += v.expense || 0
    })

    const visitRanking = Object.entries(destMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // === 3. 工数集計（作業日報） ===
    const workerRecords = await prisma.workerRecord.findMany({
      where: {
        workReport: { ...userFilter, date: dateFilter },
      },
      select: { workHours: true, workType: true, dailyHours: true },
    })

    const workTypeMap: Record<string, { count: number; totalHours: number }> = {}
    let totalWorkHours = 0

    workerRecords.forEach(w => {
      const hours = w.workHours || w.dailyHours || 0
      totalWorkHours += hours
      const type = (w.workType || '未分類').trim()
      if (!workTypeMap[type]) workTypeMap[type] = { count: 0, totalHours: 0 }
      workTypeMap[type].count++
      workTypeMap[type].totalHours += hours
    })

    const workTypeRanking = Object.entries(workTypeMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10)

    // === 4. 材料費集計（作業日報） ===
    const materialRecords = await prisma.materialRecord.findMany({
      where: {
        workReport: { ...userFilter, date: dateFilter },
      },
      select: { name: true, quantity: true, unitPrice: true, amount: true },
    })

    let totalMaterialCost = 0
    const materialMap: Record<string, { count: number; totalAmount: number }> = {}

    materialRecords.forEach(m => {
      const amt = m.amount || ((m.quantity || 0) * (m.unitPrice || 0))
      totalMaterialCost += amt
      const name = (m.name || '不明').trim()
      if (!name) return
      if (!materialMap[name]) materialMap[name] = { count: 0, totalAmount: 0 }
      materialMap[name].count++
      materialMap[name].totalAmount += amt
    })

    const materialRanking = Object.entries(materialMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)

    // === 5. 案件別集計（作業日報） ===
    const projectReports = await prisma.workReport.findMany({
      where: { ...userFilter, date: dateFilter },
      select: {
        projectName: true,
        workerRecords: { select: { workHours: true, dailyHours: true } },
        materialRecords: { select: { quantity: true, unitPrice: true, amount: true } },
      },
    })

    const projectMap: Record<string, { reportCount: number; totalHours: number; totalCost: number }> = {}
    projectReports.forEach(r => {
      const name = r.projectName || '不明'
      if (!projectMap[name]) projectMap[name] = { reportCount: 0, totalHours: 0, totalCost: 0 }
      projectMap[name].reportCount++

      r.workerRecords.forEach(w => {
        projectMap[name].totalHours += w.workHours || w.dailyHours || 0
      })
      r.materialRecords.forEach(m => {
        projectMap[name].totalCost += m.amount || ((m.quantity || 0) * (m.unitPrice || 0))
      })
    })

    const projectRanking = Object.entries(projectMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.reportCount - a.reportCount)
      .slice(0, 10)

    // === 6. サマリー ===
    const totalExpense = visitRecords.reduce((sum, v) => sum + (v.expense || 0), 0)

    const summary = {
      totalNippo: dailyReports.length,
      totalWork: workReports.length,
      totalReports: dailyReports.length + workReports.length,
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
      totalMaterialCost: Math.round(totalMaterialCost),
      totalExpense,
    }

    // === 7. ユーザー別集計（管理者のみ・全体モード時） ===
    let userRanking: { name: string; nippoCount: number; workCount: number; total: number }[] = []
    if (isAdmin && !filterUserId) {
      const allUsers = await prisma.user.findMany({
        select: { id: true, name: true },
      })

      const userNippoMap: Record<string, number> = {}
      const userWorkMap: Record<string, number> = {}

      dailyReports.forEach(() => {}) // already filtered by dateFilter
      // Re-fetch with userId info
      const allDailyReports = await prisma.dailyReport.findMany({
        where: { date: dateFilter },
        select: { userId: true },
      })
      const allWorkReports = await prisma.workReport.findMany({
        where: { date: dateFilter },
        select: { userId: true },
      })

      allDailyReports.forEach(r => {
        userNippoMap[r.userId] = (userNippoMap[r.userId] || 0) + 1
      })
      allWorkReports.forEach(r => {
        userWorkMap[r.userId] = (userWorkMap[r.userId] || 0) + 1
      })

      userRanking = allUsers.map(u => ({
        name: u.name,
        nippoCount: userNippoMap[u.id] || 0,
        workCount: userWorkMap[u.id] || 0,
        total: (userNippoMap[u.id] || 0) + (userWorkMap[u.id] || 0),
      })).sort((a, b) => b.total - a.total)
    }

    return NextResponse.json({
      summary,
      monthlyTrend,
      visitRanking,
      workTypeRanking,
      materialRanking,
      projectRanking,
      userRanking,
      isAdmin,
    })
  } catch (error) {
    console.error('分析データ取得エラー:', error)
    return NextResponse.json(
      { error: '分析データの取得に失敗しました' },
      { status: 500 }
    )
  }
}
