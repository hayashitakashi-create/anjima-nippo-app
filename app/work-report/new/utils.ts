// ユーティリティ関数

// 全角数字を半角に変換
export const toHalfWidth = (str: string): string => {
  return str.replace(/[０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
  }).replace(/[．]/g, '.').replace(/[，]/g, ',')
}
