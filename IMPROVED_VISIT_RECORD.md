# 改善版：訪問記録入力画面

既存の訪問記録入力UIを改善し、構造化・拡張性・保守性を向上させた実装

## 📋 目次

- [概要](#概要)
- [改善ポイント](#改善ポイント)
- [アーキテクチャ](#アーキテクチャ)
- [コンポーネント構成](#コンポーネント構成)
- [バリデーション](#バリデーション)
- [使用方法](#使用方法)

## 概要

「1日の行動ログ → その中の1訪問」という構造を明確にし、将来の拡張（複数訪問、集計機能など）に対応できる設計に改善しました。

## 改善ポイント

### ✅ 1. 構造の明確化

**Before:**
- フラットな構造でフィールドが混在
- 訪問記録の管理が煩雑

**After:**
- 上部固定情報（日付・氏名）と訪問記録を分離
- 訪問記録をカードUIでブロック化
- 階層構造が視覚的に理解しやすい

### ✅ 2. コンポーネント分離

**Before:**
- 1ファイルに全てのロジックを記述
- 再利用性が低い

**After:**
```
/components/VisitRecordCard.tsx       # 訪問記録ブロック
/components/TimeRangePicker.tsx       # 時刻選択
/hooks/useVisitRecordValidation.ts   # バリデーションロジック
/hooks/useTimeRange.ts                # 時刻管理
```

### ✅ 3. バリデーション強化

- 日付: 必須、未来日不可
- 訪問先: 必須
- 商談内容: 必須、500文字以内
- 時刻: 開始 < 終了
- リアルタイムエラー表示
- 視覚的フィードバック（赤枠、エラーメッセージ）

### ✅ 4. 自動時刻連携

- 訪問記録の終了時刻を変更すると、次の訪問記録の開始時刻が自動的に同じ時刻に更新
- 連続した訪問記録の入力が効率的に
- 例: 訪問1が 08:00-11:00 → 訪問2の開始時刻が自動的に 11:00 に

### ✅ 5. 将来の拡張性

- 複数訪問記録の追加・削除
- 訪問記録ごとの時間・経費の合計計算
- 訪問記録のソート・並び替え
- 訪問記録のテンプレート機能

## アーキテクチャ

### データフロー

```
┌─────────────────────────────────────┐
│  ImprovedNippoPage (Container)      │
│  - 全体の状態管理                    │
│  - API通信                          │
│  - フォーム送信                      │
└──────────┬──────────────────────────┘
           │
           ├─→ useVisitRecordValidation
           │   └─→ バリデーションロジック
           │
           ├─→ VisitRecordCard (Presentation)
           │   ├─→ 訪問記録の表示・入力
           │   └─→ TimeRangePicker
           │       └─→ useTimeRange
           │           └─→ 時刻管理・計算
           │
           └─→ 上部固定情報（日付・氏名）
```

### 責務の分離

| レイヤー | 役割 | ファイル |
|---------|------|---------|
| **Container** | 状態管理、API通信 | `/app/nippo-improved/page.tsx` |
| **Presentation** | UI表示 | `/components/VisitRecordCard.tsx` |
| **Logic** | ビジネスロジック | `/hooks/*.ts` |

## コンポーネント構成

### 1. VisitRecordCard

訪問記録1件分の入力ブロック

**Props:**
```typescript
interface VisitRecordCardProps {
  index: number                          // 表示順
  data: VisitRecordData                  // 訪問記録データ
  onChange: (id, data) => void           // 変更ハンドラー
  onDelete?: (id) => void                // 削除ハンドラー
  showDelete?: boolean                   // 削除ボタン表示
  errors?: ValidationErrors              // エラー情報
}
```

**機能:**
- 訪問先入力
- 担当者氏名入力
- 作業時間選択（TimeRangePicker統合）
- 商談内容入力（文字数カウンター）
- 支出経費入力
- 削除確認ダイアログ

### 2. TimeRangePicker

作業時間入力コンポーネント

**特徴:**
- 30分刻みの時刻選択
- 自動バリデーション（開始 < 終了）
- スマホ最適化（大きいフォント）

### 3. useVisitRecordValidation

バリデーション用カスタムフック

**機能:**
- 全フィールドのバリデーション
- エラーメッセージ生成
- 送信可否判定
- エラー数カウント

**使用例:**
```typescript
const { errors, isValid, errorCount } = useVisitRecordValidation({
  date,
  visitRecords
})

// エラーがある場合
if (!isValid) {
  alert(`入力内容にエラーがあります（${errorCount}件）`)
}
```

## バリデーション

### 日付

```typescript
// 必須チェック
if (!date) {
  errors.date = '日付を選択してください'
}

// 未来日チェック
if (isFutureDate(date)) {
  errors.date = '未来の日付は選択できません'
}
```

### 訪問記録

| フィールド | ルール | エラーメッセージ |
|-----------|--------|----------------|
| 訪問先 | 必須 | 「訪問先を入力してください」 |
| 商談内容 | 必須、500文字以内 | 「商談内容を入力してください」 |
| 時刻 | 開始 < 終了 | 「終了時刻は開始時刻より後に設定してください」 |

## 使用方法

### 1. デモページで確認

```
http://localhost:3001/nippo-improved
```

### 2. 既存ページに統合

既存の `/app/nippo/new/page.tsx` を置き換える場合：

```bash
# バックアップ
cp app/nippo/new/page.tsx app/nippo/new/page.tsx.backup

# 新しい実装をコピー
cp app/nippo-improved/page.tsx app/nippo/new/page.tsx
```

### 3. カスタマイズ

#### 訪問記録の初期数を変更

```typescript
const [visitRecords, setVisitRecords] = useState<VisitRecordData[]>([
  // 初期1件
  { id: '1', destination: '', ... },
  // 初期3件にする場合は追加
  { id: '2', destination: '', ... },
  { id: '3', destination: '', ... },
])
```

#### 最大訪問記録数を変更

```typescript
<button
  onClick={handleAddVisitRecord}
  disabled={visitRecords.length >= 10}  // ← ここを変更
>
```

#### バリデーションルールを追加

`/hooks/useVisitRecordValidation.ts` に追加：

```typescript
// 例: 作業時間が8時間を超えないこと
const startMinutes = timeToMinutes(record.startTime)
const endMinutes = timeToMinutes(record.endTime)
const duration = endMinutes - startMinutes

if (duration > 480) {  // 8時間 = 480分
  recordErrors.timeRange = '作業時間は8時間以内にしてください'
}
```

## 今後の拡張機能（実装予定）

### 1. 合計計算機能

```typescript
// 総作業時間
const totalWorkMinutes = visitRecords.reduce((sum, record) => {
  const start = timeToMinutes(record.startTime)
  const end = timeToMinutes(record.endTime)
  return sum + (end - start)
}, 0)

// 総経費
const totalExpense = visitRecords.reduce((sum, record) => {
  return sum + record.expense
}, 0)
```

### 2. 訪問記録の並び替え

```typescript
const handleMoveUp = (index: number) => {
  if (index === 0) return
  const newRecords = [...visitRecords]
  ;[newRecords[index - 1], newRecords[index]] =
    [newRecords[index], newRecords[index - 1]]
  setVisitRecords(newRecords)
}
```

### 3. テンプレート機能

```typescript
// よく使う訪問先をテンプレートとして保存
const templates = [
  {
    name: '○○株式会社',
    destination: '○○株式会社',
    contactPerson: '田中 太郎様',
    startTime: '09:00',
    endTime: '10:00'
  }
]

const handleApplyTemplate = (template) => {
  setVisitRecords(prev => [...prev, { ...template, id: generateId() }])
}
```

### 4. 下書き保存

```typescript
// LocalStorageに保存
const handleSaveDraft = () => {
  localStorage.setItem('nippo_draft', JSON.stringify({
    date,
    visitRecords,
    specialNotes
  }))
}

// 復元
const handleLoadDraft = () => {
  const draft = localStorage.getItem('nippo_draft')
  if (draft) {
    const data = JSON.parse(draft)
    setDate(data.date)
    setVisitRecords(data.visitRecords)
    setSpecialNotes(data.specialNotes)
  }
}
```

## ファイル一覧

```
/app/nippo-improved/page.tsx              # メインページ（改善版）
/components/VisitRecordCard.tsx           # 訪問記録カード
/components/TimeRangePicker.tsx           # 時刻選択
/hooks/useVisitRecordValidation.ts       # バリデーション
/hooks/useTimeRange.ts                    # 時刻管理
/components/TimeRangePicker.md            # TimeRangePicker ドキュメント
/IMPROVED_VISIT_RECORD.md                 # このドキュメント
```

## 技術スタック

- **React 19+**
- **TypeScript**
- **Next.js App Router**
- **Tailwind CSS**
- **カスタムフック（状態管理）**

## まとめ

### Before（既存）
- フラットな構造
- 1ファイルに全ロジック
- 基本的なバリデーションのみ

### After（改善版）
- ✅ 階層構造で見やすい
- ✅ コンポーネント分離で保守しやすい
- ✅ 強化されたバリデーション
- ✅ 将来の拡張に対応
- ✅ TypeScriptで型安全

既存の機能を保ちながら、コードの品質と拡張性を大幅に向上させました。
