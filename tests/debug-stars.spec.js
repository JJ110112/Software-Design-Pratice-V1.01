// @ts-check
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers');

/**
 * 星星同步迴歸測試
 *
 * 所有測試預設 sessionStorage-only（非永久登入），模擬真實學生。
 * 測試策略：因 Playwright 無 Firebase Auth，Firestore 讀取必定失敗，
 * 所以測試聚焦在「本地快取路徑」是否正確——這正是線上環境的主要讀取路徑。
 */

function collectLogs(page) {
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));
  return logs;
}

/** 注入快取資料（模擬已有成績） */
async function injectCache(page, userName, records) {
  await page.evaluate(({ userName, records }) => {
    localStorage.setItem(`fb_cache_${userName}`, JSON.stringify({
      time: Date.now(),
      data: records
    }));
  }, { userName, records });
}

/** 讀取 stats bar 中的星星數 */
async function getStatsBarStars(page, selector = '#user-stats-bar') {
  const text = await page.evaluate((sel) =>
    document.querySelector(sel)?.textContent || '', selector
  );
  const m = text.match(/(\d+)\s*\/\s*\d+/);
  return m ? parseInt(m[1]) : -1;
}

const SAMPLE_RECORDS = [
  { qID: 'SETUP_T01', gameMode: '連連看', stars: 3, status: 'PASS', timeSpent: 20, className: '資訊二', userName: '星星測試生' },
  { qID: 'Q1_T01',    gameMode: '連連看', stars: 3, status: 'PASS', timeSpent: 30, className: '資訊二', userName: '星星測試生' },
  { qID: 'Q1_T02',    gameMode: '連連看', stars: 3, status: 'PASS', timeSpent: 25, className: '資訊二', userName: '星星測試生' },
];

// ══════════════════════════════════════════
//  1. 登出→登入 星星不歸零
// ══════════════════════════════════════════
test.describe('登出→登入 星星同步', () => {

  test('index.html：登出再登入後星星不應歸零', async ({ page }) => {
    // 登入 + 注入 9 星快取
    await mockLogin(page, '/', { className: '資訊二', no: 1, name: '星星測試生' });
    await injectCache(page, '星星測試生', SAMPLE_RECORDS);

    // 確認首頁顯示 9 星
    await page.goto('/');
    await page.waitForTimeout(2000);
    const beforeLogout = await page.evaluate(() => {
      const el = document.getElementById('user-status');
      return el?.textContent || '';
    });
    expect(beforeLogout).toContain('⭐');
    expect(beforeLogout).toContain('9');

    // 登出
    await page.evaluate(() => { if (typeof logoutUser === 'function') logoutUser(); });
    await page.waitForTimeout(300);

    // 確認快取已清除
    const cacheAfterLogout = await page.evaluate(() =>
      localStorage.getItem('fb_cache_星星測試生')
    );
    expect(cacheAfterLogout, '登出後快取應被清除').toBeNull();

    // 重新登入（模擬選學生登入）
    await mockLogin(page, '/', { className: '資訊二', no: 1, name: '星星測試生' });
    // 模擬 Firestore 回傳（測試環境無真實 Firestore，手動注入）
    await injectCache(page, '星星測試生', SAMPLE_RECORDS);

    await page.goto('/');
    await page.waitForTimeout(2000);

    // 核心斷言：首頁應顯示 9 星
    const afterLogin = await page.evaluate(() => {
      const el = document.getElementById('user-status');
      return el?.textContent || '';
    });
    expect(afterLogin, '重新登入後首頁應顯示 9 星').toContain('9');
  });

  test('map.html：登出再登入後地圖星星不應歸零', async ({ page }) => {
    await mockLogin(page, '/', { className: '資訊二', no: 1, name: '星星測試生M' });
    await injectCache(page, '星星測試生M', SAMPLE_RECORDS.map(r => ({...r, userName: '星星測試生M'})));

    // 確認 getScoresForUser 能讀到快取
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);
    const initial = await page.evaluate(async () => {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!user) return { error: 'no user' };
      const scores = typeof window.getScoresForUser === 'function'
        ? await window.getScoresForUser(user.name) : [];
      return { count: scores.filter(s => s.gameMode === '連連看' && s.status === 'PASS').length };
    });
    expect(initial.count, '初始應有 3 筆連連看紀錄').toBe(3);

    // 登出
    await page.evaluate(() => { if (typeof logoutUser === 'function') logoutUser(); });
    await page.waitForTimeout(300);

    // 重新登入 + 注入快取
    await mockLogin(page, '/', { className: '資訊二', no: 1, name: '星星測試生M' });
    await injectCache(page, '星星測試生M', SAMPLE_RECORDS.map(r => ({...r, userName: '星星測試生M'})));

    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);

    // 核心斷言：getScoresForUser 回傳正確資料
    const afterLogin = await page.evaluate(async () => {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!user) return { error: 'no user' };
      const scores = typeof window.getScoresForUser === 'function'
        ? await window.getScoresForUser(user.name) : [];
      const filtered = scores.filter(s => s.gameMode === '連連看' && s.status === 'PASS');
      const totalStars = filtered.reduce((sum, r) => sum + (r.stars || 0), 0);
      return { count: filtered.length, totalStars };
    });
    expect(afterLogin.count, '重新登入後應有 3 筆紀錄').toBe(3);
    expect(afterLogin.totalStars, '重新登入後應有 9 星').toBe(9);
  });
});

