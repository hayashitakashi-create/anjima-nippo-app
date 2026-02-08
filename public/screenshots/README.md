# スクリーンショット格納ディレクトリ

このディレクトリには、操作説明書（USER_MANUAL.md）で使用するスクリーンショットを格納します。

## スクリーンショット撮影手順

詳細な撮影手順については、プロジェクトルートの `SCREENSHOT_GUIDE.md` を参照してください。

## 必要なスクリーンショット一覧

1. `01_login.png` - ログイン画面
2. `02_dashboard.png` - ダッシュボード
3. `03_nippo_list.png` - 営業日報一覧
4. `04_nippo_new.png` - 営業日報新規作成
5. `05_nippo_detail.png` - 営業日報詳細
6. `06_work_report_list.png` - 作業日報一覧
7. `07_work_report_new_top.png` - 作業日報新規作成（上部）
8. `08_work_report_new_bottom.png` - 作業日報新規作成（材料入力部分）
9. `09_projects_list.png` - 案件一覧
10. `10_project_detail.png` - 案件詳細
11. `11_admin_top.png` - 管理画面トップ
12. `12_admin_users.png` - ユーザー管理
13. `13_admin_approvals.png` - 承認管理
14. `14_admin_materials.png` - 材料マスタ
15. `15_admin_units.png` - 単位マスタ
16. `16_admin_subcontractors.png` - 外注先マスタ
17. `17_admin_project_types.png` - 工事種別マスタ
18. `18_admin_aggregation.png` - 集計画面
19. `19_admin_bulk_print.png` - 一括印刷
20. `20_mobile_view.png` - モバイル表示（オプション）

## 撮影のポイント

- 個人情報が含まれないように注意
- デモデータ、またはダミーデータを使用
- 解像度は1200px幅程度を推奨
- PNG形式で保存
- ファイル名は上記の命名規則に従う

## 画像の圧縮

大きすぎる画像は以下のコマンドで圧縮できます（ImageMagickが必要）:

```bash
mogrify -resize 1200x -quality 85 public/screenshots/*.png
```
