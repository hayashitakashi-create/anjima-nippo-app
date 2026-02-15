import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value
    if (!userId) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString())

    // 月の開始日と終了日を計算
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    // 材料記録を日報と一緒に取得
    const workReports = await prisma.workReport.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        materialRecords: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // 材料別集計
    const materialSummary: Record<string, {
      name: string
      totalQuantity: number
      totalAmount: number
      usageCount: number
      unitPrices: number[]
      volumeUnits: Set<string>
      projects: Set<string>
    }> = {}

    // 日別使用量（グラフ用）
    const dailyUsage: Record<string, {
      date: string
      totalQuantity: number
      totalAmount: number
      materials: Record<string, number>
    }> = {}

    workReports.forEach(report => {
      const dateKey = report.date.toISOString().split('T')[0]

      if (!dailyUsage[dateKey]) {
        dailyUsage[dateKey] = {
          date: dateKey,
          totalQuantity: 0,
          totalAmount: 0,
          materials: {},
        }
      }

      report.materialRecords.forEach(material => {
        if (!material.name) return

        const materialKey = material.name

        // 材料別集計
        if (!materialSummary[materialKey]) {
          materialSummary[materialKey] = {
            name: material.name,
            totalQuantity: 0,
            totalAmount: 0,
            usageCount: 0,
            unitPrices: [],
            volumeUnits: new Set(),
            projects: new Set(),
          }
        }

        const quantity = material.quantity || 0
        const amount = material.amount || (quantity * (material.unitPrice || 0))

        materialSummary[materialKey].totalQuantity += quantity
        materialSummary[materialKey].totalAmount += amount
        materialSummary[materialKey].usageCount++
        if (material.unitPrice) {
          materialSummary[materialKey].unitPrices.push(material.unitPrice)
        }
        if (material.volumeUnit) {
          materialSummary[materialKey].volumeUnits.add(material.volumeUnit)
        }
        materialSummary[materialKey].projects.add(report.projectName || '未設定')

        // 日別集計
        dailyUsage[dateKey].totalQuantity += quantity
        dailyUsage[dateKey].totalAmount += amount
        dailyUsage[dateKey].materials[materialKey] =
          (dailyUsage[dateKey].materials[materialKey] || 0) + quantity
      })
    })

    // データを整形
    const materialData = Object.values(materialSummary).map(m => ({
      name: m.name,
      totalQuantity: m.totalQuantity,
      totalAmount: m.totalAmount,
      usageCount: m.usageCount,
      avgUnitPrice: m.unitPrices.length > 0
        ? Math.round(m.unitPrices.reduce((a, b) => a + b, 0) / m.unitPrices.length)
        : 0,
      volumeUnits: Array.from(m.volumeUnits),
      projectCount: m.projects.size,
    })).sort((a, b) => b.totalAmount - a.totalAmount)

    // 日別データを配列に変換
    const dailyData = Object.values(dailyUsage).sort((a, b) => a.date.localeCompare(b.date))

    // 上位材料（グラフ用）
    const topMaterials = materialData.slice(0, 10).map(m => m.name)

    // 全体集計
    const totalSummary = {
      totalMaterialTypes: materialData.length,
      totalQuantity: materialData.reduce((sum, m) => sum + m.totalQuantity, 0),
      totalAmount: materialData.reduce((sum, m) => sum + m.totalAmount, 0),
      totalUsageCount: materialData.reduce((sum, m) => sum + m.usageCount, 0),
    }

    return NextResponse.json({
      year,
      month,
      totalSummary,
      materialData,
      dailyData,
      topMaterials,
    })
  } catch (error) {
    console.error('材料レポート取得エラー:', error)
    return NextResponse.json({ error: 'レポートの取得に失敗しました' }, { status: 500 })
  }
}
