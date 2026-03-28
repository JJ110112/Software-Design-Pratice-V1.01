// @ts-check
const { test, expect } = require('@playwright/test');

// ══════════════════════════════════════════
//  真實流程測試：實際呼叫 saveScore、斷線模擬、教師操作
//  測試真實程式碼路徑（Cloud Function 可能成功或失敗）
// ══════════════════════════════════════════

/** 登入 */
async function login(page, className, no, name) {
  await page.goto('/');
  await page.evaluate(({ className, no, name }) => {
    sessionStorage.setItem('sw_quiz_user', JSON.stringify({
      className, no, name,
      loginTime: new Date().toISOString(),
      lastActive: new Date().toISOString()
    }));
  }, { className, no, name });
}

/** 等 Firebase + saveScore 就緒 */
async function waitForReady(page) {
  await page.waitForFunction(() => typeof window.saveScore === 'function', { timeout: 10000 });
}

/** 收集錯誤 */
function collectErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(`[JS] ${err.message}`));
  return errors;
}

// ══════════════════════════════════════════
//  1. saveScore 真實呼叫（不 mock，測試真實路徑）
// ══════════════════════════════════════════
test.describe('saveScore 真實呼叫', () => {

  test.beforeEach(async ({ page }) => {
    // 清除所有測試快取
    await page.goto('/');
    await page.evaluate(() => {
      Object.keys(localStorage).filter(k => k.startsWith('fb_cache_') || k === 'local_scores').forEach(k => localStorage.removeItem(k));
    });
  });

  test('saveScore 呼叫後：快取有紀錄（無論 Cloud Function 成功或失敗）', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, '資訊二', 3, '徐子翔');
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await waitForReady(page);

    // 實際呼叫 saveScore
    const result = await page.evaluate(async () => {
      try {
        return await window.saveScore('資訊二', '徐子翔', 'TEST_E2E', '連連看', 45, 'PASS', 3);
      } catch(e) {
        return { error: e.message };
      }
    });

    // 不管 Cloud Function 成功或失敗，快取應有紀錄
    const cache = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_徐子翔');
      if (!raw) return null;
      const data = JSON.parse(raw).data || [];
      return data.filter(r => r.qID === 'TEST_E2E');
    });
    expect(cache, '快取應有紀錄').not.toBeNull();
    expect(cache.length, '快取應有至少 1 筆').toBeGreaterThanOrEqual(1);
    expect(cache[0].stars).toBe(3);

    // 如果 Cloud Function 失敗，local_scores 應有備份
    if (!result.success) {
      const backup = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('local_scores') || '[]')
          .filter(r => r.qID === 'TEST_E2E')
      );
      expect(backup.length, 'CF 失敗時 local_scores 應有備份').toBeGreaterThanOrEqual(1);
    }

    // 不應有 stack overflow
    expect(errors.filter(e => e.includes('Maximum call stack'))).toHaveLength(0);
  });

  test('saveScore 連續呼叫不同關卡，星星正確累加', async ({ page }) => {
    await login(page, '資訊二', 5, '楊斯晴');
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await waitForReady(page);

    // 清除舊快取
    await page.evaluate(() => localStorage.removeItem('fb_cache_楊斯晴'));

    await page.evaluate(async () => {
      await window.saveScore('資訊二', '楊斯晴', 'E2E_Q1', '連連看', 30, 'PASS', 3);
      await window.saveScore('資訊二', '楊斯晴', 'E2E_Q2', '中英選擇題', 45, 'PASS', 2);
    });

    const stars = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_楊斯晴');
      if (!raw) return 0;
      const data = JSON.parse(raw).data || [];
      const best = {};
      data.filter(r => r.status === 'PASS' && r.qID.startsWith('E2E_')).forEach(r => {
        const k = `${r.qID}_${r.gameMode}`;
        if (!best[k] || r.stars > best[k]) best[k] = r.stars;
      });
      return Object.values(best).reduce((a, b) => a + b, 0);
    });

    expect(stars, '兩關應為 3+2=5 星').toBe(5);
  });

  test('saveScore 同關卡重複過關，快取保留所有但取最高星', async ({ page }) => {
    await login(page, '資訊二', 6, '薛明全');
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await waitForReady(page);

    await page.evaluate(() => localStorage.removeItem('fb_cache_薛明全'));

    await page.evaluate(async () => {
      await window.saveScore('資訊二', '薛明全', 'E2E_SAME', '連連看', 60, 'PASS', 1);
      await window.saveScore('資訊二', '薛明全', 'E2E_SAME', '連連看', 20, 'PASS', 3);
    });

    const best = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_薛明全');
      const data = JSON.parse(raw).data;
      const bestMap = {};
      data.filter(r => r.status === 'PASS' && r.qID === 'E2E_SAME').forEach(r => {
        const k = `${r.qID}_${r.gameMode}`;
        if (!bestMap[k] || r.stars > bestMap[k]) bestMap[k] = r.stars;
      });
      return Object.values(bestMap).reduce((a, b) => a + b, 0);
    });

    expect(best, '同關卡取最高 3 星').toBe(3);
  });
});

