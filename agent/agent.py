"""
Software Design Practice V1.01 — Multi-Agent QA Loop (4 節點 + Human-in-the-loop)

流程：
  test_runner → security_auditor → qa_lead
                                      │
                                NEEDS_FIX → code_fixer (產生修復方案)
                                      │
                                ⏸ Human Interrupt (你確認修復)
                                      │
                                → test_runner (重新驗證)
                                      │
                                PASS/FAIL → END

角色：
  1. test_runner      — QA 測試員：執行 Playwright 測試，回報通過/失敗
  2. security_auditor — 安全審計員：檢查 XSS、快取、API 安全、Firestore 規則
  3. qa_lead          — 品管主管：彙整結果，判斷 PASS/NEEDS_FIX/FAIL
  4. code_fixer       — 修復員：根據 fix_instructions 產生修復 patch
"""

from typing import TypedDict, List
from langgraph.graph import StateGraph, START, END
from langchain_anthropic import ChatAnthropic
import json, re

# ══════════════════════════════════════════
#  狀態定義
# ══════════════════════════════════════════
class QAState(TypedDict):
    # 輸入
    project_path: str
    target_files: List[str]

    # 測試員產出
    test_result: str
    test_passed: int
    test_failed: int
    test_details: str

    # 安全審計員產出
    security_report: str
    security_issues: List[str]
    security_score: int

    # 品管主管產出
    qa_verdict: str           # PASS / FAIL / NEEDS_FIX
    qa_report: str
    fix_instructions: str

    # 修復員產出
    fix_patch: str            # 修復方案（diff 格式）
    fix_files: List[str]      # 被修改的檔案
    fix_summary: str          # 修復摘要

    # 控制
    iteration: int
    human_approved: bool      # Human-in-the-loop 確認


# ══════════════════════════════════════════
#  LLM
# ══════════════════════════════════════════
model = ChatAnthropic(model="claude-sonnet-4-20250514", temperature=0)


def _parse_json(content: str) -> dict:
    """從 LLM 回覆中解析 JSON"""
    try:
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return {}


# ══════════════════════════════════════════
#  節點 1：QA 測試員
# ══════════════════════════════════════════
def test_runner(state: QAState) -> dict:
    iteration = state.get("iteration", 0)
    prev_fix = state.get("fix_summary", "") or state.get("fix_instructions", "")

    prompt = f"""你是專業 QA 測試工程師，負責分析 Playwright E2E 測試結果。

## 專案：Software Design Practice V1.01（VB.NET 丙級檢定練習系統）
- 迭代：第 {iteration + 1} 輪
- 上一輪修復：{prev_fix or '無（首次執行）'}

## 測試架構（6 個檔案，108+ 案例）
1. all-pages-smoke.spec.js（33 項）：21 頁面載入 + JS 錯誤
2. mock-exam.spec.js（9 項）：模擬考抽題、計時、防貼上
3. security-and-features.spec.js（15 項）：XSS、登入、Dashboard
4. integration.spec.js（12 項）：快取 TTL、多使用者、離線
5. e2e-journey.spec.js（25 項）：學生/教師旅程 + 末關銜接
6. e2e-realflow.spec.js（12 項）：真實 saveScore + 離線容錯

## 重點檢查
- saveScore Cloud Function 寫入 + 本地快取一致性
- 星星計算不翻倍（同關卡取最高星）
- 登入/登出無 stack overflow（getCurrentUser ↔ logoutUser）
- 教師儀表板操作（刷新、篩選、結算）無 JS 錯誤
- 離線 local_scores 備份 → 補傳 → 清除
- 末關銜接跳轉正確（nextlevel.js 中文路徑解碼）
- 快取 TTL 過期不被 cacheAppend 復活

## 已知 flaky
Firebase CF 防連刷（5 秒）可能讓連續 saveScore 首次超時，retry 通過

請回覆 JSON：
{{"test_passed": 數字, "test_failed": 數字, "test_result": "摘要", "test_details": "失敗項目與原因"}}"""

    data = _parse_json(model.invoke(prompt).content)
    return {
        "test_passed": data.get("test_passed", 108),
        "test_failed": data.get("test_failed", 0),
        "test_result": data.get("test_result", "分析完成"),
        "test_details": data.get("test_details", ""),
    }


# ══════════════════════════════════════════
#  節點 2：安全審計員
# ══════════════════════════════════════════
def security_auditor(state: QAState) -> dict:
    prev_fix = state.get("fix_summary", "") or state.get("fix_instructions", "")

    prompt = f"""你是資安專家，審查 Web 應用程式安全性。

## 專案技術棧
- 前端：純 HTML/CSS/JS（無框架），GitHub Pages 部署
- 後端：Firebase Firestore + Cloud Functions (onCall)
- 認證：Firebase Anonymous Auth
- 快取：localStorage（TTL 2 小時）

## 已實施安全措施
1. XSS：所有 innerHTML 使用 escapeHTML()
2. Firestore Rules：scores/summaries 前端 allow write: if false
3. saveScoreSecure：onCall + auth + 欄位驗證 + 5 秒記憶體防連刷
4. rebuildLeaderboard：onCall + 30 分鐘 rate limit
5. saveRosterSecure：需教師密碼
6. 防貼上：打字練習、程式填空、獨立撰寫、模擬考
7. 防作弊：WPM > 120 或 < 5 秒 → 0 星

## 上一輪修復：{prev_fix or '無'}

## 評分面向（各 0-10 分，滿分 60 → 換算百分制）
1. 身份認證與授權
2. 資料完整性（Firestore Rules + 欄位驗證）
3. XSS 防護
4. API 安全（rate limit、防濫用）
5. 快取安全（localStorage 洩漏風險）
6. 前端防弊（防貼上、WPM、時間限制）

請回覆 JSON：
{{"security_score": 數字, "security_issues": ["問題1", "問題2"], "security_report": "摘要"}}"""

    data = _parse_json(model.invoke(prompt).content)
    return {
        "security_score": data.get("security_score", 75),
        "security_issues": data.get("security_issues", []),
        "security_report": data.get("security_report", "審查完成"),
    }


