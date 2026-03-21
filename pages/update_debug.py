import re

file_path = 'pages/錯誤找找看.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\r\n', '\n')

target_html = '''    <!-- Context line numbers -->
    <div class="code-line-wrap">
      <div class="code-context" id="code-context">第 ? 行（Q1 程式）</div>
      <div class="code-display" id="code-display">'''

replace_html = '''    <!-- Context line numbers -->
    <div class="code-line-wrap">
      <div class="code-context" id="code-context">第 ? 行（Q1 程式）</div>
      <div id="code-zh-hint" style="color: #4ade80; font-weight: 700; margin-bottom: 15px; font-size: 1.15rem; text-align: center; letter-spacing: 0.5px;"></div>
      <div class="code-display" id="code-display">'''

content = content.replace(target_html, replace_html)

target_js = '''  document.getElementById('code-context').textContent = q.lineNum + `（${qID} 程式）`;

  // Build token elements
  const display = document.getElementById('code-display');'''

replace_js = '''  document.getElementById('code-context').textContent = q.lineNum + `（${qID} 程式）`;

  // Auto-find Chinese translation from generateSteps
  const steps = typeof generateSteps === 'function' ? generateSteps(qID, tID) : [];
  let matchLine = steps.find(s => s.code.trim() === q.correct.trim() || s.hint.trim() === q.correct.trim());
  if (!matchLine) {
      matchLine = steps.find(s => s.code.includes(q.correct) || s.hint.includes(q.correct));
  }
  const zhDesc = matchLine ? matchLine.zh : "（請從程式碼上下文判斷此行邏輯）";
  const hintEl = document.getElementById('code-zh-hint');
  if (hintEl) {
      hintEl.textContent = "🎯 目標邏輯：" + zhDesc;
  }

  // Build token elements
  const display = document.getElementById('code-display');'''

content = content.replace(target_js, replace_js)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated {file_path}")
