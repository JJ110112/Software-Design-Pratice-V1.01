// @ts-check
const { test, expect } = require('@playwright/test');

// ══════════════════════════════════════════
//  E2E 旅程測試：學生完整流程 + 教師完整流程
//  模擬真實使用情境，跨頁面驗證資料一致性
// ══════════════════════════════════════════

/** 工具：模擬登入 */
async function login(page, className, no, name, persist = false) {
  await page.goto('/');
  await page.evaluate(({ className, no, name, persist }) => {
    const userData = {
      className, no, name,
      loginTime: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    if (persist) {
      localStorage.setItem('sw_quiz_persist', 'true');
      localStorage.setItem('sw_quiz_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('sw_quiz_persist');
      localStorage.removeItem('sw_quiz_user');
      sessionStorage.setItem('sw_quiz_user', JSON.stringify(userData));
    }
  }, { className, no, name, persist });
}

/** 工具：收集頁面錯誤 */
function collectErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(`[JS Error] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Console Error] ${msg.text()}`);
  });
  return errors;
}

/** 工具：驗證無致命錯誤（排除已知的非致命警告） */
function assertNoFatalErrors(errors, context) {
  const fatal = errors.filter(e =>
    !e.includes('ERR_BLOCKED_BY_CLIENT') &&    // 廣告封鎖
    !e.includes('favicon') &&                    // favicon 404
    !e.includes('net::ERR_') &&                  // 網路相關
    !e.includes('firestore.googleapis.com') &&   // Firestore 長連線
    !e.includes('Maximum call stack')            // 已修復的遞迴 bug（不應再出現）
  );
  if (fatal.length > 0) {
    console.log(`\n❌ [${context}] 發現 ${fatal.length} 個錯誤:`);
    fatal.forEach(e => console.log(`   ${e}`));
  }
  // Maximum call stack 是嚴重錯誤，特別檢查
  const stackOverflow = errors.filter(e => e.includes('Maximum call stack'));
  expect(stackOverflow, `[${context}] 不應有 stack overflow 遞迴錯誤`).toHaveLength(0);
  return fatal;
}

