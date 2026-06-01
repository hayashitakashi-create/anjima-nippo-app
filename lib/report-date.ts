// 日報・休暇届の「日付」を JST カレンダー日の UTC 午前0時 に正規化する。
//
// 背景: 提出状況カレンダー(サーバ・UTCキー) と 月カレンダー(クライアント・JSTキー) は
// 日付キーの作り方が異なるため、保存値が UTC午前0時 でないと 1 日ズレ得る。
// 保存を常に「JST暦日の UTC午前0時」に固定すれば、両者のキーは必ず一致する。
//
// 入力が 'YYYY-MM-DD'（現行クライアントの送信形式）の場合は no-op（結果不変）。
// 時刻付きのISO/Dateが来ても、JSTでの暦日に丸めて UTC午前0時 を返す。
export function toReportDate(input: string | Date): Date {
  const d = new Date(input)
  if (isNaN(d.getTime())) {
    throw new Error(`不正な日付です: ${String(input)}`)
  }
  // UTC+9(JST)に寄せてから暦日を取り、その日の UTC午前0時 を返す
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()))
}
