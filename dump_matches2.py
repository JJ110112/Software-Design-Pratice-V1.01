import re
import json

with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

out = []
for q in ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']:
    match = re.search(f'"{q}": {{.*?match_results:\s*\[(.*?)\]', text, re.DOTALL)
    if match:
        out.append(f'=== {q} ===\n{match.group(1).strip()}\n')

with open('matches.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
