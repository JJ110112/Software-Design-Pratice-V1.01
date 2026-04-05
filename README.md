# Software Design Practice V1.01

VB.NET 丙級術科練習系統，提供 19 種互動關卡協助學生備考。

技術棧：純 HTML/CSS/JS + Firebase Firestore + Cloud Functions + Playwright

---

## 專案結構

```
├── index.html              # 首頁（登入／關卡地圖入口）
├── leaderboard.html        # 排行榜
├── dashboard.html          # 教師儀表板
├── manage-roster.html      # 班級名冊管理
├── pages/                  # 19 種關卡頁面（HTML）
├── js/
│   ├── api.js              # Firestore 讀寫、快取、離線重試
│   ├── quiz_data.js        # 題目資料
│   ├── game-toolbar.js     # 通用遊戲工具列（星星、計時）
│   ├── nextlevel.js        # 通關後銜接下一關邏輯
│   └── users.js            # 登入 / 登出 / 閒置偵測
├── css/                    # 樣式
├── functions/
│   └── index.js            # Firebase Cloud Functions（寫入、排行榜結算、防刷）
├── firestore.rules         # Firestore 安全規則
├── agent/
│   ├── agent.py            # LangGraph Multi-Agent QA 系統
│   └── run_qa.py           # QA 執行入口
├── tests/                  # Playwright 測試（E2E + 整合）
└── document/               # 丙級術科參考手冊與題庫
```

---

## 關卡順序（共 19 關）

```
SETUP
  → Q1~Q5 × T01（看中文寫程式、連連看、程式填空…等）
  → Q1~Q5 × T02
  → Q1~Q5 × T03
  → 1060306、1060307、1060308（考古題模擬考）
```

---

## Firestore 資料庫架構

### 集合總覽

| 集合 | 用途 | 寫入方 | 讀取方 |
|------|------|--------|--------|
| `scores` | 原始成績事件紀錄 | Cloud Functions（admin SDK） | 全端（read only） |
| `summaries/leaderboard` | 排行榜預結算摘要 | Cloud Functions | 前端（排行榜頁） |
| `summaries/dashboard` | 儀表板預結算摘要 | Cloud Functions | 前端（教師儀表板） |
| `user_progress/{className}__{userName}` | 每位學生的扁平化進度 | Cloud Functions | 前端（O(1) 查詢） |
| `config/roster` | 班級名冊 | Cloud Functions（教師驗證後） | 前端 |

### `scores` — 成績事件紀錄

```js
{
  userName: string,       // 學生姓名
  className: string,      // 班級名稱
  qID: string,            // 題目 ID（如 "Q1"）
  gameMode: string,       // 遊戲模式（如 "T01_連連看"）
  status: "PASS" | "FAIL",
  stars: 0 | 1 | 2 | 3,  // 0提示=3星
  timeSpent: number,      // 花費秒數
  timestamp: string,      // ISO 8601
  uid: string             // Firebase 匿名 UID
}
```

前端**禁止直接寫入**，所有成績必須透過 `saveScoreSecure` Cloud Function。

### `user_progress/{className}__{userName}` — 學生進度（新架構）

> **2026-03-30 引入**，取代掃描 scores 集合，實現 O(1) 學生進度讀取。

Doc ID 格式：`{className}__{userName}`（雙底線分隔）

```js
{
  className: string,
  userName: string,
  stars: number,              // 累計最佳星星數
  uniqueClears: number,       // 已通關關卡數
  totalBestTime: number,      // 各關最佳時間加總
  totalAttempts: number,      // 嘗試次數（含失敗）
  lastActive: string,         // 最後活動時間 ISO 8601
  bestLevelInfo: {            // 每關的個人最佳紀錄
    "[qID]_[gameMode]": {
      stars: number,
      timeSpent: number
    }
    // …
  }
}
```

`bestLevelInfo` 在 `saveScoreSecure` 的 **Transaction** 內即時更新，確保原子性。

### `summaries/leaderboard` — 排行榜摘要

```js
{
  ranking: [
    {
      className, userName,
      stars, uniqueClears, totalBestTime,
      totalAttempts, lastActive
      // 不含 bestLevelInfo（節省文件大小）
    }
  ],
  updatedAt: string,
  totalRecords: number
}
```

### `summaries/dashboard` — 儀表板摘要

包含全班詳細資料供教師儀表板使用，格式與 leaderboard 相近但含更多欄位。

---

## Cloud Functions

### `saveScoreSecure` (onCall)

學生提交成績的唯一合法入口。

**防刷保護（雙層）：**
1. **記憶體層**：同一 UID 5 秒內重複呼叫直接拒絕（不耗 DB）
2. **持久層**：在 `user_progress` Transaction 內讀取上次提交時間，同一關卡 3 秒內重複提交判定為惡意連刷

兩層均以 `HttpsError("resource-exhausted", ...)` 回傳，錯誤訊息會完整傳遞到前端。

### `rebuildLeaderboard` (onSchedule / onCall)

從 `scores` 全量讀取後，批次寫入：
- `summaries/leaderboard`
- `summaries/dashboard`
- 所有 `user_progress/{id}` 文件

每日定時執行，教師也可手動觸發。

### `deleteScoresSecure` (onCall)

刪除成績時同步清除對應的 `user_progress` 文件，保持資料一致性。

---

## 安全規則摘要

- `scores`：前端唯讀，寫入由 admin SDK 負責
- `summaries`：前端唯讀
- `config`：前端唯讀
- `user_progress`：前端唯讀（規則中預設拒絕，由 admin SDK 寫入）
- 教師密碼存放於 **Firebase Secret Manager**，不再硬編碼

---

## 開發指引

### 安裝依賴

```bash
npm install
cd functions && npm install
```

### 執行測試

```bash
npx playwright test                  # 全部測試
npx playwright test --grep "E2E"     # 僅 E2E 測試
```

### QA Agent（Multi-Agent LangGraph）

```bash
cd agent
python run_qa.py
```

流程：`test_runner` → `security_consensus`（3 模型投票）→ `qa_consensus`（3 模型投票）→ `code_fixer`（Human-in-the-loop）

### 部署 Cloud Functions

```bash
firebase deploy --only functions
```

### 本機開發注意事項

- `?dev=1` 查詢參數可啟用跳關功能（不可移除）
- 測試班級為 `className === "測試用"`，刪除全部成績時不會刪除此班資料
- E2E 測試資料 `qID.startsWith("E2E_")` 會被排行榜過濾

---

## 禁止事項（參見 AGENTS.md）

- 不可引入任何 npm 套件或 JS 框架
- 不可修改 `common.css` 的 overlay 結構
- `saveScore()` 不可清除排行榜快取
- 不可直接修改 main branch
- 不可修改 Firestore 安全規則
- 不可移除 `dev=1` 跳關功能
