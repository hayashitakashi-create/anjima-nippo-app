import puppeteer from 'puppeteer';

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJjbWxhYXZwM3QwMDAweWwxb3hkNW9ndTMzIiwibmFtZSI6IuWuieWztuOAgOmahiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NDY4MTc1OCwiZXhwIjoxNzc0NzY4MTU4fQ.vMDyqfXkTKWVhC9t1RyVepIZQM5w_jN-gQEjSKPGM6M';
const BASE = 'https://anjima-nippo-app.vercel.app';

async function login(page) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate((token) => {
    document.cookie = `auth_token=${token}; path=/; SameSite=Lax`;
  }, TOKEN);
}

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  // ====== TEST ① 4段階承認フロー ======
  console.log('=== TEST ① 4段階承認フロー ===');
  const p1 = await browser.newPage();
  await p1.setViewport({ width: 1280, height: 900 });
  await login(p1);

  // 承認管理ページで承認フロー表示を確認
  await p1.goto(BASE + '/admin/approvals', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await p1.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // 日報行をクリックして展開
  await p1.evaluate(() => {
    const chevron = document.querySelector('[class*="cursor-pointer"]');
    if (chevron) chevron.click();
    // またはChevronDownアイコンのある行をクリック
    const rows = document.querySelectorAll('[class*="border-b"]');
    for (const row of rows) {
      if (row.textContent.includes('承認待ち')) {
        row.click();
        break;
      }
    }
  });
  await new Promise(r => setTimeout(r, 1500));

  // ページに「承認状況」テキストがあるか
  const hasFlowLabel = await p1.evaluate(() => document.body.innerText.includes('承認状況'));
  console.log('  承認状況表示:', hasFlowLabel ? '✅ PASS' : '❌ FAIL');

  // 4段階のラベルがあるか
  const hasRoles = await p1.evaluate(() => {
    const text = document.body.innerText;
    return {
      上長: text.includes('上長'),
      常務: text.includes('常務'),
      専務: text.includes('専務'),
      社長: text.includes('社長'),
    };
  });
  const allRoles = hasRoles.上長 && hasRoles.常務 && hasRoles.専務 && hasRoles.社長;
  console.log('  4段階ラベル:', allRoles ? '✅ PASS' : '❌ FAIL', JSON.stringify(hasRoles));

  await p1.screenshot({ path: '/tmp/screenshots/test-01-approval-flow.png', fullPage: false });
  await p1.close();

  // ====== TEST ② テキスト色 ======
  console.log('\n=== TEST ② フォーム入力のテキスト色 ===');
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1280, height: 900 });
  await login(p2);

  await p2.goto(BASE + '/nippo-improved', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await p2.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 500));

  // input要素のcolorを取得
  const inputColor = await p2.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (!input) return 'no input found';
    const style = window.getComputedStyle(input);
    return style.color;
  });
  console.log('  input[type="date"] color:', inputColor);
  // rgb(17, 24, 39) = #111827 = gray-900
  const isBlack = inputColor.includes('rgb(17, 24, 39)') || inputColor.includes('rgb(0, 0, 0)');
  console.log('  結果:', isBlack ? '✅ PASS (黒系)' : '❌ FAIL (グレー系)');

  await p2.screenshot({ path: '/tmp/screenshots/test-02-text-color.png', fullPage: false });
  await p2.close();

  // ====== TEST ③ 休暇届印刷 - 申請者名 ======
  console.log('\n=== TEST ③ 休暇届印刷 - 申請者名反映 ===');
  const p3 = await browser.newPage();
  await p3.setViewport({ width: 1280, height: 900 });
  await login(p3);

  // 休暇届一覧から最初の休暇届を取得
  const leaveRes = await p3.evaluate(async (base) => {
    const res = await fetch(base + '/api/leave-requests', { credentials: 'include' });
    return res.json();
  }, BASE);
  const firstLeave = (leaveRes.leaveRequests || [])[0];
  if (firstLeave) {
    console.log('  テスト休暇届ID:', firstLeave.id);
    console.log('  applicantName:', firstLeave.applicantName || '(なし)');

    // 印刷ページへ遷移
    await p3.goto(BASE + `/leave-requests/${firstLeave.id}/print`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // 申請者名が表示されているか
    const printText = await p3.evaluate(() => document.body.innerText);
    const displayName = firstLeave.applicantName || firstLeave.userName;
    const hasApplicant = printText.includes(displayName);
    console.log('  表示名:', displayName);
    console.log('  結果:', hasApplicant ? '✅ PASS' : '❌ FAIL');

    await p3.screenshot({ path: '/tmp/screenshots/test-03-leave-print.png', fullPage: false });
  } else {
    console.log('  ⚠️ 休暇届が0件のためスキップ');
  }
  await p3.close();

  // ====== TEST ④ 休暇届印刷 - 戻るボタン ======
  console.log('\n=== TEST ④ 休暇届印刷 - 戻るボタン ===');
  const p4 = await browser.newPage();
  await p4.setViewport({ width: 1280, height: 900 });
  await login(p4);

  if (firstLeave) {
    // 直接印刷ページにアクセス（履歴なし）
    await p4.goto(BASE + `/leave-requests/${firstLeave.id}/print`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // 戻るボタンをクリック
    const clicked = await p4.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const backBtn = buttons.find(b => b.textContent.trim() === '戻る');
      if (backBtn) { backBtn.click(); return true; }
      return false;
    });
    console.log('  戻るボタンクリック:', clicked ? 'OK' : 'ボタンなし');

    await new Promise(r => setTimeout(r, 3000));
    const currentUrl = p4.url();
    console.log('  遷移先URL:', currentUrl);
    const isLeaveList = currentUrl.includes('/leave-requests') && !currentUrl.includes('/print');
    console.log('  結果:', isLeaveList ? '✅ PASS' : '❌ FAIL');

    await p4.screenshot({ path: '/tmp/screenshots/test-04-back-button.png', fullPage: false });
  } else {
    console.log('  ⚠️ 休暇届が0件のためスキップ');
  }
  await p4.close();

  await browser.close();
  console.log('\n=== 全テスト完了 ===');
})();
