import re

with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We look for the literal strings that contain `\n` (slash + n)
# The injection was exactly:
# insertion = r',\n        variant_match_results: {\n            "T02": '
# WAIT! In python, f',\\n' generates `,` `\` `n`.
# So the literal string in the file is `,\n        variant_match_results: {\n            "T02": `
# Let's find this exactly.

idx = 0
while True:
    start_idx = text.find(',\\n        variant_match_results: {\\n            "T02": ')
    if start_idx == -1:
        break
    
    # Let's just use the brace counting script, but pointing past `{`
    brace_start = text.find('{', start_idx)
    open_braces = 0
    in_str = False
    escape = False
    end_idx = -1
    for i in range(brace_start, len(text)):
        char = text[i]
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
        if char in ('"', "'"):
            if not in_str:
                in_str = char
            elif in_str == char:
                in_str = False
            continue
        
        if not in_str:
            if char == '{':
                open_braces += 1
            elif char == '}':
                open_braces -= 1
                if open_braces == 0:
                    end_idx = i + 1
                    break
    
    if end_idx != -1:
        text = text[:start_idx] + text[end_idx:]
    else:
        print("ERROR: Could not find matching brace")
        break

with open('js/quiz_data.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("SUCCESS: Removed malformed variant_match_results")
