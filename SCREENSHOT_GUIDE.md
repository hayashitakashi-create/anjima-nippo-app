# スクリーンショット撮影ガイド

## 概要
このガイドに従って、操作説明書に必要な画面キャプチャを撮影してください。

## 準備
1. ブラウザでアプリを開く: http://localhost:3000
2. 管理者アカウントでログイン

## 撮影方法（Mac）
- **全画面**: `Cmd + Shift + 3`
- **選択範囲**: `Cmd + Shift + 4`（推奨）
- **ウィンドウ**: `Cmd + Shift + 4` → `Space`

## 撮影する画面と保存ファイル名

### 1. ログイン画面
- **URL**: http://localhost:3000/login
- **ファイル名**: `01_login.png`
- **撮影内容**: ログインフォーム全体

### 2. ダッシュボード（トップページ）
- **URL**: http://localhost:3000/dashboard
- **ファイル名**: `02_dashboard.png`
- **撮影内容**: ダッシュボード全体（統計情報、グラフなど）

### 3. 営業日報 - 一覧
- **URL**: http://localhost:3000/nippo
- **ファイル名**: `03_nippo_list.png`
- **撮影内容**: 営業日報の一覧画面

### 4. 営業日報 - 新規作成
- **URL**: http://localhost:3000/nippo/new
- **ファイル名**: `04_nippo_new.png`
- **撮影内容**: 営業日報の新規作成フォーム全体

### 5. 営業日報 - 詳細
- **URL**: http://localhost:3000/nippo/[id] （既存の日報IDを使用）
- **ファイル名**: `05_nippo_detail.png`
- **撮影内容**: 営業日報の詳細・編集画面

### 6. 作業日報 - 一覧
- **URL**: http://localhost:3000/work-report/projects
- **ファイル名**: `06_work_report_list.png`
- **撮影内容**: 作業日報の一覧画面

### 7. 作業日報 - 新規作成（上部）
- **URL**: http://localhost:3000/work-report/new
- **ファイル名**: `07_work_report_new_top.png`
- **撮影内容**: 作業日報の基本情報入力部分

### 8. 作業日報 - 新規作成（下部）
- **URL**: http://localhost:3000/work-report/new（下にスクロール）
- **ファイル名**: `08_work_report_new_bottom.png`
- **撮影内容**: 材料・外注先入力部分（datalist候補表示）

### 9. 案件管理 - 一覧
- **URL**: http://localhost:3000/work-report/projects
- **ファイル名**: `09_projects_list.png`
- **撮影内容**: 案件一覧画面

### 10. 案件管理 - 詳細
- **URL**: http://localhost:3000/work-report/projects/[id]
- **ファイル名**: `10_project_detail.png`
- **撮影内容**: 案件詳細画面

### 11. 管理画面 - トップ
- **URL**: http://localhost:3000/admin
- **ファイル名**: `11_admin_top.png`
- **撮影内容**: 管理画面のメニュー

### 12. 管理画面 - ユーザー管理
- **URL**: http://localhost:3000/admin
- **ファイル名**: `12_admin_users.png`
- **撮影内容**: ユーザー管理画面

### 13. 管理画面 - 承認管理
- **URL**: http://localhost:3000/admin/approvals
- **ファイル名**: `13_admin_approvals.png`
- **撮影内容**: 承認管理画面

### 14. 管理画面 - 材料マスタ
- **URL**: http://localhost:3000/admin/materials
- **ファイル名**: `14_admin_materials.png`
- **撮影内容**: 材料マスタ管理画面

### 15. 管理画面 - 単位マスタ
- **URL**: http://localhost:3000/admin/units
- **ファイル名**: `15_admin_units.png`
- **撮影内容**: 単位マスタ管理画面

### 16. 管理画面 - 外注先マスタ
- **URL**: http://localhost:3000/admin/subcontractors
- **ファイル名**: `16_admin_subcontractors.png`
- **撮影内容**: 外注先マスタ管理画面

### 17. 管理画面 - 工事種別マスタ
- **URL**: http://localhost:3000/admin/project-types
- **ファイル名**: `17_admin_project_types.png`
- **撮影内容**: 工事種別マスタ管理画面

### 18. 管理画面 - 集計
- **URL**: http://localhost:3000/admin/aggregation
- **ファイル名**: `18_admin_aggregation.png`
- **撮影内容**: 集計画面

### 19. 管理画面 - 一括印刷
- **URL**: http://localhost:3000/admin/bulk-print
- **ファイル名**: `19_admin_bulk_print.png`
- **撮影内容**: 一括印刷画面

### 20. スマートフォン表示（オプション）
- **デバイス**: Chromeのデベロッパーツール > デバイスツールバー
- **ファイル名**: `20_mobile_view.png`
- **撮影内容**: モバイル表示の例

## 保存先
全てのスクリーンショットを以下のディレクトリに保存してください:
```
/Users/dw1003/anjima-nippo-app/public/screenshots/
```

## 撮影後
1. すべてのスクリーンショットを保存
2. ファイル名が正しいか確認
3. 画像が鮮明で読みやすいか確認
4. USER_MANUAL.mdに画像リンクを追加

## 画像の最適化（オプション）
大きすぎる画像は以下のコマンドで圧縮できます:
```bash
# ImageMagickを使用（インストール必要）
mogrify -resize 1200x -quality 85 public/screenshots/*.png
```
