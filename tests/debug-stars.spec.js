// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Debug test: 連連看第一關得3星後，地圖星星是否正確顯示
 */

async function login(page, className, no, name) {
  await page.goto('/');
  await page.evaluate(({ className, no, name }) => {
    const userData = {
      className, no, name,
      loginTime: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    localStorage.setItem('sw_quiz_user', JSON.stringify(userData));
    sessionStorage.setItem('sw_quiz_user', JSON.stringify(userData));
  }, { className, no, name });
}

function collectLogs(page) {
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    logs.push(`[PAGE_ERROR] ${err.message}`);
  });
  return logs;
}

test.describe('Debug: 連連看星星更新', () => {

  test('完整流程：玩連連看第一關 → 回地圖 → 星星應顯示3顆', async ({ page }) => {
    const logs = collectLogs(page);

    // Step 1: 登入
    await login(page, '測試班', 1, '測試學生');

    // Step 2: 進入連連看第一關 (SETUP_T01)
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await page.waitForTimeout(1500);

    // 確認頁面載入
    const gameLoaded = await page.evaluate(() => !!document.getElementById('arena'));
    expect(gameLoaded, '遊戲區域應載入').toBe(true);

    // Step 3: 點擊「開始遊戲」
    const startBtn = page.locator('#btn-start');
    await expect(startBtn).toBeVisible();
    await startBtn.click();
    await page.waitForTimeout(500);

    // Step 4: 自動配對所有項目（用 data-idx 直接配對）
    const pairCount = await page.evaluate(() => {
      return document.querySelectorAll('#col-left .item:not(.preview-mode)').length;
    });
    console.log(`共 ${pairCount} 對需要配對`);

    for (let i = 0; i < pairCount; i++) {
      // 找到尚未配對的第一個左邊項目
      const leftIdx = await page.evaluate(() => {
        const el = document.querySelector('#col-left .item:not(.matched):not(.preview-mode)');
        return el ? el.dataset.idx : null;
      });

      if (leftIdx === null) break;

      // 點擊左邊
      await page.click(`#col-left .item[data-idx="${leftIdx}"]:not(.matched)`);
      await page.waitForTimeout(100);

      // 點擊右邊同 idx
      await page.click(`#col-right .item[data-idx="${leftIdx}"]:not(.matched)`);
      await page.waitForTimeout(300);
    }

    // Step 5: 等待 win overlay 出現
    await page.waitForTimeout(1500);
    const overlayVisible = await page.evaluate(() => {
      return document.getElementById('overlay')?.classList.contains('show');
    });
    expect(overlayVisible, 'Win overlay 應出現').toBe(true);

    // Step 6: 檢查 overlay 上顯示的星星
    const overlayStars = await page.evaluate(() => {
      const container = document.querySelector('.star-display-container');
      if (!container) return { found: false };
      const spans = container.querySelectorAll('span');
      let lit = 0;
      spans.forEach(s => {
        if (!s.style.filter.includes('grayscale')) lit++;
      });
      return { found: true, litStars: lit, totalSpans: spans.length };
    });
    console.log('Overlay 星星:', JSON.stringify(overlayStars));

    // Step 7: 檢查 saveScore 是否被呼叫、localStorage 狀態
    await page.waitForTimeout(1000); // 等 saveScore async 完成

    const storageState = await page.evaluate(() => {
      const cacheKey = 'fb_cache_測試學生';
      const raw = localStorage.getItem(cacheKey);
      const localScores = localStorage.getItem('local_scores');

      let cacheData = null;
      if (raw) {
        try { cacheData = JSON.parse(raw); } catch(e) {}
      }

      let localData = null;
      if (localScores) {
        try { localData = JSON.parse(localScores); } catch(e) {}
      }

      return {
        cacheKey,
        cacheRaw: raw ? raw.substring(0, 500) : null,
        cacheDataLength: cacheData?.data?.length ?? 'no data',
        cacheRecords: cacheData?.data?.map(r => ({
          qID: r.qID,
          gameMode: r.gameMode,
          stars: r.stars,
          status: r.status
        })) ?? [],
        localScoresLength: localData?.length ?? 'no data',
        localScoresRecords: (localData || []).map(r => ({
          qID: r.qID,
          gameMode: r.gameMode,
          stars: r.stars,
          status: r.status
        }))
      };
    });
    console.log('=== localStorage 狀態 ===');
    console.log('Cache records:', JSON.stringify(storageState.cacheRecords, null, 2));
    console.log('Local scores:', JSON.stringify(storageState.localScoresRecords, null, 2));

    // 核心斷言：快取中應有 SETUP_T01 的 3 星紀錄
    const hasRecord = storageState.cacheRecords.some(
      r => r.qID === 'SETUP_T01' && r.stars === 3 && r.gameMode === '連連看'
    );
    expect(hasRecord, '快取中應有 SETUP_T01 gameMode=連連看 stars=3 的紀錄').toBe(true);

    // Step 8: 導航到地圖頁
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(2000);

    // Step 9: 檢查 getScoresForUser 返回什麼
    const mapDebug = await page.evaluate(async () => {
      const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      if (!user) return { error: 'no user' };

      // 手動呼叫 getScoresForUser
      let allScores = [];
      if (typeof window.getScoresForUser === 'function') {
        allScores = await window.getScoresForUser(user.name);
      }

      const GAME_MODE = new URLSearchParams(window.location.search).get('mode') || '';
      const filtered = allScores.filter(s => s.gameMode === GAME_MODE && s.status === 'PASS');

      return {
        userName: user.name,
        gameMode: GAME_MODE,
        allScoresCount: allScores.length,
        allScores: allScores.map(r => ({
          qID: r.qID,
          gameMode: r.gameMode,
          stars: r.stars,
          status: r.status
        })),
        filteredCount: filtered.length,
        filteredRecords: filtered.map(r => ({
          qID: r.qID,
          gameMode: r.gameMode,
          stars: r.stars
        }))
      };
    });
    console.log('=== 地圖頁 Debug ===');
    console.log('User:', mapDebug.userName);
    console.log('GAME_MODE:', mapDebug.gameMode);
    console.log('All scores:', JSON.stringify(mapDebug.allScores, null, 2));
    console.log('Filtered (mode match):', JSON.stringify(mapDebug.filteredRecords, null, 2));

    // Step 10: 檢查 DOM 上的星星顯示
    const mapStars = await page.evaluate(() => {
      const userStatsBar = document.getElementById('user-stats-bar');
      const statsText = userStatsBar?.textContent || '';

      // 找到 level-container 中的各個關卡節點
      const levelNodes = document.querySelectorAll('#level-container .map-node');
      const nodesInfo = [];
      levelNodes.forEach((node, i) => {
        const starsEl = node.querySelector('.stars');
        nodesInfo.push({
          index: i,
          class: node.className,
          starsHtml: starsEl?.innerHTML || 'none',
          starsText: starsEl?.textContent || 'none'
        });
      });

      return {
        statsBarText: statsText,
        totalNodes: levelNodes.length,
        firstFewNodes: nodesInfo.slice(0, 5)
      };
    });
    console.log('=== 地圖 DOM 狀態 ===');
    console.log('Stats bar:', mapStars.statsBarText);
    console.log('Level nodes:', JSON.stringify(mapStars.firstFewNodes, null, 2));

    // 核心斷言：地圖上應顯示星星
    expect(mapDebug.filteredCount, '過濾後應有至少 1 筆紀錄').toBeGreaterThanOrEqual(1);

    // 檢查 stats bar 的星星數不為 0
    const starsMatch = mapStars.statsBarText.match(/(\d+)\s*\/\s*\d+/);
    const displayedStars = starsMatch ? parseInt(starsMatch[1]) : 0;
    console.log('顯示的星星數:', displayedStars);
    expect(displayedStars, '地圖上應顯示 3 顆星').toBe(3);

    // 輸出所有 console logs 供除錯
    console.log('\n=== 瀏覽器 Console Logs ===');
    logs.filter(l => l.includes('saveScore') || l.includes('stars') || l.includes('快取') || l.includes('Cloud Function') || l.includes('成績'))
      .forEach(l => console.log(l));
  });

  test('直接模擬：寫入快取後地圖節點星星應顯示', async ({ page }) => {
    const logs = collectLogs(page);
    await login(page, '測試班', 1, '測試學生B');

    // 手動寫入快取（模擬 saveScore 後的 localStorage 狀態）
    await page.goto('/');
    await page.evaluate(() => {
      const cacheKey = 'fb_cache_測試學生B';
      const record = {
        className: '測試班',
        userName: '測試學生B',
        qID: 'SETUP_T01',
        gameMode: '連連看',
        timeSpent: 30,
        status: 'PASS',
        stars: 3,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(cacheKey, JSON.stringify({
        time: Date.now(),
        data: [record]
      }));
    });

    // 導航到地圖
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);

    // 檢查 DOM - 使用正確的 selector .level-node
    const result = await page.evaluate(() => {
      const statsBar = document.getElementById('user-stats-bar')?.textContent || '';

      // level-node 是正確的 class（不是 map-node）
      const allNodes = document.querySelectorAll('#level-container .level-node');
      const nodesInfo = [];
      allNodes.forEach((node, i) => {
        const starsEl = node.querySelector('.stars');
        nodesInfo.push({
          index: i,
          id: node.id,
          className: node.className,
          hasStars: !!starsEl,
          starsText: starsEl?.textContent?.trim() || '',
          innerHTML: node.innerHTML.substring(0, 200)
        });
      });

      return {
        statsBarText: statsBar,
        totalLevelNodes: allNodes.length,
        firstFiveNodes: nodesInfo.slice(0, 5),
      };
    });

    console.log('=== 地圖節點 DOM 狀態 ===');
    console.log('Stats bar:', result.statsBarText);
    console.log('Total level nodes:', result.totalLevelNodes);
    console.log('First 5 nodes:');
    result.firstFiveNodes.forEach(n => {
      console.log(`  Node #${n.index} (${n.id}): class="${n.className}" hasStars=${n.hasStars} starsText="${n.starsText}"`);
    });

    // 核心斷言
    expect(result.totalLevelNodes, '地圖應有關卡節點').toBeGreaterThan(0);

    // 第一個節點應該有 stars class
    const firstNode = result.firstFiveNodes[0];
    expect(firstNode?.hasStars, '第一關節點應有 .stars 元素').toBe(true);

    // Stats bar 應顯示 3 星
    const starsMatch = result.statsBarText.match(/(\d+)\s*\/\s*\d+/);
    const displayed = starsMatch ? parseInt(starsMatch[1]) : 0;
    expect(displayed, '地圖 stats bar 應顯示 3 星').toBe(3);

    // 輸出相關 console logs
    console.log('\n=== 相關 Console Logs ===');
    logs.filter(l => l.includes('成績') || l.includes('快取') || l.includes('sync') || l.includes('error'))
      .forEach(l => console.log(l));
  });

  test('Edge case: 背景同步是否會覆蓋樂觀更新', async ({ page }) => {
    const logs = collectLogs(page);
    await login(page, '測試班', 1, '測試學生C');

    // 模擬場景：用戶先到地圖頁（此時無紀錄），再玩遊戲得3星，再回地圖
    // Step 1: 先到地圖（建立空快取）
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(2000);

    const beforeCache = await page.evaluate(() => {
      return localStorage.getItem('fb_cache_測試學生C');
    });
    console.log('Step 1 - 地圖快取:', beforeCache);

    // Step 2: 模擬在遊戲頁 saveScore（cacheAppend）
    await page.evaluate(() => {
      // 模擬 cacheAppend 邏輯
      const cacheKey = 'fb_cache_測試學生C';
      const raw = localStorage.getItem(cacheKey);
      let data = [];
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          if (Date.now() - obj.time < 7200000) {
            data = obj.data || [];
          }
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

    const afterSave = await page.evaluate(() => {
      const raw = localStorage.getItem('fb_cache_測試學生C');
      return raw ? JSON.parse(raw).data?.length : 0;
    });
    console.log('Step 2 - saveScore 後快取筆數:', afterSave);

    // Step 3: 回地圖 — 測試星星是否正確
    await page.goto('/pages/map.html?mode=連連看&tab=map');
    await page.waitForTimeout(3000);

    // 等背景同步完成後再檢查
    const finalResult = await page.evaluate(() => {
      const statsBar = document.getElementById('user-stats-bar')?.textContent || '';
      const cacheRaw = localStorage.getItem('fb_cache_測試學生C');
      let cacheData = [];
      if (cacheRaw) {
        try { cacheData = JSON.parse(cacheRaw).data || []; } catch(e) {}
      }

      const firstNode = document.querySelector('#level-container .level-node');
      const starsEl = firstNode?.querySelector('.stars');

      return {
        statsBarText: statsBar,
        cacheRecordCount: cacheData.length,
        cacheRecords: cacheData.map(r => ({ qID: r.qID, gameMode: r.gameMode, stars: r.stars })),
        firstNodeHasStars: !!starsEl,
        firstNodeStarsText: starsEl?.textContent?.trim() || '',
        firstNodeClass: firstNode?.className || ''
      };
    });

    console.log('=== Step 3 - 回地圖後 ===');
    console.log(JSON.stringify(finalResult, null, 2));

    // 核心斷言：快取不應被覆蓋
    expect(finalResult.cacheRecordCount, '快取中仍應有紀錄').toBeGreaterThan(0);
    const has3Stars = finalResult.cacheRecords.some(r => r.qID === 'SETUP_T01' && r.stars === 3);
    expect(has3Stars, '快取中 SETUP_T01 應有 3 星').toBe(true);

    // Stats bar
    const match = finalResult.statsBarText.match(/(\d+)\s*\/\s*\d+/);
    const stars = match ? parseInt(match[1]) : 0;
    expect(stars, '地圖應顯示 3 星').toBe(3);

    // 關卡節點
    expect(finalResult.firstNodeHasStars, '第一關應有星星').toBe(true);

    console.log('\n=== Console Logs ===');
    logs.filter(l => l.includes('背景') || l.includes('sync') || l.includes('快取') || l.includes('覆蓋'))
      .forEach(l => console.log(l));
  });

  test('BUG: 遊戲頁 top bar 星星在過關後不會即時更新', async ({ page }) => {
    const logs = collectLogs(page);
    await login(page, '測試班', 1, '測試學生D');

    // 先寫入一些已有的星星（模擬之前的成績）
    await page.goto('/');
    await page.evaluate(() => {
      const cacheKey = 'fb_cache_測試學生D';
      localStorage.setItem(cacheKey, JSON.stringify({
        time: Date.now(),
        data: [
          { qID: 'SETUP_T01', gameMode: '連連看', stars: 2, status: 'PASS', timeSpent: 50, className: '測試班', userName: '測試學生D' }
        ]
      }));
    });

    // 進入連連看第一關
    await page.goto('/pages/連連看.html?q=SETUP&t=T01');
    await page.waitForTimeout(2000);

    // 檢查 top bar 初始星星數
    const topBarBefore = await page.evaluate(() => {
      const bar = document.querySelector('.level-top-bar');
      if (!bar) return { found: false };
      const badge = bar.querySelector('div[style*="background"]');
      return {
        found: true,
        barText: bar.textContent?.trim() || '',
        badgeText: badge?.textContent?.trim() || 'no badge'
      };
    });
    console.log('Top bar BEFORE game:', JSON.stringify(topBarBefore));

    // 開始遊戲並完成
    await page.click('#btn-start');
    await page.waitForTimeout(500);

    // 自動配對
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

    // 等 win overlay
    await page.waitForTimeout(2000);

    // 檢查 top bar 是否更新
    const topBarAfter = await page.evaluate(() => {
      const bar = document.querySelector('.level-top-bar');
      if (!bar) return { found: false };
      const badge = bar.querySelector('div[style*="background"]');
      return {
        found: true,
        barText: bar.textContent?.trim() || '',
        badgeText: badge?.textContent?.trim() || 'no badge'
      };
    });
    console.log('Top bar AFTER game:', JSON.stringify(topBarAfter));

    // 比較：top bar 星星是否在過關後增加？
    // 預期：top bar 初始顯示 2 星，過關後應增加到 3 星
    // 但 BUG 可能是：top bar 不會即時更新
    const beforeMatch = topBarBefore.badgeText.match(/⭐\s*(\d+)/);
    const afterMatch = topBarAfter.badgeText.match(/⭐\s*(\d+)/);
    const starsBefore = beforeMatch ? parseInt(beforeMatch[1]) : -1;
    const starsAfter = afterMatch ? parseInt(afterMatch[1]) : -1;
    console.log(`Top bar 星星: 過關前=${starsBefore}, 過關後=${starsAfter}`);

    if (starsAfter <= starsBefore) {
      console.log('⚠️ BUG CONFIRMED: 遊戲頁 top bar 星星在過關後沒有即時更新！');
      console.log('   用戶看到的星星數仍然是舊值，這可能就是「星星沒有更新」的原因');
    }

    // 輸出 console logs
    console.log('\n=== Console Logs ===');
    logs.filter(l => l.includes('star') || l.includes('成績') || l.includes('Cloud'))
      .forEach(l => console.log(l));
  });
});
