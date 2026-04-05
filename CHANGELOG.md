# CHANGELOG

所有重大變更依日期倒序記錄。格式參照 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)。

---

## [Unreleased] — 2026-03-30

### 重大架構變更：引入 `user_progress` 集合

**背景**：原本讀取學生進度需全量掃描 `scores` 集合（O(n)），隨成績筆數增加讀取量線性成長。

**變更**：
- 新增 `user_progress/{className}__{userName}` 集合，每位學生一份扁平化進度文件
- `saveScoreSecure` 在 Transaction 內即時更新該文件，確保原子性
- 前端 `getMyProgress()` 改為單一 `getDoc()` 呼叫，讀取量從 O(n) 降至 **O(1)**
- `rebuildLeaderboard` 結算後批次同步所有 `user_progress` 文件
- Doc ID 格式統一使用 **雙底線** 分隔：`{className}__{userName}`

**修正連帶 Bug**：
- `api.js` 的 `bestLevelInfo` key 拆分改用 `lastIndexOf('_')` 修復複合名稱（如 `Q1_T01_連連看`）解析錯誤
- `getAllScoresForDashboard` / `getOverallRanking` 補回 `forceRefresh` 參數
- `deleteScoresSecure` 刪除成績時同步清除對應 `user_progress` 文件
- `rebuildLeaderboard` batch 改分批寫入（每批 ≤ 499 操作），防止超過 Firestore 500 操作上限

### 安全強化：雙層持久化防連刷

- **記憶體層**：同一 UID 5 秒內重複呼叫即拒絕（不耗 DB 讀取，實例重啟後重置）
- **持久層**：在 `user_progress` Transaction 內檢查上次提交時間，同一關卡 3 秒內視為惡意連刷
- `HttpsError` 防刷訊息修正為直接向前端拋出原始 message，不再被吞成通用「寫入失敗」
- 統一 `saveScoreSecure` transaction 內縮排為 2 space

### 安全強化：移除硬編碼教師密碼

- 教師密碼從原始碼移除，改存放於 **Firebase Secret Manager**
- Cloud Function 啟動時從 Secret Manager 讀取，不落地至程式碼或環境變數

---

## 2026-03-28

### LangGraph Multi-Agent QA 系統

新增 `agent/` 目錄，建立以 LangGraph 驅動的自動化品管流程：

**架構（四節點）：**
```
test_runner
    ↓
security_consensus（3 個 LLM 獨立審查 → 仲裁者彙整）
    ↓
qa_consensus（3 個 LLM 獨立判定 → 仲裁者裁決）
    │
NEEDS_FIX → code_fixer → ⏸ Human-in-the-loop 確認 → test_runner
PASS / FAIL → END
```

**特點：**
- 多模型共識機制消除單一模型盲點
- `code_fixer` 節點加入 Human-in-the-loop（修改上線前須人工確認）
- `test_runner` 真正執行 `npx playwright test`，非模擬
- 修復 Windows 中文編碼：subprocess 加 `encoding=utf-8, errors=replace`
- 修復 subprocess None 輸出導致的 QA Agent 崩潰

### 測試覆蓋強化

- 新增 E2E 旅程測試 19 項：學生／教師完整流程 + 錯誤偵測
- 新增真實流程整合測試 12 項：`saveScore` 實呼叫、離線容錯、教師操作
- 補齊「錯誤程式除錯」Q2–Q5 + 考古題 BUGS 題目資料
- 新增末關銜接測試（第 19 關通關後流程）

---

## 2026-03-27

### 效能優化：Firestore 讀取量大幅降低

| 情境 | 優化前 | 優化後 |
|------|--------|--------|
| 載入儀表板 | 全量掃描 `scores`（500+ 讀） | 讀 `summaries/dashboard`（1 讀） |
| 學生讀取自身進度 | 查詢 `scores`（O(n)） | 讀 `user_progress` 單一文件（O(1)） |
| 排行榜頁面 | 讀 500 筆 `scores` | 讀 `summaries/leaderboard`（1 讀） |

**相關修正：**
- 移除儀表板每 2 分鐘自動刷新，防止閒置消耗配額
- 修復 4 個 Firestore 讀取暴衝問題（快取未命中時重複查詢）
- 儀表板學生星星數改從排行榜取得，不受 500 筆截斷影響

### 安全修復（兩階段）

**第一階段：**
- XSS 防護：所有動態插入 HTML 改用 `textContent` 或 `DOMPurify`
- Firestore Rules 強化：前端寫入路徑全部關閉
- Cloud Function 輸入驗證強化

**第二階段：**
- Anonymous Auth：所有使用者自動匿名登入，取得 UID
- `saveScore` 全面移至 Cloud Function，前端不再直接寫入 Firestore
- 修補三項殘餘安全風險

### 功能新增

- **班級名冊管理頁**（`manage-roster.html`）：教師可維護學生清單，存入 `config/roster`
- **教師儀表板功能強化**：刪除成績（單一 / 全部）、回復測試教師資料、一鍵結算排行榜
- **Firebase Cloud Function**：每日定時自動結算排行榜（`onSchedule`）
- 登入安全機制：關瀏覽器自動登出 + 閒置 30 分鐘自動登出

### Bug 修復

- 修復 `logoutUser` 與 `getCurrentUser` 無限遞迴（stack overflow）
- 修復星星翻倍：`saveScore` 先 `normalizeMode` 統一 `gameMode` 名稱
- 修復星星重複計算：取消樂觀快取，Cloud Function 成功後才寫入
- 修復 `saveScoreSecure` 失敗：簡化防連刷查詢避免複合索引需求
- 修復地圖頁星星顯示 0：`syncOnMapLoad` 改直接覆蓋快取
- Cloud Functions 全部加上 `cors: true` 修復跨域問題
- Dashboard 刷新後清除本機快取，顯示最新成績
- 刪除全部成績時保留 `className !== '測試用'` 的教師資料

---

## 2026-03-22

### UI / RWD

- 手機版 RWD 全面優化：導覽列移至頁面頂部、隱藏星星資訊、縮小工具列按鈕
- 打字練習頁面：進入時自動 focus、等鍵盤彈出後捲動至輸入區
- Dashboard 標題不折行，controls 自動換行

### 功能

- 新增 `dev` 模式測試帳號（`?dev=1` 才可見）
- 排行榜與 Dashboard 隱藏測試帳號，修正星星超額問題
- 修正 GitHub Pages 首頁被 `enforceLogin` 誤導向問題
- 系統文件移出 git 追蹤（避免學生瀏覽）

---

## 2026-03-21 — 初始版本

- 初始 commit：Software Design Practice V1.01
- 新增 19 種關卡頁面（連連看、程式填空、打字練習、模擬考等）
- Firestore 成績同步與本地 localStorage 備份機制
- 新增模擬考模式
- 新增 Playwright 測試環境
- 優化 Firestore 讀取量與 Dashboard 分頁
- 清理開發殘留檔案（55 個 Python 腳本、tmp JS、除錯 log）
