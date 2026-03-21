import re

with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

for q in ['Q1', 'Q2', 'Q3', 'Q4', 'Q5']:
    match = re.search(f'"{q}": {{.*?match_results:\s*\[(.*?)\]', text, re.DOTALL)
    if match:
        print(f'=== {q} ===')
        print(match.group(1).strip())
