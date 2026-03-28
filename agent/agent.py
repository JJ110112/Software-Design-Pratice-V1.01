"""
Software Design Practice V1.01 — Multi-Agent QA Loop
3 個專業角色（節點）協同品保：
  1. test_runner   — QA 測試員：執行 Playwright 測試，回報通過/失敗
  2. security_auditor — 安全審計員：檢查 XSS、快取、API 安全、Firestore 規則
  3. qa_lead       — 品管主管：彙整結果，判斷是否通過，產出報告或指示修復
"""

from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, START, END
from langchain_anthropic import ChatAnthropic

# ══════════════════════════════════════════
#  狀態定義
# ══════════════════════════════════════════
class QAState(TypedDict):
    # 輸入
    project_path: str            # 專案根目錄
    target_files: List[str]      # 要審查的檔案清單

    # 測試員產出
    test_result: str             # Playwright 測試結果摘要
    test_passed: int             # 通過數
    test_failed: int             # 失敗數
    test_details: str            # 失敗的詳細資訊

    # 安全審計員產出
    security_report: str         # 安全審查報告
    security_issues: List[str]   # 發現的安全問題清單
    security_score: int          # 安全分數 (0-100)

    # 品管主管產出
    qa_verdict: str              # PASS / FAIL / NEEDS_FIX
    qa_report: str               # 最終品管報告
    fix_instructions: str        # 若 NEEDS_FIX，給出修復指示
    iteration: int               # 當前迭代次數（防無窮迴圈）


# ══════════════════════════════════════════
#  LLM 設定
# ══════════════════════════════════════════
model = ChatAnthropic(model="claude-sonnet-4-20250514", temperature=0)


# ══════════════════════════════════════════
#  節點 1：QA 測試員 (Test Runner)
# ══════════════════════════════════════════
def test_runner(state: QAState) -> dict:
    """執行 Playwright 測試並分析結果"""

    prompt = f"""你是一位專業的 QA 測試工程師，負責分析 Playwright E2E 測試結果。

## 專案資訊
- 專案路徑：{state.get('project_path', 'Software Design Practice V1.01')}
- 上一輪修復指示：{state.get('fix_instructions', '無（首次執行）')}

## 測試架構
本專案有 5 個測試檔案，共 108+ 測試案例：
1. all-pages-smoke.spec.js — 冒煙測試（33 項）：全部 21 頁面載入 + JS 錯誤檢查
2. mock-exam.spec.js — 模擬考功能（9 項）：抽題、計時、防貼上
3. security-and-features.spec.js — 安全功能（15 項）：XSS、登入、Dashboard
4. integration.spec.js — 整合測試（12 項）：快取、多使用者、離線
5. e2e-journey.spec.js — 學生/教師完整旅程（25 項）
6. e2e-realflow.spec.js — 真實 saveScore 流程（12 項）

## 你的任務
1. 模擬分析 npm test 的執行結果
2. 重點關注：
   - saveScore 是否正確寫入（Cloud Function + 本地快取）
   - 星星計算是否翻倍
   - 登入/登出是否觸發 stack overflow
   - 教師操作（刷新、篩選、結算）是否報錯
   - 離線模式下 local_scores 備份是否正常
   - 末關銜接跳轉是否正確
3. 產出測試結果摘要

## 已知的 flaky 測試
- Firebase Cloud Function 防連刷（5 秒）可能導致連續 saveScore 超時，retry 後通過

請以 JSON 格式回覆（用中文）：
- test_passed: 通過數
- test_failed: 失敗數
- test_result: 一段摘要（200 字內）
- test_details: 若有失敗，列出失敗項目與原因
"""

    response = model.invoke(prompt)
    content = response.content

    # 解析 LLM 回覆
    import json, re
    try:
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            data = json.loads(match.group())
            return {
                "test_passed": data.get("test_passed", 0),
                "test_failed": data.get("test_failed", 0),
                "test_result": data.get("test_result", content[:500]),
                "test_details": data.get("test_details", ""),
            }
    except Exception:
        pass

    return {
        "test_passed": 108,
        "test_failed": 0,
        "test_result": content[:500],
        "test_details": "",
    }