// ══════════════════════════════════════════
//  2. 離線容錯（模擬 Cloud Function 不可用）
// ══════════════════════════════════════════
test.describe('離線容錯', () => {

  test('Cloud Function 不可用時：成績備份到 local_scores + 快取', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, '資訊二', 8, '白旻承');
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await waitForReady(page);

    // 覆寫 _saveScoreCallable 為必定失敗
    await page.evaluate(() => {
      window._originalCallable = window._saveScoreCallable;
      window._saveScoreCallable = async () => { throw new Error('模擬網路錯誤'); };
    });

    // 注意：saveScore 內部用的是 module scope 的 _saveScoreCallable，無法從 window 覆寫
    // 所以改用另一種方式：直接斷網
    await page.context().setOffline(true);

    const result = await page.evaluate(async () => {
      try {
        return await window.saveScore('資訊二', '白旻承', 'E2E_OFFLINE', '連連看', 35, 'PASS', 2);
      } catch(e) {
        return { error: e.message, backedUp: true };
      }
    });

    await page.context().setOffline(false);

    // 離線時應備份到 local_scores 或快取
    const backup = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('local_scores') || '[]')
        .filter(r => r.qID === 'E2E_OFFLINE')
    );
    const cache = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_白旻承');
      if (!raw) return [];
      return JSON.parse(raw).data?.filter(r => r.qID === 'E2E_OFFLINE') || [];
    });

    // 至少要在某處有備份
    const totalBackup = backup.length + cache.length;
    expect(totalBackup, '離線時應在 local_scores 或快取有備份').toBeGreaterThanOrEqual(1);

    expect(errors.filter(e => e.includes('Maximum call stack'))).toHaveLength(0);
  });
});

// ══════════════════════════════════════════
//  3. 教師操作功能驗證
// ══════════════════════════════════════════
test.describe('教師操作', () => {

  test('儀表板刷新不報 JS 錯誤', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/dashboard.html');
    await page.waitForTimeout(2500);

    await page.click('#btn-refresh');
    await page.waitForTimeout(3000);

    const state = await page.evaluate(() => ({
      rawOk: typeof rawData !== 'undefined' && Array.isArray(rawData),
      rankOk: typeof fullRankingData !== 'undefined' && Array.isArray(fullRankingData)
    }));
    expect(state.rawOk, 'rawData 應為陣列').toBe(true);
    expect(state.rankOk, 'fullRankingData 應為陣列').toBe(true);

    const jsErrors = errors.filter(e => e.startsWith('[JS]'));
    expect(jsErrors, '刷新不應有 JS 錯誤').toHaveLength(0);
  });

  test('班級篩選切換不報錯', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/dashboard.html');
    await page.waitForTimeout(2500);

    // 切換篩選
    await page.selectOption('#filter-class', '資訊二');
    await page.waitForTimeout(500);
    await page.selectOption('#filter-class', 'ALL');
    await page.waitForTimeout(500);

    const jsErrors = errors.filter(e => e.startsWith('[JS]'));
    expect(jsErrors, '篩選切換不應有 JS 錯誤').toHaveLength(0);
  });

  test('結算排行榜按鈕需要密碼', async ({ page }) => {
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/dashboard.html');
    await page.waitForTimeout(2500);

    // 取消密碼輸入
    let promptSeen = false;
    page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') {
        promptSeen = true;
        await dialog.dismiss(); // 取消
      } else {
        await dialog.accept();
      }
    });

    await page.click('#btn-rebuild-ranking');
    await page.waitForTimeout(1000);

    expect(promptSeen, '應彈出密碼輸入').toBe(true);
  });

  test('刪除學生按鈕需要密碼', async ({ page }) => {
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/dashboard.html');
    await page.waitForTimeout(2500);

    await page.fill('#del-student-name', '測試名字');

    let promptSeen = false;
    page.on('dialog', async dialog => {
      if (dialog.type() === 'prompt') {
        promptSeen = true;
        await dialog.dismiss();
      } else {
        await dialog.accept();
      }
    });

    await page.click('#btn-del-single');
    await page.waitForTimeout(1000);

    expect(promptSeen, '應彈出密碼輸入').toBe(true);
  });

  test('學生狀況表排序不報錯', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, '測試用', 0, '測試老師');
    await page.goto('/dashboard.html');
    await page.waitForTimeout(2500);

    // 依序點擊每個排序欄位
    const cols = ['no', 'name', 'stars', 'clears', 'attempts', 'lastActive', 'progress'];
    for (const col of cols) {
      const header = page.locator(`#student-status-table th[data-col="${col}"]`);
      if (await header.count() > 0) {
        await header.click();
        await page.waitForTimeout(200);
      }
    }

    const jsErrors = errors.filter(e => e.startsWith('[JS]'));
    expect(jsErrors, '排序操作不應有 JS 錯誤').toHaveLength(0);
  });
});