// ══════════════════════════════════════════
//  2. 過關後即時更新（所有顯示位置）
// ══════════════════════════════════════════
test.describe('過關後星星即時同步', () => {

  test('遊戲頁 top bar 星星在過關後即時更新', async ({ page }) => {
    await mockLogin(page, '/', { className: '測試班', no: 1, name: '即時測試生' });
    await injectCache(page, '即時測試生', [
      { qID: 'SETUP_T01', gameMode: '連連看', stars: 2, status: 'PASS', timeSpent: 50, className: '測試班', userName: '即時測試生' }
    ]);

    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await page.waitForTimeout(2000);

    const starsBefore = await page.evaluate(() => {
      const badge = document.querySelector('#top-bar-star-badge');
      const m = badge?.textContent?.match(/⭐\s*(\d+)/);
      return m ? parseInt(m[1]) : -1;
    });

    // 玩遊戲
    await page.click('#btn-start');
    await page.waitForTimeout(500);
    const pairCount = await page.evaluate(() =>
      document.querySelectorAll('#col-left .item:not(.preview-mode)').length
    );
    for (let i = 0; i < pairCount; i++) {
      const idx = await page.evaluate(() => {
        const el = document.querySelector('#col-left .item:not(.matched):not(.preview-mode)');
        return el ? el.dataset.idx : null;
      });
      if (idx === null) break;
      await page.click(`#col-left .item[data-idx="${idx}"]:not(.matched)`);
      await page.waitForTimeout(100);
      await page.click(`#col-right .item[data-idx="${idx}"]:not(.matched)`);
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(2000);

    const starsAfter = await page.evaluate(() => {
      const badge = document.querySelector('#top-bar-star-badge');
      const m = badge?.textContent?.match(/⭐\s*(\d+)/);
      return m ? parseInt(m[1]) : -1;
    });
    expect(starsAfter, 'top bar 星星應在過關後增加').toBeGreaterThan(starsBefore);
  });

  test('saveScore 直接呼叫 → 快取正確 → 地圖能讀到', async ({ page }) => {
    await mockLogin(page, '/', { className: '測試班', no: 1, name: '同步測試生' });

    // 在遊戲頁呼叫 saveScore（模擬過關）
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await page.waitForTimeout(2000);

    await page.evaluate(async () => {
      if (typeof window.saveScore === 'function') {
        await window.saveScore('測試班', '同步測試生', 'SETUP_T01', '英中單字配對', 30, 'PASS', 3);
      }
    });
    await page.waitForTimeout(500);

    // 確認快取有紀錄
    const cached = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_同步測試生');
      if (!raw) return [];
      try { return JSON.parse(raw).data || []; } catch(e) { return []; }
    });
    expect(cached.some(r => r.qID === 'SETUP_T01' && r.gameMode === '連連看' && r.stars === 3),
      '快取應有 SETUP_T01 連連看 3 星').toBe(true);

    // 回地圖驗證
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);

    const result = await page.evaluate(async () => {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!user) return { error: 'no user' };
      const scores = typeof window.getScoresForUser === 'function'
        ? await window.getScoresForUser(user.name) : [];
      const filtered = scores.filter(s => s.gameMode === '連連看' && s.status === 'PASS');
      return { count: filtered.length, stars: filtered.reduce((s, r) => s + (r.stars || 0), 0) };
    });
    expect(result.count, '地圖應有過關紀錄').toBeGreaterThanOrEqual(1);
    expect(result.stars, '地圖應至少有 3 星').toBeGreaterThanOrEqual(3);
  });
});

