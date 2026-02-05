'use client'

/**
 * TimeRangePicker 使用例デモページ
 *
 * このページは実装例を示すためのデモです。
 * 実際の日報ページへの統合方法も示しています。
 */

import TimeRangePicker from '@/components/TimeRangePicker'
import { useTimeRange } from '@/hooks/useTimeRange'

export default function TimePickerDemoPage() {
  // カスタムフックで状態管理
  const {
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    isValid,
    errorMessage,
    workDurationMinutes,
    workDurationHours,
    reset
  } = useTimeRange({
    initialStartTime: '08:00',
    initialEndTime: '10:00'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      alert('入力内容にエラーがあります')
      return
    }

    console.log('送信データ:', {
      startTime,
      endTime,
      workDurationMinutes,
      workDurationHours
    })

    alert(`作業時間を登録しました\n${startTime} 〜 ${endTime}\n作業時間: ${workDurationHours}時間`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* ページタイトル */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            作業時間入力UI デモ
          </h1>
          <p className="text-gray-600">
            30分刻みの時刻選択、バリデーション、作業時間計算の実装例
          </p>
        </div>

        {/* デモフォーム */}
        <div className="bg-white shadow rounded-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TimeRangePicker コンポーネント（業務時間範囲指定） */}
            <div className="mb-4">
              <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-3">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                業務時間範囲: 07:30 - 10:30（カスタマイズ可能）
              </div>
            </div>
            <TimeRangePicker
              startTime={startTime}
              endTime={endTime}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              startTimeRange="07:30"
              endTimeRange="10:30"
            />

            {/* 作業時間表示 */}
            {isValid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-800 font-medium">
                    作業時間
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-900">
                      {workDurationHours}時間
                    </div>
                    <div className="text-xs text-blue-600">
                      ({workDurationMinutes}分)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!isValid}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-base font-medium transition-colors"
              >
                登録する
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-base font-medium transition-colors"
              >
                リセット
              </button>
            </div>
          </form>
        </div>

        {/* 実装コード例 */}
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">実装例</h2>

          <div className="space-y-6">
            {/* 基本的な使い方 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                1. 基本的な使い方
              </h3>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-sm">
{`import TimeRangePicker from '@/components/TimeRangePicker'
import { useTimeRange } from '@/hooks/useTimeRange'

function MyComponent() {
  const {
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    isValid,
    errorMessage
  } = useTimeRange({
    initialStartTime: '08:00',
    initialEndTime: '10:00'
  })

  return (
    <TimeRangePicker
      startTime={startTime}
      endTime={endTime}
      onStartTimeChange={setStartTime}
      onEndTimeChange={setEndTime}
      startTimeRange="07:30"  // 業務開始時刻（省略可）
      endTimeRange="10:30"    // 業務終了時刻（省略可）
    />
  )
}`}
              </pre>
            </div>

            {/* 日報への統合例 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                2. 日報フォームへの統合例
              </h3>
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-sm">
{`// 訪問記録の型
interface VisitRecord {
  destination: string
  startTime: string
  endTime: string
  content: string
}

// 訪問記録ごとに TimeRangePicker を使用
const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([{
  destination: '',
  startTime: '08:00',
  endTime: '09:00',
  content: ''
}])

// 時刻変更ハンドラー
const handleStartTimeChange = (index: number, time: string) => {
  const newRecords = [...visitRecords]
  newRecords[index].startTime = time
  setVisitRecords(newRecords)
}

const handleEndTimeChange = (index: number, time: string) => {
  const newRecords = [...visitRecords]
  newRecords[index].endTime = time
  setVisitRecords(newRecords)
}

// レンダリング
{visitRecords.map((record, index) => (
  <TimeRangePicker
    key={index}
    startTime={record.startTime}
    endTime={record.endTime}
    onStartTimeChange={(time) => handleStartTimeChange(index, time)}
    onEndTimeChange={(time) => handleEndTimeChange(index, time)}
  />
))}`}
              </pre>
            </div>

            {/* 機能一覧 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                3. 主な機能
              </h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>30分刻みの時刻選択（カスタム範囲指定可能）</li>
                <li>業務時間範囲の制限表示（例: 07:30 - 10:30のみ表示）</li>
                <li>開始時刻 &lt; 終了時刻のバリデーション</li>
                <li>エラーメッセージ表示</li>
                <li>作業時間の自動計算（分・時間）</li>
                <li>スマホ対応の大きなフォント（22px）</li>
                <li>アクセシビリティ対応（label, id）</li>
                <li>disabled状態のサポート</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