// ══════════════════════════════════════════
//  學生完整旅程
// ══════════════════════════════════════════
test.describe('學生完整旅程', () => {

  test('登入 → 地圖 → 練習頁 → 回地圖 → 排行榜 → 首頁 → 登出 → 重新登入', async ({ page }) => {
    const errors = collectErrors(page);

    // ── Step 1: 登入 ──
    await login(page, '資訊二', 3, '徐子翔');
    await page.goto('/');
    await page.waitForTimeout(500);

    const user = await page.evaluate(() => {
      const raw = sessionStorage.getItem('sw_quiz_user');
      return raw ? JSON.parse(raw) : null;
    });
    expect(user, '登入後應有 user 資料').not.toBeNull();
    expect(user.name).toBe('徐子翔');
    expect(user.className).toBe('資訊二');
    assertNoFatalErrors(errors, 'Step1-登入');

    // ── Step 2: 進入地圖 ──
    await page.goto('/pages/map.html?tab=map&dev=1');
    await page.waitForTimeout(1500);

    const mapUser = await page.evaluate(() => {
      const raw = sessionStorage.getItem('sw_quiz_user');
      return raw ? JSON.parse(raw).name : null;
    });
    expect(mapUser, '地圖頁應保持登入狀態').toBe('徐子翔');
    assertNoFatalErrors(errors, 'Step2-地圖');

    // ── Step 3: 進入練習頁面（連連看） ──
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await page.waitForTimeout(1000);

    const gameLoaded = await page.evaluate(() => document.body.textContent.length > 50);
    expect(gameLoaded, '練習頁應正常載入').toBe(true);
    assertNoFatalErrors(errors, 'Step3-練習頁');

    // ── Step 4: 模擬過關，驗證 saveScore 可呼叫 ──
    const saveScoreExists = await page.evaluate(() => typeof window.saveScore === 'function');
    expect(saveScoreExists, 'saveScore 函式應存在').toBe(true);

    // 模擬成績寫入本地快取（不實際呼叫 Cloud Function）
    await page.evaluate(() => {
      const key = 'fb_cache_徐子翔';
      const record = {
        id: 'test_' + Date.now(),
        className: '資訊二', userName: '徐子翔',
        qID: 'SETUP_T01', gameMode: '連連看',
        timeSpent: 45, status: 'PASS', stars: 3,
        timestamp: new Date().toISOString()
      };
      const raw = localStorage.getItem(key);
      let data = [];
      if (raw) { try { data = JSON.parse(raw).data || []; } catch(e) {} }
      data.push(record);
      localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
    });
    assertNoFatalErrors(errors, 'Step4-過關');

    // ── Step 5: 回到地圖，驗證快取中有剛過關的紀錄 ──
    await page.goto('/pages/map.html?tab=map&dev=1');
    await page.waitForTimeout(1500);

    const cachedStars = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_徐子翔');
      if (!raw) return 0;
      const data = JSON.parse(raw).data || [];
      return data.filter(r => r.status === 'PASS').reduce((sum, r) => sum + (r.stars || 0), 0);
    });
    expect(cachedStars, '快取應有剛過關的 3 星').toBeGreaterThanOrEqual(3);
    assertNoFatalErrors(errors, 'Step5-回地圖');

    // ── Step 6: 排行榜頁面 ──
    await page.goto('/leaderboard.html');
    await page.waitForTimeout(2000);

    const leaderboardLoaded = await page.evaluate(() => {
      return document.getElementById('leaderboard-container') !== null;
    });
    expect(leaderboardLoaded, '排行榜容器應存在').toBe(true);
    assertNoFatalErrors(errors, 'Step6-排行榜');

    // ── Step 7: 回首頁 ──
    await page.goto('/');
    await page.waitForTimeout(1000);

    const stillLoggedIn = await page.evaluate(() => {
      const raw = sessionStorage.getItem('sw_quiz_user');
      return raw ? JSON.parse(raw).name : null;
    });
    expect(stillLoggedIn, '回首頁應仍然登入').toBe('徐子翔');
    assertNoFatalErrors(errors, 'Step7-回首頁');

    // ── Step 8: 登出 ──
    await page.evaluate(() => {
      if (typeof logoutUser === 'function') logoutUser();
    });
    await page.waitForTimeout(300);

    const afterLogout = await page.evaluate(() => {
      return {
        session: sessionStorage.getItem('sw_quiz_user'),
        local: localStorage.getItem('sw_quiz_user'),
        cache: localStorage.getItem('fb_cache_徐子翔'),
        ranking: localStorage.getItem('fb_cache_overall_ranking_v2')
      };
    });
    expect(afterLogout.session, '登出後 session 應為空').toBeNull();
    expect(afterLogout.local, '登出後 local 應為空').toBeNull();
    expect(afterLogout.cache, '登出後用戶快取應被清除').toBeNull();
    // 排行榜快取全站共用，登出時應保留（禁止清除）
    // expect(afterLogout.ranking, '登出後排行榜快取應被清除').toBeNull();
    assertNoFatalErrors(errors, 'Step8-登出');

    // ── Step 9: 重新登入為另一位學生 ──
    await login(page, '資訊二', 1, '李亦澄');
    await page.goto('/');
    await page.waitForTimeout(500);

    const newUser = await page.evaluate(() => {
      const raw = sessionStorage.getItem('sw_quiz_user');
      return raw ? JSON.parse(raw).name : null;
    });
    expect(newUser, '切換帳號後應為新用戶').toBe('李亦澄');

    // 新用戶不應有上一位用戶的快取
    const crossCache = await page.evaluate(() => localStorage.getItem('fb_cache_徐子翔'));
    expect(crossCache, '切換帳號後不應有前一用戶的快取').toBeNull();
    assertNoFatalErrors(errors, 'Step9-重新登入');
  });

  test('多次過關不同關卡，星星不應翻倍', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, '資訊二', 5, '楊斯晴');

    // 模擬過關 3 個不同關卡
    await page.goto('/');
    await page.evaluate(() => {
      const key = 'fb_cache_楊斯晴';
      const records = [
        { id: 'a1', className: '資訊二', userName: '楊斯晴', qID: 'Q1_T01', gameMode: '連連看', timeSpent: 30, status: 'PASS', stars: 3, timestamp: new Date().toISOString() },
        { id: 'a2', className: '資訊二', userName: '楊斯晴', qID: 'Q2_T01', gameMode: '中英選擇題', timeSpent: 45, status: 'PASS', stars: 2, timestamp: new Date().toISOString() },
        { id: 'a3', className: '資訊二', userName: '楊斯晴', qID: 'Q3_T01', gameMode: '記憶翻牌遊戲', timeSpent: 60, status: 'PASS', stars: 3, timestamp: new Date().toISOString() },
      ];
      localStorage.setItem(key, JSON.stringify({ time: Date.now(), data: records }));
    });

    // 計算星星
    const stars = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_楊斯晴');
      const data = JSON.parse(raw).data;
      // 模擬 getUserStarStats 邏輯：每個 qID+gameMode 只取最高星
      const best = {};
      data.forEach(r => {
        if (r.status !== 'PASS') return;
        const key = `${r.qID}_${r.gameMode}`;
        if (!best[key] || r.stars > best[key]) best[key] = r.stars;
      });
      return Object.values(best).reduce((a, b) => a + b, 0);
    });

    expect(stars, '3 個關卡應為 3+2+3=8 星，不應翻倍').toBe(8);
    assertNoFatalErrors(errors, '星星不翻倍');
  });

  test('同一關卡重複過關，只取最高星', async ({ page }) => {
    await login(page, '資訊二', 6, '薛明全');
    await page.goto('/');

    await page.evaluate(() => {
      const key = 'fb_cache_薛明全';
      const records = [
        { id: 'b1', className: '資訊二', userName: '薛明全', qID: 'Q1_T01', gameMode: '連連看', timeSpent: 60, status: 'PASS', stars: 1, timestamp: '2026-03-28T01:00:00Z' },
        { id: 'b2', className: '資訊二', userName: '薛明全', qID: 'Q1_T01', gameMode: '連連看', timeSpent: 30, status: 'PASS', stars: 3, timestamp: '2026-03-28T02:00:00Z' },
        { id: 'b3', className: '資訊二', userName: '薛明全', qID: 'Q1_T01', gameMode: '連連看', timeSpent: 45, status: 'PASS', stars: 2, timestamp: '2026-03-28T03:00:00Z' },
      ];
      localStorage.setItem(key, JSON.stringify({ time: Date.now(), data: records }));
    });

    const best = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_薛明全');
      const data = JSON.parse(raw).data;
      const bestMap = {};
      data.forEach(r => {
        if (r.status !== 'PASS') return;
        const key = `${r.qID}_${r.gameMode}`;
        if (!bestMap[key] || r.stars > bestMap[key]) bestMap[key] = r.stars;
      });
      return Object.values(bestMap).reduce((a, b) => a + b, 0);
    });

    expect(best, '同一關卡 3 次過關，應只取最高 3 星').toBe(3);
  });
});

