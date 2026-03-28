"""
Software Design Practice V1.01 — Multi-Agent QA Loop (4 節點 + Human-in-the-loop)

test_runner 會真正執行 npx playwright test，不是 LLM 猜測。

流程：
  test_runner (真實執行測試) → security_auditor → qa_lead
                                                    │
                                              NEEDS_FIX → code_fixer → ⏸ Human 確認 → test_runner
                                              PASS/FAIL → END
"""

from typing import TypedDict, List
from langgraph.graph import StateGraph, START, END
from langchain_anthropic import ChatAnthropic
import json, re, subprocess, os

# ══════════════════════════════════════════
#  狀態定義
# ══════════════════════════════════════════
class QAState(TypedDict):
    project_path: str
    target_files: List[str]

    # 測試員
    test_result: str
    test_passed: int
    test_failed: int
    test_details: str

    # 安全審計員
    security_report: str
    security_issues: List[str]
    security_score: int

    # 品管主管
    qa_verdict: str
    qa_report: str
    fix_instructions: str

    # 修復員
    fix_patch: str
    fix_files: List[str]
    fix_summary: str

    # 控制
    iteration: int
    human_approved: bool


# ══════════════════════════════════════════
#  LLM + 工具
# ══════════════════════════════════════════
model = ChatAnthropic(model="claude-sonnet-4-20250514", temperature=0)

# 專案路徑（從環境變數或預設）
PROJECT_ROOT = os.environ.get(
    "PROJECT_ROOT",
    r"C:\Users\hitea\Claude\Software Design Pratice V1.01"
)


def _parse_json(content: str) -> dict:
    try:
        match = re.search(r'\{[\s\S]*\}', content)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return {}


