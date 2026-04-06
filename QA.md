# QA 文件 — Software Design Practice V1.01

> 最後更新：2026-04-06

---

## 一、歷史 Bug 總覽

### 1.1 成績與星星相關（2026-03 ~ 04）

| # | Bug | 根因 | 為什麼沒抓到 |
|---|-----|------|-------------|
| 1 | 過關後 top bar 星星不更新 | saveScore 後未呼叫 refreshStarBadge | 測試只驗快取寫入，未驗 UI 即時反映 |
| 2 | 非永久登入星星歸零 | getScoresForUser 只查 localStorage 取 className | mockLogin 同時寫了 session+local，掩蓋 bug |
| 3 | 登出→登入星星歸零 | firestore.rules 缺 user_progress read 權限 | 測試環境 Firestore 全部失敗，走 cache fallback 反而通過 |
| 4 | 儀表板刷新降星 | forceRefresh 走 _fallbackLiveRanking(limit 500) | 沒有測試 forceRefresh=true 的程式碼路徑 |
| 5 | 結算排行榜偶爾降星 | 同 #4，儀表板讀到 limit(500) 的結果 | 沒有測試「結算+刷新」的完整流程 |
| 6 | getScoresForUser 無防禦性回退 | user_progress 讀取失敗時回傳空陣列 | 測試環境 Firestore 失敗是常態，不被視為異常 |
| 7 | 排行榜出現已刪除學生 | rebuildLeaderboard 不看名冊，只看 scores | 沒有測試「刪除學生後排行榜是否更新」 |
| 8 | 名冊過濾讀錯結構 | roster 結構是 `{classes:{...}}` 非 `{班級:[...]}` | 沒有對照實際 Firestore 文件結構 |
| 9 | rosterSnap.exists() 誤用 | Admin SDK 的 exists 是屬性非方法 | 前端 SDK `.exists()` vs Admin SDK `.exists` |
| 10 | 名冊過濾連 user_progress 也排除 | 過濾邏輯應只影響排行榜顯示，不影響 user_progress | 沒有區分「顯示過濾」vs「資料寫入」 |
| 11 | seedTestTeacher 後教師 0 星 | rebuildLeaderboard 崩潰 → scores 寫了但 user_progress 沒建 | Cloud Function 無原子性 |
| 12 | 測試用班級跳過 transaction | className==="測試用" early return，不更新 user_progress | 該路徑沒有測試覆蓋 |
| 13 | IndexedDB stale 資料 | enableIndexedDbPersistence 讓 getDoc 回傳舊快照 | 測試環境沒有 IndexedDB 持久化 |

### 1.2 UI / 遊戲關卡（2026-04-06）

| # | Bug | 根因 | 影響頁面 |
|---|-----|------|---------|
| 14 | 錯誤除錯 1060307 T01 第 2 題找不到錯誤 | BUGS.orig 用 `\\\\`（雙反斜線）但 quiz_data raw 是 `\\`（單反斜線），字串比對永遠失敗 | 錯誤程式除錯.html |
| 15 | 看中文寫程式每次 Enter 螢幕跳到底部 | `activeLine.scrollIntoView` 將焦點帶到下方 code-display，輸入區被推出螢幕 | 看中文寫程式.html |
| 16 | 獨立撰寫 Syntax error 提示遮擋打字 | `.validation-overlay` 定位在 `bottom:20px` | 獨立全程式撰寫.html |
| 17 | 行號與程式碼不對齊 | line-numbers font-size `.9rem` vs textarea `1rem`，同 line-height 但計算行高不同 | 獨立全程式撰寫.html、模擬考.html |
| 18 | 編輯器寬度不夠，長行被截斷 | `.content` max-width 960px 不足 | 獨立全程式撰寫.html |
| 19 | Dashboard 學生 Modal 階段顏色與 map.html 不一致 | dashboard 的 stage color 與 map.html 定義不同 | dashboard.html |
| 20 | 模擬考星星計入總星數 | saveScoreSecure 和 getUserStarStats 都計入模擬考 | api.js、functions/index.js |

---

## 二、測試盲區與已知限制

### 2.1 Playwright 測不到的範圍

Playwright 無法測試以下路徑，必須用 Firebase Emulator 整合測試覆蓋：

| 測不到的範圍 | 原因 | 替代方案 |
|-------------|------|---------|
| Firebase Auth（匿名登入） | 無真實 Firebase 環境 | `npm run test:emulator` |
| Firestore 讀寫 | 前端 SDK 連不上 Firestore | Emulator 整合測試 |
| Cloud Functions | 無法呼叫 callable functions | Emulator + 手動 production 測試 |
| IndexedDB persistence（stale 資料） | 測試環境無 IndexedDB | 手動測試 + `getDocFromServer` |
| 跨分頁快取失效 | Playwright 單頁測試 | 手動多分頁測試 |