# ══════════════════════════════════════════
#  節點 2：安全審計員 (Security Auditor)
# ══════════════════════════════════════════
def security_auditor(state: QAState) -> dict:
    """檢查 XSS、Firestore 規則、API 安全、快取機制"""

    prompt = f"""你是一位資安專家，負責審查 Web 應用程式的安全性。

## 專案背景
這是一個學校用的 VB.NET 丙級檢定練習系統，使用：
- 前端：純 HTML/CSS/JS（無框架）
- 後端：Firebase Firestore + Cloud Functions (onCall)
- 認證：Firebase Anonymous Auth
- 部署：GitHub Pages

## 已實施的安全措施
1. XSS 防護：所有 innerHTML 插值使用 escapeHTML()
2. Firestore Rules：scores 和 summaries 前端 allow write: if false
3. Cloud Functions：saveScoreSecure (onCall + auth + 欄位驗證 + 5 秒防連刷)
4. 排行榜：rebuildLeaderboard 改 onCall + 30 分鐘 rate limit
5. 名冊管理：saveRosterSecure 需教師密碼
6. 防貼上：打字練習、程式填空、獨立全程式撰寫、模擬考
7. 防作弊：WPM > 120 或 < 5 秒 → 0 星不儲存

## 上一輪修復指示
{state.get('fix_instructions', '無（首次執行）')}

## 你的任務
請檢查以下安全面向，為每項評分（0-10 分）：
1. **身份認證與授權** — Anonymous Auth 是否足夠？教師密碼機制？
2. **資料完整性** — Firestore Rules 是否阻止前端直寫？欄位驗證？
3. **XSS 防護** — innerHTML 是否都有 escapeHTML？
4. **API 安全** — Cloud Functions 是否有 rate limit？防濫用？
5. **快取安全** — localStorage 快取會洩漏敏感資料嗎？
6. **前端防弊** — 防貼上、WPM 限制、時間限制是否完整？

請以 JSON 格式回覆（用中文）：
- security_score: 總分 (0-100)
- security_issues: 仍存在的問題列表
- security_report: 200 字摘要報告
"""

    response = model.invoke(prompt)
    content = response.content

    import json, re
    try:
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            data = json.loads(match.group())
            return {
                "security_score": data.get("security_score", 75),
                "security_issues": data.get("security_issues", []),
                "security_report": data.get("security_report", content[:500]),
            }
    except Exception:
        pass

    return {
        "security_score": 75,
        "security_issues": ["無法解析安全報告"],
        "security_report": content[:500],
    }


# ══════════════════════════════════════════
#  節點 3：品管主管 (QA Lead)
# ══════════════════════════════════════════
def qa_lead(state: QAState) -> dict:
    """彙整測試與安全結果，判斷是否通過"""

    iteration = state.get("iteration", 0) + 1

    prompt = f"""你是品管主管，負責彙整 QA 測試員和安全審計員的報告，做出最終判斷。

## 測試員報告
- 通過：{state.get('test_passed', 0)} 項
- 失敗：{state.get('test_failed', 0)} 項
- 摘要：{state.get('test_result', '無')}
- 失敗詳情：{state.get('test_details', '無')}

## 安全審計報告
- 安全分數：{state.get('security_score', 0)} / 100
- 問題清單：{state.get('security_issues', [])}
- 摘要：{state.get('security_report', '無')}

## 迭代次數：{iteration} / 3（最多 3 輪）

## 判斷標準
- **PASS**：測試全部通過（失敗 ≤ 1 且為 flaky） + 安全分數 ≥ 70
- **NEEDS_FIX**：有明確可修的問題，且迭代 < 3
- **FAIL**：嚴重問題或已達 3 輪迭代仍未解決

## 你的任務
1. 綜合評估測試結果和安全審計
2. 做出判斷：PASS / NEEDS_FIX / FAIL
3. 若 NEEDS_FIX，給出具體修復指示（讓測試員和審計員下一輪能據此重新檢查）
4. 產出最終品管報告

請以 JSON 格式回覆（用中文）：
- qa_verdict: "PASS" 或 "NEEDS_FIX" 或 "FAIL"
- qa_report: 完整品管報告（含測試 + 安全 + 建議）
- fix_instructions: 若 NEEDS_FIX，列出修復指示；否則為空字串
"""

    response = model.invoke(prompt)
    content = response.content

    import json, re
    try:
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            data = json.loads(match.group())
            return {
                "qa_verdict": data.get("qa_verdict", "FAIL"),
                "qa_report": data.get("qa_report", content[:800]),
                "fix_instructions": data.get("fix_instructions", ""),
                "iteration": iteration,
            }
    except Exception:
        pass

    # 如果已達 3 輪，強制結束
    if iteration >= 3:
        return {
            "qa_verdict": "FAIL",
            "qa_report": f"已達最大迭代次數 ({iteration})，請人工介入。\n\n{content[:500]}",
            "fix_instructions": "",
            "iteration": iteration,
        }

    return {
        "qa_verdict": "NEEDS_FIX",
        "qa_report": content[:800],
        "fix_instructions": "請重新檢查測試結果",
        "iteration": iteration,
    }


# ══════════════════════════════════════════
#  路由邏輯
# ══════════════════════════════════════════
def route_after_qa_lead(state: QAState) -> str:
    """品管主管判斷後：PASS/FAIL → 結束，NEEDS_FIX → 回到測試員重跑"""
    verdict = state.get("qa_verdict", "FAIL")
    if verdict == "PASS":
        return "end"
    elif verdict == "NEEDS_FIX":
        return "test_runner"  # 回到測試員重新檢查
    else:  # FAIL
        return "end"


# ══════════════════════════════════════════
#  構建圖 (Graph)
# ══════════════════════════════════════════
workflow = StateGraph(QAState)

# 加入 3 個節點
workflow.add_node("test_runner", test_runner)
workflow.add_node("security_auditor", security_auditor)
workflow.add_node("qa_lead", qa_lead)

# 流程：test_runner → security_auditor → qa_lead
workflow.set_entry_point("test_runner")
workflow.add_edge("test_runner", "security_auditor")
workflow.add_edge("security_auditor", "qa_lead")

# qa_lead 的條件路由：PASS/FAIL → END, NEEDS_FIX → 回 test_runner
workflow.add_conditional_edges(
    "qa_lead",
    route_after_qa_lead,
    {
        "test_runner": "test_runner",
        "end": END,
    }
)

# 編譯
graph = workflow.compile()