// ══════════════════════════════════════════
//  4. 排行榜
// ══════════════════════════════════════════
test.describe('排行榜', () => {

  test('getOverallRanking 可呼叫、回傳陣列', async ({ page }) => {
    await login(page, '資訊二', 1, '李亦澄');
    await page.goto('/leaderboard.html');
    await page.waitForTimeout(3000);

    const result = await page.evaluate(async () => {
      if (typeof window.getOverallRanking !== 'function') return { error: 'not found' };
      try {
        const data = await window.getOverallRanking('ALL');
        return { length: data.length, isArray: Array.isArray(data) };
      } catch(e) {
        return { error: e.message };
      }
    });

    expect(result.error).toBeUndefined();
    expect(result.isArray).toBe(true);
  });

  test('排行榜不顯示 className=測試用', async ({ page }) => {
    await login(page, '資訊二', 1, '李亦澄');
    await page.goto('/leaderboard.html');
    await page.waitForTimeout(3000);

    const hasTest = await page.evaluate(async () => {
      const data = await window.getOverallRanking('ALL');
      return data.some(r => r.className === '測試用');
    });
    expect(hasTest, '排行榜不應顯示測試帳號').toBe(false);
  });
});

// ══════════════════════════════════════════
//  5. 跨頁面完整旅程（含真實 saveScore）
// ══════════════════════════════════════════
test.describe('跨頁面真實旅程', () => {

  test('過關 → 回地圖 → 首頁 → 排行榜，全程無 JS 錯誤', async ({ page }) => {
    const errors = collectErrors(page);
    await login(page, '電子二', 1, '梁博凱');

    // Step 1: 進入練習頁
    await page.goto('/pages/中英選擇題.html?q=SETUP&t=T01');
    await waitForReady(page);

    // Step 2: 實際呼叫 saveScore
    await page.evaluate(async () => {
      await window.saveScore('電子二', '梁博凱', 'E2E_JOURNEY', '中英選擇題', 50, 'PASS', 3);
    });

    // Step 3: 回地圖
    await page.goto('/pages/map.html?tab=map&dev=1');
    await page.waitForTimeout(2000);

    const mapStars = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_梁博凱');
      if (!raw) return 0;
      return JSON.parse(raw).data?.filter(r => r.qID === 'E2E_JOURNEY')
        .reduce((sum, r) => sum + (r.stars || 0), 0) || 0;
    });
    expect(mapStars, '地圖快取應有 3 星').toBeGreaterThanOrEqual(3);

    // Step 4: 首頁
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Step 5: 排行榜
    await page.goto('/leaderboard.html');
    await page.waitForTimeout(2000);

    const jsErrors = errors.filter(e =>
      e.startsWith('[JS]') && !e.includes('Maximum call stack')
    );
    expect(jsErrors, '全程不應有 JS 錯誤').toHaveLength(0);

    // 特別檢查 stack overflow
    const stackErrors = errors.filter(e => e.includes('Maximum call stack'));
    expect(stackErrors, '不應有 stack overflow').toHaveLength(0);
  });
});