### 2.2 Playwright 可以測的範圍

- localStorage / sessionStorage 讀寫
- DOM 互動 / UI 渲染
- URL 路由 / 頁面導航
- 遊戲邏輯（純前端計算）
- mockLogin 模擬登入

### 2.3 容易遺漏的測試場景

| 場景 | 為什麼容易遺漏 |
|------|--------------|
| `forceRefresh=true` 路徑 | 大部分測試只走 cache hit 路徑 |
| sessionStorage-only 登入（persist=false） | mockLogin 預設可能同時寫兩邊，掩蓋 bug |
| 刪除學生後排行榜更新 | 通常只測「新增」不測「刪除」 |
| Cloud Function 部分崩潰 | scores 寫入成功但後續操作失敗，非原子操作 |
| 字串跳脫（`\\` vs `\\\\`） | JS 字串字面量與實際值的差異 |
| 不同 font-size 搭配相同 line-height | 視覺上不明顯，需實際打字多行才發現 |

---

## 三、測試規範

### 3.1 mockLogin 必須模擬真實 storage 策略

```javascript
// ✅ persist=false → 只寫 sessionStorage（模擬非永久登入）
await mockLogin(page, { name: '測試生', className: 'A班', persist: false });

// ✅ persist=true → 只寫 localStorage（模擬永久登入）
await mockLogin(page, { name: '測試生', className: 'A班', persist: true });

// ❌ 同時寫兩邊會掩蓋 bug
```

### 3.2 讀取用戶資料必須雙查

```javascript
// ✅ session 優先
let raw = sessionStorage.getItem('sw_quiz_user');
if (!raw) raw = localStorage.getItem('sw_quiz_user');
const user = raw ? JSON.parse(raw) : null;

// ❌ 只查 localStorage（非永久登入會取不到）
const user = JSON.parse(localStorage.getItem('sw_quiz_user'));
```

### 3.3 Admin SDK vs 前端 SDK

```javascript
// ✅ Admin SDK：.exists 是屬性
if (docSnap.exists) { ... }

// ❌ Admin SDK 用方法語法會崩潰
if (docSnap.exists()) { ... }  // TypeError
```

### 3.4 測試指令

```bash
npm test                    # 全部 Playwright 測試
npm run test:smoke          # 冒煙測試
npm run test:emulator       # Firebase Emulator 整合測試（Firestore 相關修改必跑）
npm run test:headed         # 有視窗 Playwright（視覺檢查用）
```

---

## 四、防範規則

### A. 成績 / 資料層

1. **saveScore → cache → getScoresForUser → UI** 完整鏈路必須驗證
2. **所有 className 都走完整 transaction**，不可對特定班級 early return
3. **模擬考 `gameMode === '模擬考'` 不計入星星**，只記錄 PASS/FAIL
4. **`saveScore` 的 `timeSpent` 不可傳 0 或硬編碼**，Cloud Function 會拒絕 `<3` 秒的 PASS
5. **前端禁止直接寫入 Firestore**，必須透過 Cloud Functions（Admin SDK）

### B. 三層快取

| 層 | 管理方式 | 失效時機 |
|----|---------|---------|
| localStorage `fb_cache_*` | 手動 cacheGet/cacheSet，2hr TTL | 登出 / forceRefresh / fb_data_updated 信號 |
| IndexedDB（Firestore SDK） | enableIndexedDbPersistence 自動 | 只有 `getDocFromServer` 能繞過 |
| 記憶體 | 頁面重整即清 | 導航 / 重整 |

- 涉及快取的修改，必須考慮三層
- Dashboard 操作後必須寫 `localStorage.setItem('fb_data_updated', Date.now())`
- seedTestTeacher / deleteScores 後前端必須用 `getScoresForUser(userName, forceRefresh=true)`
- 關鍵讀取路徑用 `getDocFromServer`，不用 `getDoc`

### C. Firestore 規則

- 新增集合必須更新 `firestore.rules`（預設 `allow write: if false`）
- 過濾邏輯必須區分「顯示過濾」vs「資料寫入」
- `limit()` 查詢是定時炸彈，完整資料功能不能用 limit() 作主要路徑

### D. UI / 遊戲頁