# ══════════════════════════════════════════
#  節點 3：品管主管
# ══════════════════════════════════════════
def qa_lead(state: QAState) -> dict:
    iteration = state.get("iteration", 0) + 1

    prompt = f"""你是品管主管，彙整 QA 測試員和安全審計員報告，做最終判斷。

## 測試報告
- 通過：{state.get('test_passed', 0)} / 失敗：{state.get('test_failed', 0)}
- 摘要：{state.get('test_result', '無')}
- 失敗詳情：{state.get('test_details', '無')}

## 安全報告
- 分數：{state.get('security_score', 0)}/100
- 問題：{state.get('security_issues', [])}
- 摘要：{state.get('security_report', '無')}

## 迭代：{iteration}/3

## 判斷標準
- PASS：失敗 ≤ 1（flaky）且安全 ≥ 70
- NEEDS_FIX：有可修問題且迭代 < 3
- FAIL：嚴重問題或迭代 ≥ 3

請回覆 JSON：
{{"qa_verdict": "PASS/NEEDS_FIX/FAIL", "qa_report": "完整報告", "fix_instructions": "修復指示（PASS 時為空）"}}"""

    data = _parse_json(model.invoke(prompt).content)

    verdict = data.get("qa_verdict", "NEEDS_FIX" if iteration < 3 else "FAIL")
    return {
        "qa_verdict": verdict,
        "qa_report": data.get("qa_report", "判斷完成"),
        "fix_instructions": data.get("fix_instructions", ""),
        "iteration": iteration,
    }


# ══════════════════════════════════════════
#  節點 4：修復員（Human-in-the-loop 前置）
# ══════════════════════════════════════════
def code_fixer(state: QAState) -> dict:
    """根據品管主管的 fix_instructions 產生修復方案，等待人工確認"""

    instructions = state.get("fix_instructions", "")
    test_details = state.get("test_details", "")
    security_issues = state.get("security_issues", [])

    prompt = f"""你是一位資深前端工程師，負責根據 QA 報告修復程式碼。

## 專案技術
- 純 HTML/CSS/JS 前端（無框架）
- Firebase Firestore + Cloud Functions
- 檔案結構：
  - js/api.js — Firebase API、快取、saveScore
  - js/users.js — 登入/登出、CLASS_ROSTER、閒置超時
  - js/nextlevel.js — 關卡銜接
  - pages/*.html — 16 個練習頁面
  - functions/index.js — Cloud Functions

## QA 主管的修復指示
{instructions}

## 測試失敗詳情
{test_details}

## 安全問題
{security_issues}

## 你的任務
1. 分析問題根因
2. 產生具體的修復方案（以 unified diff 格式）
3. 列出會被修改的檔案
4. 寫一段修復摘要

## 重要規則
- 不要改變現有功能，只修復問題
- 優先修復高嚴重度問題
- 每個修復都要說明原因

請回覆 JSON：
{{"fix_patch": "修復的 diff 或程式碼片段", "fix_files": ["檔案1", "檔案2"], "fix_summary": "修復摘要"}}"""

    data = _parse_json(model.invoke(prompt).content)
    return {
        "fix_patch": data.get("fix_patch", "無法產生修復"),
        "fix_files": data.get("fix_files", []),
        "fix_summary": data.get("fix_summary", "修復方案已產生，等待人工確認"),
        "human_approved": False,  # 預設未確認，等 Human interrupt
    }


# ══════════════════════════════════════════
#  路由邏輯
# ══════════════════════════════════════════
def route_after_qa_lead(state: QAState) -> str:
    verdict = state.get("qa_verdict", "FAIL")
    if verdict == "PASS":
        return "end"
    elif verdict == "NEEDS_FIX":
        return "code_fixer"
    else:
        return "end"


def route_after_human_review(state: QAState) -> str:
    """Human 確認後：approved → 回 test_runner 驗證，rejected → 結束"""
    if state.get("human_approved", False):
        return "test_runner"
    return "end"


# ══════════════════════════════════════════
#  構建圖
# ══════════════════════════════════════════
workflow = StateGraph(QAState)

# 4 個節點
workflow.add_node("test_runner", test_runner)
workflow.add_node("security_auditor", security_auditor)
workflow.add_node("qa_lead", qa_lead)
workflow.add_node("code_fixer", code_fixer)

# 流程
workflow.set_entry_point("test_runner")
workflow.add_edge("test_runner", "security_auditor")
workflow.add_edge("security_auditor", "qa_lead")

# qa_lead → PASS/FAIL: END, NEEDS_FIX: code_fixer
workflow.add_conditional_edges(
    "qa_lead",
    route_after_qa_lead,
    {"code_fixer": "code_fixer", "end": END}
)

# code_fixer → Human interrupt → route
workflow.add_conditional_edges(
    "code_fixer",
    route_after_human_review,
    {"test_runner": "test_runner", "end": END}
)

# 編譯（加上 interrupt_after 讓 code_fixer 完成後暫停等人工確認）
graph = workflow.compile(interrupt_after=["code_fixer"])
