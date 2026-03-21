import os
import re

html_files = [f for f in os.listdir('pages') if f.endswith('.html') and f != 'map.html']

insertion_html = '        <button class="btn btn-primary" id="btn-next-level" style="display:none; background: linear-gradient(90deg, #4ade80, #10b981); color: #fff; border: none; white-space: nowrap;">⏭️ 下一關</button>'

for fname in html_files:
    filepath = os.path.join('pages', fname)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if it already has the hardcoded button
    if 'id="btn-next-level"' in content:
        continue
        
    # Find btn-again and insert after it, only if it exists
    if 'id="btn-again"' in content:
        # Regex to find the <button... id="btn-again">...</button> line
        replaced = re.sub(r'(<button[^>]+id="btn-again"[^>]*>.*?</button>\s*\n)', r'\1' + insertion_html + '\n', content)
        if replaced != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(replaced)
            print(f"Injected hardcoded nextBtn into {fname}")
