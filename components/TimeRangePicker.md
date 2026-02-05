# TimeRangePicker コンポーネント

作業時間入力UI - 業務用アプリ向けのシンプルで堅牢な時刻選択コンポーネント

## 📋 目次

- [概要](#概要)
- [機能](#機能)
- [使用方法](#使用方法)
- [API](#api)
- [実装例](#実装例)
- [バリデーション](#バリデーション)

## 概要

30分刻みの時刻選択、自動バリデーション、作業時間計算を備えた作業時間入力UIコンポーネント。

## 機能

✅ **30分刻みの時刻選択**
- 00:00 から 23:30 まで
- セレクトボックス形式で確実に30分刻みを保証

✅ **自動バリデーション**
- 開始時刻 < 終了時刻のチェック
- リアルタイムエラー表示

✅ **スマホ対応**
- 大きなフォント（22px）
- タップしやすいサイズ（高さ64px）

✅ **状態管理**
- カスタムフック `useTimeRange` で簡単管理
- 作業時間の自動計算

✅ **アクセシビリティ**
- label と id の適切な関連付け
- エラー状態の視覚的フィードバック

## 使用方法

### 1. 基本的な使い方

```tsx
import TimeRangePicker from '@/components/TimeRangePicker'
import { useTimeRange } from '@/hooks/useTimeRange'

function MyComponent() {
  const {
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    isValid
  } = useTimeRange()

  return (
    <TimeRangePicker
      startTime={startTime}
      endTime={endTime}
      onStartTimeChange={setStartTime}
      onEndTimeChange={setEndTime}
    />
  )
}
```

### 2. 初期値を指定

```tsx
const {
  startTime,
  endTime,
  setStartTime,
  setEndTime
} = useTimeRange({
  initialStartTime: '09:00',
  initialEndTime: '17:00'
})
```

### 3. 作業時間を取得

```tsx
const {
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  workDurationMinutes,  // 分単位
  workDurationHours     // 時間単位（小数点1桁）
} = useTimeRange()

console.log(`作業時間: ${workDurationHours}時間`)  // 例: 2.5時間
```

### 4. disabled状態

```tsx
<TimeRangePicker
  startTime={startTime}
  endTime={endTime}
  onStartTimeChange={setStartTime}
  onEndTimeChange={setEndTime}
  disabled={isSubmitting}
/>
```

## API

### TimeRangePicker Props

| Prop | Type | 必須 | 説明 |
|------|------|------|------|
| `startTime` | `string` | ✅ | 開始時刻（HH:mm形式） |
| `endTime` | `string` | ✅ | 終了時刻（HH:mm形式） |
| `onStartTimeChange` | `(time: string) => void` | ✅ | 開始時刻変更ハンドラー |
| `onEndTimeChange` | `(time: string) => void` | ✅ | 終了時刻変更ハンドラー |
| `error` | `string` | - | カスタムエラーメッセージ |
| `disabled` | `boolean` | - | 無効化フラグ（デフォルト: false） |

### useTimeRange Options

| Option | Type | デフォルト | 説明 |
|--------|------|-----------|------|
| `initialStartTime` | `string` | `'08:00'` | 初期開始時刻 |
| `initialEndTime` | `string` | `'10:00'` | 初期終了時刻 |

### useTimeRange Return

| Property | Type | 説明 |
|----------|------|------|
| `startTime` | `string` | 現在の開始時刻 |
| `endTime` | `string` | 現在の終了時刻 |
| `setStartTime` | `(time: string) => void` | 開始時刻を設定 |
| `setEndTime` | `(time: string) => void` | 終了時刻を設定 |
| `isValid` | `boolean` | バリデーション結果 |
| `errorMessage` | `string` | エラーメッセージ |
| `workDurationMinutes` | `number` | 作業時間（分） |
| `workDurationHours` | `number` | 作業時間（時間、小数点1桁） |
| `reset` | `() => void` | 初期値にリセット |

## 実装例

### 日報フォームへの統合

```tsx
interface VisitRecord {
  destination: string
  startTime: string
  endTime: string
  content: string
}

function DailyReportForm() {
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([
    {
      destination: '',
      startTime: '08:00',
      endTime: '09:00',
      content: ''
    }
  ])

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

  return (
    <div>
      {visitRecords.map((record, index) => (
        <div key={index}>
          <input
            type="text"
            value={record.destination}
            onChange={(e) => {
              const newRecords = [...visitRecords]
              newRecords[index].destination = e.target.value
              setVisitRecords(newRecords)
            }}
            placeholder="訪問先"
          />

          <TimeRangePicker
            startTime={record.startTime}
            endTime={record.endTime}
            onStartTimeChange={(time) => handleStartTimeChange(index, time)}
            onEndTimeChange={(time) => handleEndTimeChange(index, time)}
          />

          <textarea
            value={record.content}
            onChange={(e) => {
              const newRecords = [...visitRecords]
              newRecords[index].content = e.target.value
              setVisitRecords(newRecords)
            }}
            placeholder="営業内容"
          />
        </div>
      ))}
    </div>
  )
}
```

### フォーム送信時のバリデーション

```tsx
function MyForm() {
  const {
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    isValid,
    errorMessage
  } = useTimeRange()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーションチェック
    if (!isValid) {
      alert(errorMessage)
      return
    }

    // APIへ送信
    fetch('/api/work-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startTime,
        endTime
      })
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <TimeRangePicker
        startTime={startTime}
        endTime={endTime}
        onStartTimeChange={setStartTime}
        onEndTimeChange={setEndTime}
      />
      <button type="submit" disabled={!isValid}>
        送信
      </button>
    </form>
  )
}
```

## バリデーション

### 自動バリデーション

コンポーネントは以下のバリデーションを自動で実行します：

1. **開始時刻 < 終了時刻**
   - エラーメッセージ: 「終了時刻は開始時刻より後に設定してください」
   - セレクトボックスが赤枠で表示される

### カスタムバリデーション

独自のバリデーションを追加する場合：

```tsx
function MyComponent() {
  const {
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    isValid,
    workDurationHours
  } = useTimeRange()

  // カスタムバリデーション例: 作業時間が8時間を超えないこと
  const customError = workDurationHours > 8
    ? '作業時間は8時間以内にしてください'
    : ''

  return (
    <TimeRangePicker
      startTime={startTime}
      endTime={endTime}
      onStartTimeChange={setStartTime}
      onEndTimeChange={setEndTime}
      error={customError}
    />
  )
}
```

## デモページ

実際の動作を確認するには：

```
http://localhost:3001/time-picker-demo
```

## ファイル構成

```
/components/TimeRangePicker.tsx       # メインコンポーネント
/hooks/useTimeRange.ts                # カスタムフック
/app/time-picker-demo/page.tsx        # デモページ
/components/TimeRangePicker.md        # このドキュメント
```

## 技術スタック

- React 19+
- TypeScript
- Tailwind CSS
- Next.js App Router

## 注意事項

⚠️ **30分刻みのルール**
- time inputではなくselectボックスを使用
- ブラウザによるstep属性の動作の違いを回避

⚠️ **バリデーション**
- 開始時刻 < 終了時刻のチェックは必須
- isValidプロパティを確認してから送信すること

⚠️ **スマホ対応**
- フォントサイズ22px、高さ64pxで最適化済み
- さらにカスタマイズする場合はstyleプロップを調整