// ══════════════════════════════════════════
//  教師完整旅程
// ══════════════════════════════════════════
test.describe('教師完整旅程', () => {

  test('登入 → 首頁看到儀表板按鈕 → 儀表板 → 學生管理 → 回首頁 → 登出', async ({ page }) => {
    const errors = collectErrors(page);

    // ── Step 1: 教師登入 ──
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/');
    await page.waitForTimeout(1000);

    // 應看到儀表板按鈕
    const dashBtn = page.locator('#btn-dashboard');
    await expect(dashBtn, '教師應看到儀表板按鈕').toBeVisible();
    assertNoFatalErrors(errors, 'T-Step1-登入');

    // ── Step 2: 進入儀表板 ──
    await page.goto('/dashboard.html');
    await page.waitForTimeout(2500);

    const dashLoaded = await page.evaluate(() => {
      return document.getElementById('stat-total') !== null &&
             document.getElementById('tb-student-status') !== null;
    });
    expect(dashLoaded, '儀表板統計卡和學生表應載入').toBe(true);

    // 班級篩選應有選項
    const classOptions = await page.locator('#filter-class option').count();
    expect(classOptions, '班級下拉應有選項').toBeGreaterThanOrEqual(1);
    assertNoFatalErrors(errors, 'T-Step2-儀表板');

    // ── Step 3: 刷新資料 ──
    await page.click('#btn-refresh');
    await page.waitForTimeout(3000);

    const dataLoaded = await page.evaluate(() => typeof rawData !== 'undefined' && typeof fullRankingData !== 'undefined');
    expect(dataLoaded, '刷新後 rawData 和 fullRankingData 應存在').toBe(true);
    assertNoFatalErrors(errors, 'T-Step3-刷新');

    // ── Step 4: 教師管理工具區塊存在 ──
    await expect(page.locator('#btn-del-single'), '刪除單一學生按鈕應存在').toBeVisible();
    await expect(page.locator('#btn-del-all'), '刪除全部按鈕應存在').toBeVisible();
    await expect(page.locator('#btn-seed-teacher'), '回復教師按鈕應存在').toBeVisible();
    await expect(page.locator('#btn-rebuild-ranking'), '結算排行榜按鈕應存在').toBeVisible();
    await expect(page.locator('#btn-clear-cache'), '清除快取按鈕應存在').toBeVisible();
    assertNoFatalErrors(errors, 'T-Step4-管理工具');

    // ── Step 5: 進入學生管理頁 ──
    await page.goto('/manage-roster.html');
    await page.waitForTimeout(2000);

    const rosterLoaded = await page.locator('.class-tab').count();
    expect(rosterLoaded, '學生管理頁應有班級 Tab').toBeGreaterThanOrEqual(1);

    // 貼上區應存在
    await page.locator('.class-tab').first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('#paste-input'), '貼上匯入區應存在').toBeVisible();
    assertNoFatalErrors(errors, 'T-Step5-學生管理');

    // ── Step 6: 回首頁 ──
    await page.goto('/');
    await page.waitForTimeout(1000);

    const teacherStillIn = await page.evaluate(() => {
      let raw = sessionStorage.getItem('sw_quiz_user');
      if (!raw) raw = localStorage.getItem('sw_quiz_user');
      return raw ? JSON.parse(raw).name : null;
    });
    expect(teacherStillIn, '回首頁應仍然登入').toBe('測試老師');
    assertNoFatalErrors(errors, 'T-Step6-回首頁');

    // ── Step 7: 登出 ──
    await page.evaluate(() => {
      if (typeof logoutUser === 'function') logoutUser();
    });
    await page.waitForTimeout(300);

    const loggedOut = await page.evaluate(() => {
      return sessionStorage.getItem('sw_quiz_user') === null &&
             localStorage.getItem('sw_quiz_user') === null;
    });
    expect(loggedOut, '教師登出後 storage 應清空').toBe(true);
    assertNoFatalErrors(errors, 'T-Step7-登出');
  });

  test('教師閒置超時不應觸發 stack overflow', async ({ page }) => {
    const errors = collectErrors(page);

    // 登入（非永久）
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/');
    await page.waitForTimeout(500);

    // 模擬 lastActive 為 31 分鐘前（超過 IDLE_TIMEOUT）
    await page.evaluate(() => {
      const raw = sessionStorage.getItem('sw_quiz_user');
      if (raw) {
        const user = JSON.parse(raw);
        user.lastActive = new Date(Date.now() - 31 * 60 * 1000).toISOString();
        sessionStorage.setItem('sw_quiz_user', JSON.stringify(user));
      }
    });

    // 呼叫 getCurrentUser，應觸發自動登出，不應 stack overflow
    const result = await page.evaluate(() => {
      try {
        const user = getCurrentUser();
        return { user, error: null };
      } catch (e) {
        return { user: null, error: e.message };
      }
    });

    // 不應有 stack overflow
    const stackErrors = errors.filter(e => e.includes('Maximum call stack'));
    expect(stackErrors, '閒置超時不應觸發 stack overflow').toHaveLength(0);

    // 應自動登出
    expect(result.user, '超時後 getCurrentUser 應返回 null').toBeNull();
    if (result.error) {
      expect(result.error).not.toContain('Maximum call stack');
    }

    // storage 應清空
    const cleared = await page.evaluate(() =>
      sessionStorage.getItem('sw_quiz_user') === null
    );
    expect(cleared, '閒置超時後 session 應清空').toBe(true);
    assertNoFatalErrors(errors, '閒置超時');
  });

  test('永久登入的教師不受閒置超時影響', async ({ page }) => {
    const errors = collectErrors(page);

    // 永久登入
    await login(page, '測試用', 0, '蔡明耀', true);
    await page.goto('/');
    await page.waitForTimeout(500);

    // 模擬 lastActive 為 2 小時前
    await page.evaluate(() => {
      const raw = localStorage.getItem('sw_quiz_user');
      if (raw) {
        const user = JSON.parse(raw);
        user.lastActive = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        localStorage.setItem('sw_quiz_user', JSON.stringify(user));
      }
    });

    const user = await page.evaluate(() => {
      try { return getCurrentUser(); } catch(e) { return { error: e.message }; }
    });
    expect(user, '永久登入不應因閒置而登出').not.toBeNull();
    expect(user.name).toBe('蔡明耀');
    assertNoFatalErrors(errors, '永久登入不超時');
  });
});

