import 'dotenv/config'
import { prisma } from '../lib/prisma'

// スクリーンショットの参考データに基づくデモデータ
const WORKERS = [
  '安島　隆', '金山昭徳', '古川一彦', '内田邦男', '福田誠',
  '足立憲吉', '松本倫典', '大塚崇', '三嶋晶', '伊藤勝',
  '古曵正樹', '松本太', '佐野弘和', '中谷凜大',
]

const MATERIALS = [
  { name: 'キクテック キクスイライン KL-115 白', volume: '20', volumeUnit: 'kg', unitPrice: 2500 },
  { name: 'キクテック キクスイライン KL-115 白', volume: '20', volumeUnit: 'kg', unitPrice: 2800 },
  { name: 'キクテック キクスイライン KL-215 黄', volume: '20', volumeUnit: 'kg', unitPrice: 5200 },
  { name: 'キクテック ユニビーズUB-108L', volume: '25', volumeUnit: 'kg', unitPrice: 120 },
  { name: 'トウペ トアライナー M用プライマー', volume: '14', volumeUnit: 'kg', unitPrice: 382 },
  { name: 'トウペ トアライナー P 黒', volume: '20', volumeUnit: 'kg', unitPrice: 354 },
  { name: '昌和ペイント ラッカーシンナー 80シンナー', volume: '14', volumeUnit: 'kg', unitPrice: 364 },
  { name: '大和ブロック 車止めブロック', volume: '', volumeUnit: '', unitPrice: 1700 },
]

const SUBCONTRACTORS = [
  { name: 'エルシー' },
  { name: 'キョウワビルト工業' },
  { name: '森下塗装' },
  { name: '又川工業' },
  { name: '恒松塗装' },
  { name: '長岡塗装' },
  { name: '景山工業' },
  { name: '塗装工房' },
  { name: '鳥島工業' },
  { name: '三和電工' },
]

const PROJECT_NAMES = [
  '国道9号 松江道路 区画線工事',
  '松江市 市道改良 舗装工事',
  '県道21号 橋梁補修工事',
  '出雲バイパス 区画線補修工事',
  '安来市 駐車場ライン施工',
]

const WEATHER_OPTIONS = ['晴れ', '曇り', '雨', '晴れのち曇り', '曇り時々雨']

// 勤務パターン：様々な時間帯をカバー
// normal=8:00-17:00, overtime=それ以外(深夜除く), lateNight=22:00-5:00
const WORK_PATTERNS = [
  // 通常勤務（8:00~17:00のみ）
  { startTime: '08:00', endTime: '17:00', label: '通常' },
  // 早出（7:00~17:00）→ 7:00-8:00が時間外
  { startTime: '07:00', endTime: '17:00', label: '早出' },
  // 残業あり（8:00~20:00）→ 17:00-20:00が時間外
  { startTime: '08:00', endTime: '20:00', label: '残業' },
  // 早出+残業（7:00~20:00）
  { startTime: '07:00', endTime: '20:00', label: '早出+残業' },
  // 長時間残業（8:00~22:00）→ 17:00-22:00が時間外
  { startTime: '08:00', endTime: '22:00', label: '長残業' },
  // 深夜含む（8:00~23:00）→ 22:00-23:00が深夜
  { startTime: '08:00', endTime: '23:00', label: '深夜あり' },
  // 深夜作業（18:00~翌2:00）→ 18:00-22:00が時間外、22:00-2:00が深夜
  { startTime: '18:00', endTime: '02:00', label: '夜間作業' },
  // 通常+少し残業（8:00~18:00）
  { startTime: '08:00', endTime: '18:00', label: '1h残業' },
  // 通常短縮（9:00~17:00）
  { startTime: '09:00', endTime: '17:00', label: '短縮' },
  // 早朝（6:00~15:00）→ 6:00-8:00が時間外
  { startTime: '06:00', endTime: '15:00', label: '早朝' },
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 1): number {
  const val = Math.random() * (max - min) + min
  return parseFloat(val.toFixed(decimals))
}

