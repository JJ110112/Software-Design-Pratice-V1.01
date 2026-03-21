import re

file_path = 'pages/錯誤找找看.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\r\n', '\n')

# Restore the code-zh-hint div in HTML
target_html = '''    <!-- Context line numbers -->
    <div class="code-line-wrap">
      <div class="code-context" id="code-context">第 ? 行（Q1 迴文判斷程式）</div>
      <div class="code-display" id="code-display">'''

replace_html = '''    <!-- Context line numbers -->
    <div class="code-line-wrap">
      <div class="code-context" id="code-context">第 ? 行（Q1 迴文判斷程式）</div>
      <div id="code-zh-hint"></div>
      <div class="code-display" id="code-display">'''

content = content.replace(target_html, replace_html)

# Add CSS for code-zh-hint to <style> block if it's not already there exactly
css_target = '''#code-zh-hint {
  border: 1.5px solid #22c55e;
  color: #ef4444;
  padding: 4px 10px;
  align-self: flex-start;
  margin-bottom: 8px;
  font-size: 1.05rem;
  display: inline-block;
  white-space: nowrap;
  font-family: 'Noto Sans TC', sans-serif;
}'''

if css_target not in content:
    # Append it right before </style> or just after .code-line-wrap
    target_style = '''.game-section { padding: 0 12px 60px; max-width: 860px; margin: 0 auto; }'''
    if target_style in content:
        content = content.replace(target_style, target_style + '''\n\n#code-zh-hint { border: 1.5px solid #22c55e; color: #ef4444; padding: 4px 10px; align-self: flex-start; margin-bottom: 8px; font-size: 1.05rem; display: inline-block; white-space: nowrap; font-family: 'Noto Sans TC', sans-serif; }''')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Updated {file_path}")