- **行號與 textarea 的 font-size 和 line-height 必須完全一致**
- **浮動 overlay 不可放在 `bottom`**（打字多行後會遮擋輸入區）
- **scrollIntoView 應指向輸入區**，不是下方的參考程式碼區
- **BUGS / quiz_data 字串比對**：注意 JS 字串跳脫，`\\\\` 是雙反斜線，`\\` 才是單反斜線
- **新增遊戲關卡的 BUGS 定義後**，必須實際測試每一題是否能被點擊正確

### E. 顏色 / 視覺一致性

各階段顏色以 `map.html` 為正式來源：

| 階段 | 顏色 | 色名 |
|------|------|------|
| 第一階段 | `#67e8f9` | cyan |
| 第二階段 | `#4ade80` | green |
| 第三階段 | `#60a5fa` | blue |
| 第四階段 | `#c084fc` | purple |
| 第五階段 | `#fbbf24` | gold |
| 模擬考 | `#ef4444` | red |

新增階段相關 UI 時，必須參照此表，不可自行定義顏色。

---

## 五、部署 Checklist

### 一般修改

```
- [ ] Playwright 測試通過 (`npm test`)
- [ ] `firebase deploy --only hosting`
- [ ] `git push origin main`（同步 GitHub Pages）
- [ ] production 手動驗證
```

### 修改成績相關邏輯

```
- [ ] saveScore → cache → getScoresForUser → UI 完整鏈路正確
- [ ] sessionStorage-only 登入（persist=false）不受影響
- [ ] forceRefresh=true 路徑也正確
- [ ] firestore.rules 允許相關集合的 read
- [ ] 過濾邏輯只影響顯示，不影響 user_progress 寫入
- [ ] Admin SDK 語法：`.exists`（屬性，非方法）
- [ ] 所有 className 都走完整 transaction（無 early return）
- [ ] Emulator 整合測試通過 (`npm run test:emulator`)
- [ ] `firebase deploy`（hosting + functions）
- [ ] `git push origin main`
- [ ] production 手動測試：logout→login + seedTestTeacher 流程
```

### 修改 Cloud Functions

```
- [ ] Admin SDK 語法確認（.exists 非 .exists()）
- [ ] 本地 Emulator 驗證通過
- [ ] `firebase deploy --only functions`
- [ ] `git push origin main`
- [ ] production 手動測試
```

### 修改遊戲頁面

```
- [ ] 題庫字串比對測試（每題都能正確觸發）
- [ ] 行號與程式碼對齊（font-size 一致）
- [ ] 浮動元素不遮擋打字區域
- [ ] scrollIntoView 不會把輸入區推出螢幕
- [ ] 手機版 UI 正常
- [ ] `firebase deploy --only hosting`
- [ ] `git push origin main`
```

---

## 六、已知陷阱速查表

| 陷阱 | 症狀 | 對策 |
|------|------|------|
| mockLogin 同時寫兩邊 storage | 掩蓋 className=null bug，測試通過但 production 爆炸 | persist 參數嚴格控制 |
| `getDoc` 回傳 IndexedDB stale | 成績回復後仍顯示舊資料 | `getDocFromServer` |
| `rosterSnap.exists()` → Admin SDK crash | seedTestTeacher 後 0 星 | `.exists`（無括號） |
| `className==="測試用"` early return | 測試班 user_progress 不更新 | 所有班級走完整 transaction |
| `seedTestTeacher` 重複呼叫累積記錄 | scores 集合無限膨脹 + rebuild 讀取暴增 | 先清後植 |
| Firebase deploy 但忘記 git push | GitHub Pages 版本落後 | 養成兩個指令一起下的習慣 |
| `saveScore` 傳 `timeSpent=0` | CF 拒絕寫入（防作弊 `<3s`），排行榜不計 | 每個遊戲頁必須計時，傳實際秒數 |
| 無名冊驗證 | 任何人可寫入任意姓名成績 | `getRosterSet()` 寫入前驗證 |
| BUGS.orig 字串跳脫不一致 | 除錯關卡某題永遠無法通關 | 實際測試每題能否點擊正確 |
| line-numbers font-size ≠ textarea | 行號與程式碼逐漸錯位 | 兩者 font-size 和 line-height 必須完全一致 |
| validation-overlay 放 bottom | 打字多行後遮擋輸入區 | 改放 top 或整合到 header |
| scrollIntoView 指向 code-display | 輸入區被推出螢幕 | scrollIntoView 應指向 inputEl |
| Dashboard 階段顏色寫死錯誤值 | 學生 Modal 階段顏色與 map.html 不一致 | 參照 map.html 的 stage 配色表 |
| 模擬考計入總星數 | 總星超過 912 | gameMode==='模擬考' 排除在星星計算外 |