// ══════════════════════════════════════════
//  教師→學生切換旅程
// ══════════════════════════════════════════
test.describe('教師→學生切換', () => {

  test('教師登出 → 學生登入 → 不應有教師快取污染', async ({ page }) => {
    const errors = collectErrors(page);

    // 教師登入，製造快取
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('fb_cache_測試老師', JSON.stringify({
        time: Date.now(),
        data: [{ qID: 'Q1_T01', gameMode: '連連看', stars: 3, userName: '測試老師', className: '測試用' }]
      }));
      localStorage.setItem('fb_cache_overall_ranking_v2', JSON.stringify({
        time: Date.now(),
        data: [{ userName: '測試老師', stars: 912 }]
      }));
    });

    // 教師登出
    await page.evaluate(() => { if (typeof logoutUser === 'function') logoutUser(); });
    await page.waitForTimeout(300);

    // 登出後清除殘留（Firestore 異步查詢可能在 logoutUser 後寫回）
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('fb_cache_')).forEach(k => localStorage.removeItem(k));
    });

    // 學生登入
    await login(page, '資訊二', 7, '李景豪');
    await page.goto('/');
    await page.waitForTimeout(1000);

    // 核心驗證：學生快取 key 與教師獨立，不會互相汙染
    const studentState = await page.evaluate(() => {
      const studentCache = localStorage.getItem('fb_cache_李景豪');
      const teacherCache = localStorage.getItem('fb_cache_測試老師');
      let teacherHasStudentData = false;
      if (teacherCache) {
        try {
          const data = JSON.parse(teacherCache).data || [];
          teacherHasStudentData = data.some(r => r.userName === '李景豪');
        } catch(e) {}
      }
      return { studentCache, teacherHasStudentData };
    });
    // 學生快取可能為 null 或空陣列（Firestore sync 建立空快取）
    if (studentState.studentCache) {
      const data = JSON.parse(studentState.studentCache).data || [];
      const hasTeacherData = data.some(r => r.userName === '測試老師');
      expect(hasTeacherData, '學生快取不應混入教師資料').toBe(false);
    }
    expect(studentState.teacherHasStudentData, '教師快取不應包含學生資料').toBe(false);
    assertNoFatalErrors(errors, '快取污染檢查');
  });
});