async function main() {
  console.log('=== デモ作業日報データ投入（時間帯別集計対応版） ===\n')

  // 既存のデモデータを削除
  console.log('既存データを削除中...')
  const deleteResult = await prisma.workReport.deleteMany({})
  console.log(`  削除済み: ${deleteResult.count}件\n`)

  // 既存ユーザーを取得
  const users = await prisma.user.findMany({
    select: { id: true, name: true },
    take: 5,
  })

  if (users.length === 0) {
    console.error('ユーザーが存在しません。先にseedを実行してください。')
    process.exit(1)
  }

  console.log(`既存ユーザー: ${users.map(u => u.name).join(', ')}`)

  // 物件があれば取得、なければ作成
  let projects = await prisma.project.findMany({
    select: { id: true, name: true },
    take: 5,
  })

  if (projects.length === 0) {
    console.log('物件が見つかりません。デモ物件を作成します...')
    for (const name of PROJECT_NAMES) {
      const project = await prisma.project.create({
        data: {
          name,
          projectType: '区画線工事',
          projectCode: `P-${randomInt(1000, 9999)}`,
          client: '国土交通省',
          location: '島根県松江市',
          status: 'active',
          progress: randomInt(10, 90),
        },
      })
      projects.push({ id: project.id, name: project.name })
    }
    console.log(`物件 ${projects.length}件 作成完了\n`)
  } else {
    console.log(`既存物件: ${projects.map(p => p.name).join(', ')}\n`)
  }

  // 今月の期間（21日〜翌月20日）に収まる日付を生成
  const now = new Date()
  const currentDay = now.getDate()
  let periodStart: Date
  if (currentDay >= 21) {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 21)
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 21)
  }

  // 期間内の日付を生成（21日〜今日まで、最大20日分）
  const dates: Date[] = []
  const tempDate = new Date(periodStart)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  while (dates.length < 20 && tempDate <= today) {
    dates.push(new Date(tempDate))
    tempDate.setDate(tempDate.getDate() + 1)
  }

  // 日付が足りない場合は前月分も使う
  if (dates.length < 20) {
    const prevPeriodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() - 1, 21)
    const prevDate = new Date(prevPeriodStart)
    while (dates.length < 20 && prevDate < periodStart) {
      dates.unshift(new Date(prevDate))
      prevDate.setDate(prevDate.getDate() + 1)
    }
  }

  // 最新20日分を使用
  const reportDates = dates.slice(-20)

  // 日曜日を確認
  const sundayCount = reportDates.filter(d => d.getDay() === 0).length
  console.log(`集計期間: ${periodStart.toISOString().split('T')[0]} 〜`)
  console.log(`投入する日付範囲: ${reportDates[0].toISOString().split('T')[0]} 〜 ${reportDates[reportDates.length - 1].toISOString().split('T')[0]}`)
  console.log(`投入件数: ${reportDates.length}件 (うち日曜日: ${sundayCount}件)\n`)

  let created = 0
  for (const date of reportDates) {
    const user = users[created % users.length]
    const project = projects[created % projects.length]
    const isSunday = date.getDay() === 0
    const dayLabel = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]

    // 作業員レコード（2〜5人）
    const workerCount = randomInt(2, 5)
    const workerRecords = []
    const usedWorkers = new Set<string>()
    for (let i = 0; i < workerCount; i++) {
      let workerName: string
      do {
        workerName = randomItem(WORKERS)
      } while (usedWorkers.has(workerName))
      usedWorkers.add(workerName)

      // 日曜日・平日で異なるパターンを使用
      let pattern
      if (isSunday) {
        // 日曜日は通常〜残業パターンが多い
        pattern = randomItem(WORK_PATTERNS.slice(0, 4))
      } else if (created % 5 === 0) {
        // 5件に1件は深夜含むパターン
        pattern = randomItem(WORK_PATTERNS.slice(4))
      } else {
        // 通常パターン
        pattern = randomItem(WORK_PATTERNS)
      }

      const hours = randomFloat(0.5, 1.0, 3)

      workerRecords.push({
        name: workerName,
        startTime: pattern.startTime,
        endTime: pattern.endTime,
        workHours: hours,
        workType: randomItem(['区画線', '溶融', 'プライマー', '路面標示', '撤去']),
        dailyHours: hours,
        order: i,
      })
    }

    // 材料レコード（1〜3品）
    const materialCount = randomInt(1, 3)
    const materialRecords = []
    const usedMaterials = new Set<number>()
    for (let i = 0; i < materialCount; i++) {
      let matIdx: number
      do {
        matIdx = randomInt(0, MATERIALS.length - 1)
      } while (usedMaterials.has(matIdx))
      usedMaterials.add(matIdx)

      const mat = MATERIALS[matIdx]
      const quantity = randomInt(1, 50)
      materialRecords.push({
        name: mat.name,
        volume: mat.volume,
        volumeUnit: mat.volumeUnit,
        unitPrice: mat.unitPrice,
        quantity,
        amount: quantity * mat.unitPrice,
        order: i,
      })
    }

    // 外注先レコード（1〜3社）
    const subCount = randomInt(1, 3)
    const subRecords = []
    const usedSubs = new Set<number>()
    for (let i = 0; i < subCount; i++) {
      let subIdx: number
      do {
        subIdx = randomInt(0, SUBCONTRACTORS.length - 1)
      } while (usedSubs.has(subIdx))
      usedSubs.add(subIdx)

      const sub = SUBCONTRACTORS[subIdx]
      subRecords.push({
        name: sub.name,
        workerCount: randomInt(1, 8),
        workContent: randomItem(['区画線施工', '溶融施工', 'プライマー塗布', '撤去作業', '路面清掃']),
        order: i,
      })
    }

    // 移動時間（70%の日報に設定）
    let remoteDepartureTime: string | null = null
    let remoteArrivalTime: string | null = null
    let remoteDepartureTime2: string | null = null
    let remoteArrivalTime2: string | null = null

    if (created % 10 !== 3) {  // 70%は移動時間あり
      // 行き: 会社出発 → 現場着（30分〜90分）
      const depHour = randomInt(6, 7)
      const depMin = randomItem([0, 15, 30, 45])
      const travelMinutes1 = randomInt(30, 90)
      const arrMin = depHour * 60 + depMin + travelMinutes1
      const arrHour = Math.floor(arrMin / 60)
      const arrMinRemainder = arrMin % 60

      remoteDepartureTime = `${depHour.toString().padStart(2, '0')}:${depMin.toString().padStart(2, '0')}`
      remoteArrivalTime = `${arrHour.toString().padStart(2, '0')}:${arrMinRemainder.toString().padStart(2, '0')}`

      // 帰り: 現場出発 → 会社着（30分〜90分）
      const dep2Hour = randomInt(17, 19)
      const dep2Min = randomItem([0, 15, 30])
      const travelMinutes2 = randomInt(30, 90)
      const arr2Min = dep2Hour * 60 + dep2Min + travelMinutes2
      const arr2Hour = Math.floor(arr2Min / 60)
      const arr2MinRemainder = arr2Min % 60

      remoteDepartureTime2 = `${dep2Hour.toString().padStart(2, '0')}:${dep2Min.toString().padStart(2, '0')}`
      remoteArrivalTime2 = `${arr2Hour.toString().padStart(2, '0')}:${arr2MinRemainder.toString().padStart(2, '0')}`
    }

    // 作業日報を作成
    const report = await prisma.workReport.create({
      data: {
        date: date,
        userId: user.id,
        projectRefId: project.id,
        projectName: project.name,
        projectType: '区画線工事',
        projectId: `P-${randomInt(1000, 9999)}`,
        weather: randomItem(WEATHER_OPTIONS),
        contactNotes: created % 3 === 0 ? '特になし' : null,
        remoteDepartureTime,
        remoteArrivalTime,
        remoteDepartureTime2,
        remoteArrivalTime2,
        workerRecords: { create: workerRecords },
        materialRecords: { create: materialRecords },
        subcontractorRecords: { create: subRecords },
      },
      include: {
        workerRecords: true,
        materialRecords: true,
        subcontractorRecords: true,
      },
    })

    const dateStr = date.toISOString().split('T')[0]
    const timeInfo = workerRecords.map(w => `${w.startTime}-${w.endTime}`).join(', ')
    const travelInfo = remoteDepartureTime
      ? `移動[${remoteDepartureTime}→${remoteArrivalTime}, ${remoteDepartureTime2}→${remoteArrivalTime2}]`
      : '移動なし'
    console.log(
      `[${(created + 1).toString().padStart(2)}/20] ${dateStr}(${dayLabel}) | ${project.name.substring(0, 12)} | ` +
      `作業員${workerRecords.length}名 [${timeInfo}] | ${travelInfo}`
    )

    created++
  }

  console.log(`\nデモデータ ${created}件 の投入が完了しました!`)

  // 投入結果サマリー
  const totalReports = await prisma.workReport.count()
  const totalWorkerRecords = await prisma.workerRecord.count()
  const totalMaterialRecords = await prisma.materialRecord.count()
  const totalSubRecords = await prisma.subcontractorRecord.count()

  console.log('\n--- DB統計 ---')
  console.log(`作業日報: ${totalReports}件`)
  console.log(`作業員レコード: ${totalWorkerRecords}件`)
  console.log(`材料レコード: ${totalMaterialRecords}件`)
  console.log(`外注先レコード: ${totalSubRecords}件`)
}

main()
  .catch((e) => {
    console.error('エラーが発生しました:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
