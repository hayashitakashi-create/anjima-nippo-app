/**
 * 集計ロジック共通ユーティリティ
 * 月次集計API・現場別集計APIで共有する関数・型定義
 */

// ========== 共通インターフェース ==========

export interface LaborEntry {
  name: string
  weekdayNormal: number      // 月〜土 8:00~17:00 (分)
  weekdayOvertime: number    // 月〜土 8:00~17:00外 (分)
  weekdayLateNight: number   // 月〜土 うち22:00~5:00 (分)
  weekdaySubtotal: number    // 月〜土 小計 (分)
  sundayNormal: number       // 日曜 8:00~17:00 (分)
  sundayOvertime: number     // 日曜 8:00~17:00外 (分)
  sundayLateNight: number    // 日曜 うち22:00~5:00 (分)
  sundaySubtotal: number     // 日曜 小計 (分)
  total: number              // 合計 (分)
  travelMinutes: number      // 移動時間 (分)
}

export interface MaterialEntry {
  name: string
  volume: string
  volumeUnit: string
  unitPrice: number
  totalQuantity: number
  totalAmount: number
}

export interface SubcontractorEntry {
  name: string
  totalWorkerCount: number
  totalDays: number
  dates: Set<string>
}

export interface PeriodInfo {
  start: Date
  end: Date
  label: string
}

// ========== 時間計算関数 ==========

/**
 * 時刻文字列 "HH:MM" を分(minutes)に変換
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

/**
 * 2つの時間範囲の重複部分を分で返す
 * [start1, end1] と [start2, end2] の重複（分単位）
 */
export function overlapMinutes(s1: number, e1: number, s2: number, e2: number): number {
  const overlapStart = Math.max(s1, s2)
  const overlapEnd = Math.min(e1, e2)
  return Math.max(0, overlapEnd - overlapStart)
}

/**
 * 勤務時間を時間帯別に分類する
 * startTime, endTime: "HH:MM" 形式
 *
 * 返り値: { normal: 分, overtime: 分, lateNight: 分 }
 * - normal: 8:00~17:00 の範囲内の時間
 * - overtime: 8:00~17:00 外の時間（深夜除く）
 * - lateNight: 22:00~5:00 の時間（overtimeに含まれる分から抽出）
 */
export function classifyWorkHours(startTime: string, endTime: string): {
  normal: number    // 8:00~17:00 の分
  overtime: number  // 8:00~17:00外（深夜除く）の分
  lateNight: number // 22:00~5:00 の分
} {
  const start = timeToMinutes(startTime)
  let end = timeToMinutes(endTime)

  // endがstartより小さい場合は翌日扱い（例: 22:00 ~ 2:00）
  if (end <= start) {
    end += 24 * 60
  }

  const totalMinutes = end - start
  if (totalMinutes <= 0) return { normal: 0, overtime: 0, lateNight: 0 }

  // 通常時間帯: 8:00(480) ~ 17:00(1020)
  const normalStart = 8 * 60  // 480
  const normalEnd = 17 * 60   // 1020

  // 深夜時間帯: 22:00(1320) ~ 29:00(1740=翌5:00)
  // と 0:00(0) ~ 5:00(300)
  const lateNightStart1 = 22 * 60  // 1320
  const lateNightEnd1 = 29 * 60    // 1740 (翌5:00)
  const lateNightStart2 = 0
  const lateNightEnd2 = 5 * 60     // 300

  // 通常時間（8:00~17:00の重複）
  const normal = overlapMinutes(start, end, normalStart, normalEnd)

  // 深夜時間（22:00~翌5:00の重複）
  let lateNight = overlapMinutes(start, end, lateNightStart1, lateNightEnd1)
  // 日をまたがない場合の 0:00~5:00 もチェック
  lateNight += overlapMinutes(start, end, lateNightStart2, lateNightEnd2)

  // 時間外 = 合計 - 通常 - 深夜
  const overtime = Math.max(0, totalMinutes - normal - lateNight)

  return { normal, overtime, lateNight }
}

/**
 * 移動時間を計算（分）
 * remoteDepartureTime → remoteArrivalTime : 行きの移動
 * remoteDepartureTime2 → remoteArrivalTime2 : 帰りの移動
 */
export function calcTravelMinutes(
  dep1: string | null,
  arr1: string | null,
  dep2: string | null,
  arr2: string | null
): number {
  let total = 0
  if (dep1 && arr1) {
    const d = timeToMinutes(dep1)
    const a = timeToMinutes(arr1)
    if (a > d) total += a - d
  }
  if (dep2 && arr2) {
    const d = timeToMinutes(dep2)
    const a = timeToMinutes(arr2)
    if (a > d) total += a - d
  }
  return total
}

/**
 * 分→時間（小数2桁）に変換
 */
export function minutesToHours(mins: number): number {
  return parseFloat((mins / 60).toFixed(2))
}

// ========== 期間計算 ==========

/**
 * 21日～翌月20日の期間を計算（UTC基準）
 * @param offset 月オフセット（0=今月、-1=前月、1=翌月）
 */
export function calculatePeriod(offset: number): PeriodInfo {
  const now = new Date()
  // UTC基準で現在日付を取得（DB保存がUTCのため）
  const currentDay = now.getUTCDate()
  const currentMonth = now.getUTCMonth()
  const currentYear = now.getUTCFullYear()

  let baseYear = currentYear
  let baseMonth = currentMonth
  if (currentDay < 21) {
    baseMonth -= 1
    if (baseMonth < 0) {
      baseMonth = 11
      baseYear -= 1
    }
  }

  // offsetを適用
  let startMonth = baseMonth + offset
  let startYear = baseYear
  while (startMonth < 0) { startMonth += 12; startYear -= 1 }
  while (startMonth > 11) { startMonth -= 12; startYear += 1 }

  const start = new Date(Date.UTC(startYear, startMonth, 21, 0, 0, 0, 0))

  let endMonth = startMonth + 1
  let endYear = startYear
  if (endMonth > 11) { endMonth = 0; endYear += 1 }
  const end = new Date(Date.UTC(endYear, endMonth, 20, 23, 59, 59, 999))

  const label = `${startYear}/${startMonth + 1}/${21} - ${endYear}/${endMonth + 1}/${20}`

  return { start, end, label }
}
