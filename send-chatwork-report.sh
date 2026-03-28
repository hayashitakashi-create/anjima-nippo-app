#!/bin/bash
# 安島工業 改修報告 - 安島隆さん宛
# 送信予定: 2026-03-30 09:00

ROOM_ID=347366241
TOKEN=$(python3 -c "import json; d=json.load(open('$HOME/.claude/mcp.json')); print(d['mcpServers']['chatwork']['env']['CHATWORK_API_TOKEN'])")
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

MESSAGE='[To:10238374]安島隆さん
[info][title]日報システム改修完了のご報告[/title]お世話になっております。
先日ご依頼いただいた下記4件の改修が完了いたしましたのでご報告いたします。

①承認機能の改善
・上長/常務/専務/社長の4段階並列承認に変更
・各承認者がいつでも承認可能
・未承認者が一目でわかる表示
・一括承認機能を追加

②フォーム入力のテキスト色修正
・入力文字がグレー→黒に改善
・印刷/PDF出力時も黒で表示されるよう修正

③休暇届印刷の申請者名反映
・印刷画面に申請者名が正しく表示されるよう修正

④休暇届印刷画面の「戻る」ボタン修正
・戻るボタンが正常に機能するよう修正

ご確認のほどよろしくお願いいたします。[/info]'

# メッセージ送信
echo "=== メッセージ送信 ==="
curl -s -X POST "https://api.chatwork.com/v2/rooms/${ROOM_ID}/messages" \
  -H "X-ChatWorkToken: ${TOKEN}" \
  -d "body=${MESSAGE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('message_id:', d.get('message_id','ERROR'))"

# スクリーンショット送信
SCREENSHOTS=(
  "test-01-approval-flow.png:①承認機能（4段階並列承認）"
  "test-02-text-color.png:②テキスト色修正"
  "test-03-leave-print.png:③休暇届印刷 申請者名反映"
  "test-04-back-button.png:④戻るボタン修正後の遷移"
)

for item in "${SCREENSHOTS[@]}"; do
  FILE="${item%%:*}"
  CAPTION="${item##*:}"
  FILEPATH="${BASE_DIR}/${FILE}"
  if [ -f "$FILEPATH" ]; then
    echo "=== 送信: ${CAPTION} ==="
    curl -s -X POST "https://api.chatwork.com/v2/rooms/${ROOM_ID}/files" \
      -H "X-ChatWorkToken: ${TOKEN}" \
      -F "file=@${FILEPATH}" \
      -F "message=${CAPTION}" | python3 -c "import sys,json; d=json.load(sys.stdin); print('file_id:', d.get('file_id','ERROR'))"
  else
    echo "SKIP: ${FILEPATH} not found"
  fi
done

echo "=== 送信完了 ==="
