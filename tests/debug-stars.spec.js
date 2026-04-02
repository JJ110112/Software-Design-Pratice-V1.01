// @ts-check
const { test, expect } = require('@playwright/test');
const { mockLogin } = require('./helpers');

/**
 * 星星更新迴歸測試
 * 所有測試預設使用 sessionStorage-only 登入（模擬真實學生非永久登入）
 */

function collectLogs(page) {
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.message}`));
  return logs;
}

test.describe('星星更新迴歸測試（sessionStorage-only 登入）', () => {

  test('完整流程：玩連連看第一關 → 回地圖 → 星星應顯示3顆', async ({ page }) => {
    const logs = collectLogs(page);

    // 非永久登入（預設）
    await mockLogin(page, '/', { className: '測試班', no: 1, name: '測試學生' });

    // 進入連連看第一關 (SETUP_T01)
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => !!document.getElementById('arena')), '遊戲區域應載入').toBe(true);

    // 點擊「開始遊戲」
    await page.locator('#btn-start').click();
    await page.waitForTimeout(500);

    // 自動配對所有項目
    const pairCount = await page.evaluate(() =>
      document.querySelectorAll('#col-left .item:not(.preview-mode)').length
    );
    for (let i = 0; i < pairCount; i++) {
      const leftIdx = await page.evaluate(() => {
        const el = document.querySelector('#col-left .item:not(.matched):not(.preview-mode)');
        return el ? el.dataset.idx : null;
      });
      if (leftIdx === null) break;
      await page.click(`#col-left .item[data-idx="${leftIdx}"]:not(.matched)`);
      await page.waitForTimeout(100);
      await page.click(`#col-right .item[data-idx="${leftIdx}"]:not(.matched)`);
      await page.waitForTimeout(300);
    }

    // 等待 win overlay
    await page.waitForTimeout(1500);
    expect(
      await page.evaluate(() => document.getElementById('overlay')?.classList.contains('show')),
      'Win overlay 應出現'
    ).toBe(true);

    await page.waitForTimeout(1000);

    // 驗證快取有紀錄
    const cacheRecords = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_測試學生');
      if (!raw) return [];
      try { return JSON.parse(raw).data || []; } catch(e) { return []; }
    });
    expect(
      cacheRecords.some(r => r.qID === 'SETUP_T01' && r.stars === 3 && r.gameMode === '連連看'),
      '快取中應有 SETUP_T01 stars=3'
    ).toBe(true);

    // 導航到地圖頁
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(2000);

    // 驗證 getScoresForUser 回傳正確資料
    const mapResult = await page.evaluate(async () => {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!user) return { error: 'no user' };
      const scores = typeof window.getScoresForUser === 'function'
        ? await window.getScoresForUser(user.name) : [];
      const mode = new URLSearchParams(window.location.search).get('mode') || '';
      const filtered = scores.filter(s => s.gameMode === mode && s.status === 'PASS');
      const statsBar = document.getElementById('user-stats-bar')?.textContent || '';
      return { filteredCount: filtered.length, statsBarText: statsBar };
    });

    expect(mapResult.filteredCount, '過濾後應有至少 1 筆紀錄').toBeGreaterThanOrEqual(1);
    const starsMatch = mapResult.statsBarText.match(/(\d+)\s*\/\s*\d+/);
    expect(starsMatch ? parseInt(starsMatch[1]) : 0, '地圖應顯示 3 星').toBe(3);
  });

  test('快取寫入後地圖節點星星應正確顯示', async ({ page }) => {
    await mockLogin(page, '/', { className: '測試班', no: 1, name: '測試學生B' });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('fb_cache_測試學生B', JSON.stringify({
        time: Date.now(),
        data: [{
          className: '測試班', userName: '測試學生B',
          qID: 'SETUP_T01', gameMode: '連連看',
          timeSpent: 30, status: 'PASS', stars: 3,
          timestamp: new Date().toISOString()
        }]
      }));
    });

    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      const statsBar = document.getElementById('user-stats-bar')?.textContent || '';
      const allNodes = document.querySelectorAll('#level-container .level-node');
      const firstNode = allNodes[0];
      const starsEl = firstNode?.querySelector('.stars');
      return {
        statsBarText: statsBar,
        totalNodes: allNodes.length,
        firstNodeHasStars: !!starsEl,
        firstNodeStarsText: starsEl?.textContent?.trim() || ''
      };
    });

    expect(result.totalNodes, '地圖應有關卡節點').toBeGreaterThan(0);
    expect(result.firstNodeHasStars, '第一關應有 .stars 元素').toBe(true);
    expect(result.firstNodeStarsText, '第一關應顯示 3 顆星').toBe('⭐⭐⭐');
    const m = result.statsBarText.match(/(\d+)\s*\/\s*\d+/);
    expect(m ? parseInt(m[1]) : 0, 'stats bar 應顯示 3 星').toBe(3);
  });

  test('背景同步不應覆蓋樂觀更新', async ({ page }) => {
    await mockLogin(page, '/', { className: '測試班', no: 1, name: '測試學生C' });

    // 先到地圖（建立空快取）
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(2000);

    // 模擬 saveScore cacheAppend
    await page.evaluate(() => {
      const cacheKey = 'fb_cache_測試學生C';
      const raw = localStorage.getItem(cacheKey);
      let data = [];
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          if (Date.now() - obj.time < 7200000) data = obj.data || [];
        } catch(e) {}
      }
      data.push({
        className: '測試班', userName: '測試學生C',
        qID: 'SETUP_T01', gameMode: '連連看',
        timeSpent: 25, status: 'PASS', stars: 3,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data }));
    });

    // 回地圖
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);

    const result = await page.evaluate(() => {
      const statsBar = document.getElementById('user-stats-bar')?.textContent || '';
      const cacheRaw = localStorage.getItem('fb_cache_測試學生C');
      let cacheData = [];
      if (cacheRaw) { try { cacheData = JSON.parse(cacheRaw).data || []; } catch(e) {} }
      const firstNode = document.querySelector('#level-container .level-node');
      return {
        statsBarText: statsBar,
        has3Stars: cacheData.some(r => r.qID === 'SETUP_T01' && r.stars === 3),
        firstNodeHasStars: !!firstNode?.querySelector('.stars')
      };
    });

    expect(result.has3Stars, '快取中 SETUP_T01 應保留 3 星').toBe(true);
    const m = result.statsBarText.match(/(\d+)\s*\/\s*\d+/);
    expect(m ? parseInt(m[1]) : 0, '地圖應顯示 3 星').toBe(3);
    expect(result.firstNodeHasStars, '第一關應有星星').toBe(true);
  });

  test('過關後 top bar 星星應即時更新', async ({ page }) => {
    await mockLogin(page, '/', { className: '測試班', no: 1, name: '測試學生D' });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('fb_cache_測試學生D', JSON.stringify({
        time: Date.now(),
        data: [{ qID: 'SETUP_T01', gameMode: '連連看', stars: 2, status: 'PASS', timeSpent: 50, className: '測試班', userName: '測試學生D' }]
      }));
    });

    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await page.waitForTimeout(2000);

    // 讀取 top bar 初始星星
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

    // 讀取 top bar 過關後星星
    const starsAfter = await page.evaluate(() => {
      const badge = document.querySelector('#top-bar-star-badge');
      const m = badge?.textContent?.match(/⭐\s*(\d+)/);
      return m ? parseInt(m[1]) : -1;
    });

    expect(starsAfter, 'top bar 星星應在過關後增加').toBeGreaterThan(starsBefore);
  });
});

test.describe('永久登入也應正常', () => {
  test('persist=true 登入：地圖星星正確顯示', async ({ page }) => {
    await mockLogin(page, '/', { className: '測試班', no: 1, name: '測試學生P', persist: true });

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('fb_cache_測試學生P', JSON.stringify({
        time: Date.now(),
        data: [{
          className: '測試班', userName: '測試學生P',
          qID: 'SETUP_T01', gameMode: '連連看',
          timeSpent: 20, status: 'PASS', stars: 3,
          timestamp: new Date().toISOString()
        }]
      }));
    });

    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);

    const statsBar = await page.evaluate(() =>
      document.getElementById('user-stats-bar')?.textContent || ''
    );
    const m = statsBar.match(/(\d+)\s*\/\s*\d+/);
    expect(m ? parseInt(m[1]) : 0, '永久登入地圖應顯示 3 星').toBe(3);
  });
});
