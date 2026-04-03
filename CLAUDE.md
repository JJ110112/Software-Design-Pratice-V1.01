# CLAUDE.md — Software Design Pratice V1.01 專案規範

## 專案概述

**VB.NET 丙級術科練習系統**
技術棧：純 HTML/CSS/JS（無框架）+ Firebase Firestore + Cloud Functions + Playwright
部署：Firebase Hosting（主站）+ GitHub Pages（備援）

---

## 目錄結構

```
/
├── index.html               # 首頁（登入 / 關卡選擇）
├── leaderboard.html         # 排行榜
├── dashboard.html           # 教師儀表板
├── manage-roster.html       # 名冊管理
├── pages/
│   ├── map.html             # 訓練進程地圖
│   ├── 連連看.html
│   ├── 記憶翻牌遊戲.html
│   ├── 中英選擇題.html
│   ├── 程式碼朗讀練習.html
│   ├── 一行程式碼翻譯.html
│   ├── 錯誤找找看.html
│   ├── 程式碼排列重組.html
│   ├── 程式與結果配對.html
│   ├── 逐行中文注解填空.html
│   ├── 打字練習.html        # sub=keyword/line/full 三種模式
│   ├── 看中文寫程式.html
│   ├── 程式填空.html
│   ├── 獨立全程式撰寫.html
│   ├── 錯誤程式除錯.html
│   └── 模擬考.html
├── js/
│   ├── api.js               # Firebase 初始化、快取、saveScore、getScoresForUser
│   ├── game-toolbar.js      # 右上角工具列（Home/Map/Sound/Restart）+ top bar 星星
│   ├── users.js             # 登入/登出、getCurrentUser()
│   ├── quiz_data.js         # 題庫資料
│   ├── nextlevel.js         # 關卡銜接邏輯
│   └── quotes.js            # 勵志名言
├── css/
│   └── common.css           # 全站共用樣式（含 game-toolbar、top bar、星星徽章）
├── functions/
│   └── index.js             # Cloud Functions (Node.js 20)
├── tests/                   # Playwright 測試
├── firestore.rules          # Firestore 安全規則
├── firebase.json            # Firebase 設定（含 Emulator）
└── package.json
```

---

## 關卡順序（共 19 關）

```
SETUP → Q1 → Q2 → Q3 → Q4 → Q5
      → Q1_T01 → Q1_T02 → Q1_T03
      → Q2_T01 → Q2_T02 → Q2_T03
      → Q3_T01 → Q3_T02 → Q3_T03
      → Q4_T01
      → 1060306 → 1060307 → 1060308
```

每次修改 nextlevel.js 或 quiz_data.js 後，必須確認上述順序正確。

---

## 遊戲模式（共 16 種，對應 Cloud Function gameMode 值）

```
連連看、記憶翻牌遊戲、中英選擇題、程式碼朗讀練習、一行程式碼翻譯、錯誤找找看
程式碼排列重組、程式與結果配對、逐行中文注解填空
打字-關鍵字、打字-單行、打字-完整、看中文寫程式
程式填空、獨立全程式撰寫、錯誤程式除錯
```

---

## 開發指令

```bash
npm test                    # 全部 Playwright 測試
npm run test:smoke          # 冒煙測試（all-pages-smoke）
npm run test:exam           # 模擬考測試
npm run test:headed         # 有視窗 Playwright
npm run test:emulator       # Firebase Emulator 整合測試（必用於 Firestore 相關修改）
npm run serve               # 本地 serve（port 5500）

firebase deploy             # 全部部署
firebase deploy --only functions   # 只部署 Cloud Functions
firebase deploy --only hosting     # 只部署前端
firebase deploy --only firestore   # 只部署 Security Rules

git push origin main        # 同步到 GitHub Pages（必須與 firebase deploy 同步執行）
```

---

## Firestore 資料模型

### 集合

| 集合 | 用途 | 寫入方 |
|------|------|--------|
| `scores` | 每筆過關/失敗紀錄 | Cloud Functions only |
| `user_progress/{className}__{userName}` | 學生最佳成績（扁平化，O(1) 讀取） | Cloud Functions only |
| `summaries/leaderboard` | 全站排行榜結算摘要 | Cloud Functions only |
| `summaries/dashboard` | 儀表板摘要（最新 500 筆） | Cloud Functions only |
| `config/roster` | 班級名冊 | Cloud Functions only（需教師密碼） |

### 安全規則原則

- 所有集合：`allow read: if true`，`allow write: if false`
- 前端**禁止**直接寫入 Firestore，只能透過 Cloud Functions（Admin SDK）
- 新增集合必須更新 `firestore.rules`，否則預設全部拒絕

---

## Cloud Functions（functions/index.js）