// ══════════════════════════════════════════
//  3. sessionStorage vs localStorage 登入
// ══════════════════════════════════════════
test.describe('Storage 策略驗證', () => {

  test('非永久登入（sessionStorage-only）：getScoresForUser 能正確讀取', async ({ page }) => {
    await mockLogin(page, '/', { className: '資訊二', no: 1, name: 'Session測試' });
    await injectCache(page, 'Session測試', SAMPLE_RECORDS.map(r => ({...r, userName: 'Session測試'})));

    // 驗證 localStorage 沒有 sw_quiz_user
    const storageState = await page.evaluate(() => ({
      local: !!localStorage.getItem('sw_quiz_user'),
      session: !!sessionStorage.getItem('sw_quiz_user')
    }));
    expect(storageState.local, 'localStorage 不應有 user').toBe(false);
    expect(storageState.session, 'sessionStorage 應有 user').toBe(true);

    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(2000);

    const result = await page.evaluate(async () => {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!user) return { error: 'no user' };
      const scores = typeof window.getScoresForUser === 'function'
        ? await window.getScoresForUser(user.name) : [];
      return { count: scores.length, userName: user.name };
    });
    expect(result.count, 'sessionStorage 登入應讀到快取').toBeGreaterThan(0);
  });

  test('永久登入（localStorage）：getScoresForUser 能正確讀取', async ({ page }) => {
    await mockLogin(page, '/', { className: '資訊二', no: 1, name: 'Local測試', persist: true });
    await injectCache(page, 'Local測試', SAMPLE_RECORDS.map(r => ({...r, userName: 'Local測試'})));

    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);

    const result = await page.evaluate(async () => {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!user) return { error: 'no user' };
      const scores = typeof window.getScoresForUser === 'function'
        ? await window.getScoresForUser(user.name) : [];
      return { count: scores.filter(s => s.gameMode === '連連看' && s.status === 'PASS').length };
    });
    expect(result.count, '永久登入應讀到 3 筆紀錄').toBe(3);
  });
});

