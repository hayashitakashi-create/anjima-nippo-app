// 氏名の表記揺れを吸収する正規化
// - 全角/半角スペース除去
// - 中黒の半角「･」→ 全角「・」統一
// - 旧字体・異体字を共通字に置換

const VARIANT_MAP: Record<string, string> = {
  '﨑': '崎',
  '朗': '郎',
  '曵': '曳',
  '邊': '辺',
  '渡': '渡', // 渡邊 → 渡辺 互換のためダミー（後段の他文字でカバー）
  '濵': '浜',
  '德': '徳',
  '隆': '隆', // 例外（同一）
}

export function normalizeName(input: string | null | undefined): string {
  if (!input) return ''
  let s = input.replace(/[\s　]+/g, '')
  s = s.replace(/[･]/g, '・')
  for (const [k, v] of Object.entries(VARIANT_MAP)) {
    if (k !== v) s = s.split(k).join(v)
  }
  return s
}