| Function | 用途 | 注意事項 |
|----------|------|---------|
| `saveScoreSecure` | 前端呼叫儲存成績，含完整 transaction | 名冊驗證（`getRosterSet`）+ 每次讀 1 doc（user_progress） |
| `rebuildLeaderboard` | 全表掃描 scores → 重建所有摘要 | **耗讀取量！有 5 分鐘冷卻**；全表掃描 O(N) |
| `dailyLeaderboardRebuild` | 每日 UTC 18:00（台灣 02:00）自動結算 | Cron，不對外暴露 |
| `seedTestTeacher` | 回復測試教師的 912 星資料 | 先刪舊記錄再植入，每次淨 304 筆 |
| `deleteScoresSecure` | 刪除學生成績（single/all） | all 模式保留測試用班級資料 |
| `saveRosterSecure` | 寫入班級名冊 | 需教師密碼（Secret Manager） |

### Admin SDK 注意事項

```javascript
// ✅ Admin SDK：.exists 是屬性
if (docSnap.exists) { ... }

// ❌ 前端 SDK：.exists() 是方法（Admin SDK 這樣寫會崩潰）
if (docSnap.exists()) { ... }
```

---

## 三層快取架構

| 層 | key | TTL | 失效時機 |
|----|-----|-----|---------|
| localStorage `fb_cache_{userName}` | 學生成績 | 2 小時 | 登出 / forceRefresh / fb_data_updated 信號 |
| IndexedDB（Firestore SDK 自動） | 所有 Firestore 讀取 | SDK 管理 | 只有 `getDocFromServer` 能繞過 |
| 記憶體 | 頁面變數 | 頁面關閉 | 重整 / 導航 |

### 關鍵規則

- **Dashboard 操作後**必須寫 `localStorage.setItem('fb_data_updated', Date.now())`，觸發其他分頁自動清快取
- **IndexedDB stale 問題**：`getDoc` 可能回傳舊資料，重要讀取路徑用 `getDocFromServer`
- **seedTestTeacher / deleteScores 後**：前端必須用 `getScoresForUser(userName, forceRefresh=true)`

---

## 成績儲存資料流

```
遊戲過關
  ↓
saveScore()
  ├─ Step 1: cacheAppend() → 樂觀更新 localStorage (即時)
  ├─ Step 1b: refreshStarBadge() → 即時刷新 top bar 星星
  ├─ Step 2: 寫入 local_scores 備份（離線保底）
  └─ Step 3: _saveScoreCallable(newRecord) → Cloud Function saveScoreSecure
               ├─ 驗證 timeSpent ≥ 3（防作弊）
               ├─ 驗證 className_userName 在名冊中（getRosterSet，10 分鐘快取）
               ├─ UID 防連刷（記憶體層級）
               ├─ Transaction: 讀 user_progress → 寫 scores + dashboard_records + user_progress + leaderboard_entries
               └─ 回傳 { success, id }
```

---

## 讀取用戶資料（雙查模式）

任何需要讀取 `sw_quiz_user` 的地方，必須同時查 sessionStorage 和 localStorage：

```javascript
// ✅ 正確：session 優先（非永久登入用 sessionStorage）
let raw = sessionStorage.getItem('sw_quiz_user');
if (!raw) raw = localStorage.getItem('sw_quiz_user');
const user = raw ? JSON.parse(raw) : null;

// ❌ 錯誤：只查 localStorage 會導致非永久登入取不到 className
const user = JSON.parse(localStorage.getItem('sw_quiz_user'));
```

---

## 星星顯示（5 個位置）

| 位置 | 元素 | 資料來源 |
|------|------|---------|
| index.html | `#user-status` | `getUserStarStats()` 總星 |
| map.html | `#user-info` | `getUserStarStats()` 總星 |
| map.html | `#user-stats-bar` | `loadProgress()` 模式星星 |
| map.html | `.level-node .stars` | `renderMap()` 單關星星 |
| 遊戲頁 | `#top-bar-star-badge` | `getUserStarStats()` + `refreshStarBadge()` 即時更新 |

---

## UI 架構（遊戲頁 top bar）

```
[固定 top bar, height:48px, z-index:8000]
  ├── user avatar + name (flex-shrink:0)
  ├── level-top-bar-title (flex:1, overflow:hidden, 超出寬度自動跑馬燈)
  └── #top-bar-star-badge (flex-shrink:0, 永遠可見)

[game-toolbar, fixed, top:2px, right:16px, z-index:9000]
  ├── 🏠 Home
  ├── 🗺️ Map
  ├── 🔊/🔇 Sound toggle
  └── 🔄 Restart
```

Top bar `padding-right: 220px`（PC）/ `148px`（手機）預留 toolbar 空間，確保星星不被遮蓋。

---

## Firestore 讀取量控制

### 高風險操作（必須謹慎）

1. **`rebuildLeaderboard()`** = `db.collection("scores").get()` = **全表掃描**
   - 有 5 分鐘冷卻（記憶體層級）
   - `deleteScoresSecure` 呼叫後自動觸發一次
   - `seedTestTeacher` 呼叫後自動觸發一次
   - 勿在短時間內多次手動觸發儀表板刷新

