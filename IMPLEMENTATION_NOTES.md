# 使用材料・消耗品の改善実装メモ

## 要件
1. ✅ 材料名: 使用材料マスタから選択 + 自由入力可能 （既に実装済み - datalist使用）
2. 管理画面でデフォルト単位を設定し、作業日報に反映
3. 単位: 自由入力可能に（現在はselectで固定選択肢）
4. 外注先: 自由入力可能に（現在はselectで固定選択肢）
5. 単価(円): 数字を入れたらカンマ区切り表示

## 実装状況

### 完了
- ✅ Prisma schema に Material.defaultVolume, defaultUnit を追加
- ✅ 管理画面 (app/admin/materials/page.tsx) でデフォルト容量・単位を設定可能に
- ✅ API (app/api/admin/materials/route.ts) でdefaultVolume, defaultUnit を保存

### 次のステップ
1. 作業日報newページ・編集ページで:
   - 単位入力をselectからdatalist+inputに変更
   - 外注先入力をselectからdatalist+inputに変更
   - 単価入力にカンマ区切り表示を追加
   - （オプション）材料名選択時にデフォルト容量・単位を自動入力

2. ファイル
   - app/work-report/new/page.tsx
   - app/work-report/[id]/page.tsx

## 実装方針
単位と外注先について、以下のUIに変更：
- select → input type="text" + datalist
- これにより選択肢から選ぶことも、自由入力することも可能に