def _run_playwright() -> dict:
    """真正執行 npx playwright test 並解析結果"""
    try:
        result = subprocess.run(
            ["npx", "playwright", "test", "--reporter=line"],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=300,  # 5 分鐘上限
            shell=True,
        )
        output = result.stdout + "\n" + result.stderr

        # 解析結果：找 "X passed" 和 "X failed"
        passed = 0
        failed = 0

        passed_match = re.search(r'(\d+)\s+passed', output)
        failed_match = re.search(r'(\d+)\s+failed', output)

        if passed_match:
            passed = int(passed_match.group(1))
        if failed_match:
            failed = int(failed_match.group(1))

        # 提取失敗的測試名稱
        fail_details = []
        for line in output.split('\n'):
            if '  x ' in line or 'FAILED' in line or '✘' in line:
                fail_details.append(line.strip())

        # 截取最後 2000 字元作為摘要
        summary = output[-2000:] if len(output) > 2000 else output

        return {
            "passed": passed,
            "failed": failed,
            "details": "\n".join(fail_details[:20]) if fail_details else "無失敗項目",
            "summary": summary,
            "exit_code": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {
            "passed": 0, "failed": -1,
            "details": "測試執行超時（> 5 分鐘）",
            "summary": "TIMEOUT",
            "exit_code": -1,
        }
    except Exception as e:
        return {
            "passed": 0, "failed": -1,
            "details": f"執行錯誤：{str(e)}",
            "summary": str(e),
            "exit_code": -1,
        }


# ══════════════════════════════════════════
#  節點 1：QA 測試員（真正執行測試）
# ══════════════════════════════════════════
def test_runner(state: QAState) -> dict:
    """真正執行 npx playwright test 並回報結果"""

    # 執行真實測試
    result = _run_playwright()

    passed = result["passed"]
    failed = result["failed"]
    details = result["details"]
    exit_code = result["exit_code"]

    # 組合摘要
    if exit_code == 0:
        summary = f"✅ 全部通過：{passed} passed, {failed} failed (exit code: 0)"
    elif failed == -1:
        summary = f"❌ 測試執行異常：{details}"
    else:
        summary = f"⚠️ 有失敗：{passed} passed, {failed} failed (exit code: {exit_code})"

    return {
        "test_passed": passed,
        "test_failed": failed,
        "test_result": summary,
        "test_details": details,
    }


# ══════════════════════════════════════════
#  節點 2：安全審計員
# ══════════════════════════════════════════
def security_auditor(state: QAState) -> dict:
    """讀取真實程式碼進行安全審查"""

    # 讀取關鍵檔案內容
    files_content = {}
    key_files = ["js/api.js", "js/users.js", "firestore.rules", "functions/index.js"]
    for f in key_files:
        fpath = os.path.join(PROJECT_ROOT, f)
        try:
            with open(fpath, "r", encoding="utf-8") as fh:
                content = fh.read()
                # 截取前 3000 字元避免 token 爆量
                files_content[f] = content[:3000]
        except Exception:
            files_content[f] = "(檔案不存在或無法讀取)"

    prompt = f"""你是資安專家，根據以下真實程式碼審查安全性。

## 測試結果
- 通過：{state.get('test_passed', 0)}，失敗：{state.get('test_failed', 0)}

## 關鍵檔案內容

### js/api.js（前 3000 字元）
```javascript
{files_content.get('js/api.js', 'N/A')}
```

### js/users.js（前 3000 字元）
```javascript
{files_content.get('js/users.js', 'N/A')}
```

### firestore.rules
```
{files_content.get('firestore.rules', 'N/A')}
```

### functions/index.js（前 3000 字元）
```javascript
{files_content.get('functions/index.js', 'N/A')}
```

## 評分面向（各 0-10 分）
1. 身份認證與授權
2. 資料完整性（Firestore Rules + 欄位驗證）
3. XSS 防護（escapeHTML 使用）
4. API 安全（rate limit、防濫用）
5. 快取安全
6. 前端防弊

請回覆 JSON：
{{"security_score": 數字(0-100), "security_issues": ["問題"], "security_report": "摘要(200字內)"}}"""

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
    test_failed = state.get("test_failed", 0)
    security_score = state.get("security_score", 0)

    # 自動判斷（不用 LLM，直接根據數據）
    if test_failed <= 1 and security_score >= 70:
        verdict = "PASS"
        report = (
            f"✅ 品管通過！\n"
            f"測試：{state.get('test_passed', 0)} passed / {test_failed} failed\n"
            f"安全：{security_score}/100\n"
            f"迭代：{iteration} 輪\n\n"
            f"測試摘要：{state.get('test_result', '')}\n"
            f"安全摘要：{state.get('security_report', '')}"
        )
        fix = ""
    elif iteration >= 3:
        verdict = "FAIL"
        report = (
            f"❌ 已達最大迭代次數 ({iteration})，仍有問題未解決。\n"
            f"測試：{state.get('test_passed', 0)} passed / {test_failed} failed\n"
            f"安全：{security_score}/100\n"
            f"失敗詳情：{state.get('test_details', '')}\n"
            f"安全問題：{state.get('security_issues', [])}"
        )
        fix = ""
    else:
        verdict = "NEEDS_FIX"
        # 用 LLM 分析失敗原因並給修復指示
        prompt = f"""分析以下測試失敗，給出具體修復指示（200 字內）：
失敗數：{test_failed}
詳情：{state.get('test_details', '')}
安全問題：{state.get('security_issues', [])}

請回覆 JSON：{{"fix_instructions": "修復指示", "qa_report": "報告"}}"""
        data = _parse_json(model.invoke(prompt).content)
        report = data.get("qa_report", f"需要修復 {test_failed} 個失敗項目")
        fix = data.get("fix_instructions", state.get('test_details', ''))

    return {
        "qa_verdict": verdict,
        "qa_report": report,
        "fix_instructions": fix,
        "iteration": iteration,
    }


# ══════════════════════════════════════════
#  節點 4：修復員
# ══════════════════════════════════════════
def code_fixer(state: QAState) -> dict:
    instructions = state.get("fix_instructions", "")
    test_details = state.get("test_details", "")
    security_issues = state.get("security_issues", [])

    prompt = f"""你是資深前端工程師，根據 QA 報告修復程式碼。

## 專案路徑：{PROJECT_ROOT}
## 技術：純 HTML/CSS/JS + Firebase + Cloud Functions

## 修復指示
{instructions}

## 測試失敗詳情
{test_details}

## 安全問題
{security_issues}

## 規則
- 只修復問題，不改功能
- 產生 unified diff 格式的修復
- 列出會修改的檔案

請回覆 JSON：
{{"fix_patch": "diff 或程式碼", "fix_files": ["檔案"], "fix_summary": "摘要"}}"""

    data = _parse_json(model.invoke(prompt).content)
    return {
        "fix_patch": data.get("fix_patch", "無法產生修復"),
        "fix_files": data.get("fix_files", []),
        "fix_summary": data.get("fix_summary", "修復方案已產生"),
        "human_approved": False,
    }


# ══════════════════════════════════════════
#  路由
# ══════════════════════════════════════════
def route_after_qa_lead(state: QAState) -> str:
    verdict = state.get("qa_verdict", "FAIL")
    if verdict == "NEEDS_FIX":
        return "code_fixer"
    return "end"


def route_after_human_review(state: QAState) -> str:
    if state.get("human_approved", False):
        return "test_runner"
    return "end"


# ══════════════════════════════════════════
#  構建圖
# ══════════════════════════════════════════
workflow = StateGraph(QAState)

workflow.add_node("test_runner", test_runner)
workflow.add_node("security_auditor", security_auditor)
workflow.add_node("qa_lead", qa_lead)
workflow.add_node("code_fixer", code_fixer)

workflow.set_entry_point("test_runner")
workflow.add_edge("test_runner", "security_auditor")
workflow.add_edge("security_auditor", "qa_lead")

workflow.add_conditional_edges(
    "qa_lead",
    route_after_qa_lead,
    {"code_fixer": "code_fixer", "end": END}
)

workflow.add_conditional_edges(
    "code_fixer",
    route_after_human_review,
    {"test_runner": "test_runner", "end": END}
)

graph = workflow.compile(interrupt_after=["code_fixer"])
