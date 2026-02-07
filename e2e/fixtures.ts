// テスト用の認証情報
export const TEST_CREDENTIALS = {
  admin: {
    username: 't-yasujima@yasujimakougyou.co.jp',
    password: '00000000',
  },
  user: {
    username: 'k-uchida@yasujimakougyou.co.jp',
    password: '00000000',
  },
}

// テスト用ヘルパー
export async function login(page: any, role: 'admin' | 'user' = 'admin') {
  const creds = TEST_CREDENTIALS[role]
  await page.goto('/login')
  await page.getByRole('textbox', { name: /ユーザー名/i }).fill(creds.username)
  await page.getByLabel(/パスワード/i).fill(creds.password)
  await page.getByRole('button', { name: /ログイン/i }).click()
}