// ══════════════════════════════════════════
//  4. 背景同步不應破壞樂觀更新
// ══════════════════════════════════════════
test.describe('快取保護', () => {

  test('背景同步不覆蓋樂觀更新', async ({ page }) => {
    await mockLogin(page, '/', { className: '測試班', no: 1, name: '快取保護生' });

    // 先到地圖（建立空快取）
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(2000);

    // 模擬 saveScore 追加紀錄
    await page.evaluate(() => {
      const key = 'fb_cache_快取保護生';
      const raw = localStorage.getItem(key);
      let data = [];
      if (raw) { try { const o = JSON.parse(raw); if (Date.now() - o.time < 7200000) data = o.data || []; } catch(e) {} }
      data.push({ className: '測試班', userName: '快取保護生', qID: 'SETUP_T01', gameMode: '連連看', timeSpent: 25, status: 'PASS', stars: 3, timestamp: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
    });

    // 回地圖
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_快取保護生');
      const data = raw ? (JSON.parse(raw).data || []) : [];
      return {
        hasRecord: data.some(r => r.qID === 'SETUP_T01' && r.stars === 3),
        statsBar: document.getElementById('user-stats-bar')?.textContent || ''
      };
    });

    expect(result.hasRecord, '快取不應被背景同步覆蓋').toBe(true);
  });

  test('登出清除快取但不影響其他用戶', async ({ page }) => {
    // 用戶 A 登入
    await mockLogin(page, '/', { className: '資訊二', no: 1, name: '用戶A' });
    await injectCache(page, '用戶A', [{ qID: 'Q1_T01', gameMode: '連連看', stars: 3, status: 'PASS', timeSpent: 30, className: '資訊二', userName: '用戶A' }]);

    // 用戶 B 也有快取
    await page.evaluate(() => {
      localStorage.setItem('fb_cache_用戶B', JSON.stringify({ time: Date.now(), data: [{ qID: 'Q2_T01', gameMode: '連連看', stars: 2, status: 'PASS' }] }));
    });

    // 用戶 A 登出
    await page.evaluate(() => { if (typeof logoutUser === 'function') logoutUser(); });
    await page.waitForTimeout(300);

    const state = await page.evaluate(() => ({
      cacheA: localStorage.getItem('fb_cache_用戶A'),
      cacheB: localStorage.getItem('fb_cache_用戶B')
    }));
    expect(state.cacheA, '用戶A 快取應被清除').toBeNull();
    expect(state.cacheB, '用戶B 快取不應受影響').not.toBeNull();
  });
});

// ══════════════════════════════════════════
//  5. 多頁面星星一致性
// ══════════════════════════════════════════
test.describe('多頁面星星一致性', () => {

  test('首頁、地圖、遊戲頁的星星數應一致', async ({ page }) => {
    const userName = '一致性測試生';
    await mockLogin(page, '/', { className: '資訊二', no: 1, name: userName });
    await injectCache(page, userName, SAMPLE_RECORDS.map(r => ({...r, userName})));

    // 首頁星星
    await page.goto('/');
    await page.waitForTimeout(2000);
    const indexStars = await page.evaluate(() => {
      const text = document.getElementById('user-status')?.textContent || '';
      const m = text.match(/⭐\s*(\d+)/);
      return m ? parseInt(m[1]) : -1;
    });

    // 地圖 user-info 星星（總星星數）
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(2000);
    const mapUserInfoStars = await page.evaluate(() => {
      const text = document.getElementById('user-info')?.textContent || '';
      const m = text.match(/⭐\s*(\d+)/);
      return m ? parseInt(m[1]) : -1;
    });

    // 地圖 stats bar 星星（該模式星星數）
    const mapStatsStars = await getStatsBarStars(page);

    // 遊戲頁 top bar 星星（總星星數）
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await page.waitForTimeout(2000);
    const gameStars = await page.evaluate(() => {
      const badge = document.querySelector('#top-bar-star-badge');
      const m = badge?.textContent?.match(/⭐\s*(\d+)/);
      return m ? parseInt(m[1]) : -1;
    });

    console.log(`首頁=${indexStars}, 地圖user-info=${mapUserInfoStars}, 地圖stats=${mapStatsStars}, 遊戲頁=${gameStars}`);

    // 總星星數一致（首頁 = 地圖 user-info = 遊戲頁 top bar）
    expect(indexStars, '首頁應有星星').toBeGreaterThan(0);
    expect(indexStars, '首頁與地圖 user-info 應一致').toBe(mapUserInfoStars);
    expect(indexStars, '首頁與遊戲頁 top bar 應一致').toBe(gameStars);

    // 該模式星星數（透過 getScoresForUser 驗證，避免 DOM 渲染時機問題）
    const mapModeResult = await page.evaluate(async () => {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!user) return 0;
      const scores = typeof window.getScoresForUser === 'function'
        ? await window.getScoresForUser(user.name) : [];
      return scores.filter(s => s.gameMode === '連連看' && s.status === 'PASS')
        .reduce((sum, r) => sum + (r.stars || 0), 0);
    });
    expect(mapModeResult, '連連看模式應有 9 星').toBe(9);
  });
});