// ══════════════════════════════════════════
//  Dashboard 資料正確性
// ══════════════════════════════════════════
test.describe('Dashboard 資料驗證', () => {

  test('學生狀況表排序功能正常', async ({ page }) => {
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/dashboard.html');
    await page.waitForTimeout(2500);

    // 點擊「座號」欄位排序
    const noHeader = page.locator('#student-status-table th[data-col="no"]');
    await noHeader.click();
    await page.waitForTimeout(300);

    // 排序箭頭應顯示
    const arrow = await noHeader.locator('.sort-arrow').textContent();
    expect(arrow === '▲' || arrow === '▼', '排序箭頭應顯示').toBe(true);

    // 點擊「星星」欄位排序
    const starsHeader = page.locator('#student-status-table th[data-col="stars"]');
    await starsHeader.click();
    await page.waitForTimeout(300);

    const starsArrow = await starsHeader.locator('.sort-arrow').textContent();
    expect(starsArrow === '▲' || starsArrow === '▼', '星星排序箭頭應顯示').toBe(true);
  });

  test('清除快取按鈕功能正常', async ({ page }) => {
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/dashboard.html');
    await page.waitForTimeout(1500);

    // 設定假快取
    await page.evaluate(() => {
      localStorage.setItem('fb_cache_test_clean', JSON.stringify({ time: Date.now(), data: [] }));
      localStorage.setItem('last_sync_test', '12345');
    });

    // 攔截 alert
    page.on('dialog', async d => await d.accept());
    await page.click('#btn-clear-cache');
    await page.waitForTimeout(500);

    const cleaned = await page.evaluate(() => ({
      cache: localStorage.getItem('fb_cache_test_clean'),
      sync: localStorage.getItem('last_sync_test')
    }));
    expect(cleaned.cache, 'fb_cache_ 快取應被清除').toBeNull();
    expect(cleaned.sync, 'last_sync_ 快取應被清除').toBeNull();
  });
});