2. **`seedTestTeacher`** 每次淨增 0 筆（先清後植），不再累積
3. **`syncOnMapLoad`** 改用 `user_progress`（O(1)），不再查 `scores` 集合

### 每次 saveScoreSecure 的讀取量

- 1 doc per transaction（user_progress，O(1)）
- 名冊驗證：`getRosterSet()` 帶 10 分鐘記憶體快取，熱路徑 0 讀取
- 不觸發 rebuildLeaderboard

---

## 測試規範

### Playwright 測試限制

Playwright **無法**測試：
- Firebase Auth（匿名登入）
- Firestore 讀寫
- Cloud Functions

Playwright **只能**測試：localStorage / sessionStorage / DOM 互動 / URL 路由

### 測試黃金規則

```javascript
// ✅ mockLogin 必須模擬真實 storage 策略
// persist=false → 只寫 sessionStorage
// persist=true  → 只寫 localStorage（兩邊都寫會掩蓋 bug）
await mockLogin(page, { name: '測試生', className: 'A班', persist: false });
```

### 涉及 Firebase 的修改必須跑 Emulator 測試

```bash
npm run test:emulator
# 覆蓋：Auth 匿名登入、user_progress 讀寫、saveScoreSecure 完整流程
#        seedTestTeacher、forceRefresh、跨分頁快取失效
```

---

## 部署流程

```bash
# 1. 完成修改 + commit
git add <files> && git commit -m "..."

# 2. 部署到 Firebase Hosting（主站）
firebase deploy

# 3. 同步到 GitHub Pages（必做！兩個部署環境）
git push origin main

# 4. production 手動驗證
#    a. 登出 → 登入 → 確認星星正確
#    b. 儀表板 → 回復教師資料 → 確認 912 顆星顯示
```

---

## QA Checklist（修改成績相關邏輯後）

- [ ] `saveScore → cache → getScoresForUser → UI` 完整鏈路正確
- [ ] sessionStorage-only 登入（persist=false）不受影響
- [ ] `forceRefresh=true` 路徑也正確
- [ ] `firestore.rules` 允許相關集合的 read
- [ ] 過濾邏輯只影響顯示，不影響 `user_progress` 寫入
- [ ] Admin SDK 語法：`.exists`（屬性，非方法）
- [ ] 所有 className 都走完整 transaction（無 early return）
- [ ] `firebase deploy` 後 + `git push origin main` 都做了
- [ ] production 手動測試：logout→login + seedTestTeacher 流程

---

## 禁止事項

- **不可引入 npm 套件或 JS 框架**（技術棧：純 HTML/CSS/JS）
- **不可直接從前端寫入 Firestore**（必須透過 Cloud Functions）
- **不可移除 `dev=1` 跳關功能**（開發 / E2E 測試用）
- **不可修改 common.css 的 overlay 結構**
- **`saveScore()` 不可清除排行榜快取**
- **修改 `firestore.rules` 前確認影響範圍**（預設全拒絕）
- **Admin SDK 勿用 `.exists()` 語法**（前端 SDK 才是方法，Admin 是屬性）
- **遊戲頁 `saveScore` 的 `timeSpent` 不可傳 0 或硬編碼**（Cloud Function 防作弊會拒絕 `<3` 秒的 PASS）

---

## 已知陷阱（曾踩過的 bug）

| 陷阱 | 症狀 | 對策 |
|------|------|------|
| mockLogin 同時寫兩邊 storage | 掩蓋 className=null bug，測試通過但 production 爆炸 | persist 參數嚴格控制 |
| `getDoc` 回傳 IndexedDB stale | 成績回復後仍顯示舊資料 | `getDocFromServer` |
| `rosterSnap.exists()` → Admin SDK crash | seedTestTeacher 後 0 星 | `.exists`（無括號） |
| `className==="測試用"` early return | 測試班 user_progress 不更新 | 所有班級走完整 transaction |
| `scoreCollection` 只查 `scores` 在 `syncOnMapLoad` | 每次 cache 過期讀取量暴增 | 改用 `user_progress` |
| `seedTestTeacher` 重複呼叫累積記錄 | scores 集合無限膨脹 + rebuild 讀取暴增 | 先清後植 |
| Firebase deploy 但忘記 git push | GitHub Pages 版本落後 | 養成兩個指令一起下的習慣 |
| `saveScore` 傳 `timeSpent=0` | 本機樂觀更新星星正常，但 CF 拒絕寫入（防作弊 `<3s`），排行榜不計 | 每個遊戲頁必須計時，傳實際秒數 |
| `saveScoreSecure` 無名冊驗證 | 任何人可用 devtools 寫入任意姓名成績，排行榜出現垃圾帳號 | `getRosterSet()` 寫入前驗證，非名冊學生拒絕 |