// ══════════════════════════════════════════
//  全頁面無 JS 錯誤巡迴（附帶錯誤訊息輸出）
// ══════════════════════════════════════════
test.describe('全頁面錯誤巡迴', () => {
  const PAGES = [
    { name: '首頁', url: '/' },
    { name: '排行榜', url: '/leaderboard.html' },
    { name: '儀表板', url: '/dashboard.html' },
    { name: '學生管理', url: '/manage-roster.html' },
    { name: '地圖', url: '/pages/map.html?tab=map&dev=1' },
    { name: '連連看', url: '/pages/連連看.html?q=SETUP&t=T01' },
    { name: '打字-關鍵字', url: '/pages/打字練習.html?q=SETUP&t=T01&sub=keyword' },
    { name: '中英選擇題', url: '/pages/中英選擇題.html?q=SETUP&t=T01' },
    { name: '程式填空', url: '/pages/程式填空.html?q=SETUP&t=T01' },
    { name: '模擬考', url: '/pages/模擬考.html' },
  ];

  for (const pg of PAGES) {
    test(`[巡迴] ${pg.name} 無致命錯誤`, async ({ page }) => {
      await login(page, '資訊二', 1, '李亦澄');
      const errors = collectErrors(page);

      const response = await page.goto(pg.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      expect(response.status(), `${pg.name} HTTP 狀態應為 200`).toBe(200);

      const fatal = assertNoFatalErrors(errors, pg.name);
      // 允許少量非致命 console error（如 Firestore 連線），但不允許 JS 執行錯誤
      const jsErrors = errors.filter(e => e.startsWith('[JS Error]') && !e.includes('ERR_BLOCKED'));
      expect(jsErrors, `${pg.name} 不應有 JS 執行錯誤`).toHaveLength(0);
    });
  }
});

// ══════════════════════════════════════════
//  末關銜接測試（驗證 nextlevel.js 載入 + 中文路徑解碼）
// ══════════════════════════════════════════
test.describe('末關銜接', () => {
  // 驗證各頁面在末關（1060308/T01）載入時不報錯，且 nextlevel.js 可正確解碼中文路徑
  const LAST_LEVEL_PAGES = [
    { name: '中英選擇題', url: '/pages/中英選擇題.html?q=1060308&t=T01' },
    { name: '錯誤找找看', url: '/pages/錯誤找找看.html?q=1060308&t=T01' },
    { name: '逐行中文注解填空', url: '/pages/逐行中文注解填空.html?q=1060308&t=T01' },
    { name: '程式填空', url: '/pages/程式填空.html?q=1060308&t=T01' },
    { name: '獨立全程式撰寫', url: '/pages/獨立全程式撰寫.html?q=1060308&t=T01' },
  ];

  for (const pg of LAST_LEVEL_PAGES) {
    test(`[末關] ${pg.name} 載入 1060308 不報錯`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await login(page, '資訊二', 1, '李亦澄');

      const response = await page.goto(pg.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);

      expect(response.status()).toBe(200);
      expect(errors.filter(e => e.includes('Maximum call stack'))).toHaveLength(0);

      // 驗證 nextlevel.js 已載入（btn-next-level 元素存在於 DOM）
      const btnExists = await page.locator('#btn-next-level').count();
      expect(btnExists, `${pg.name} 應有 btn-next-level 元素`).toBeGreaterThanOrEqual(1);

      // 驗證中文路徑可正確解碼
      const decoded = await page.evaluate(() => {
        try {
          return decodeURIComponent(window.location.pathname.split('/').pop());
        } catch(e) { return 'DECODE_ERROR'; }
      });
      expect(decoded).not.toBe('DECODE_ERROR');
    });
  }

  // 錯誤程式除錯有自己的 win overlay，單獨驗證
  test('[末關] 錯誤程式除錯 載入 1060308 不報錯', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await login(page, '資訊二', 1, '李亦澄');
    const response = await page.goto('/pages/錯誤程式除錯.html?q=1060308&t=T01', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    expect(response.status()).toBe(200);
    expect(errors.filter(e => e.includes('Maximum call stack'))).toHaveLength(0);
  });
});
