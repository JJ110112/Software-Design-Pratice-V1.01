import re

with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# I injected `, \n variant_match_results: { \n "T02": `
# I will find every occurrence of `, \n variant_match_results:` and delete from there until I see `, "bug_tests"` or `, "Q"` ? No, my injection ended with `] \n }` which might be hard to find.

# Let's split by EXACT text that I injected.
# In `generate_match_variants.py`, I did:
# insertion = f',\\n        variant_match_results: {{\\n            "T02": {t2},\\n            "T03": {t3}\\n        }}'
# This means the inserted block literally starts with `,\n        variant_match_results: {\n            "T02": [`

# Since `t3` contains a lot of garbage, the `}` closing the variant_match_results is literally `\n        }` directly after `{t3}`.
# BUT wait! If `t3` ended with a `]` (the end of the array), then the string ends with `]\n        }`!
# Let's find exactly `,\n        variant_match_results: {\n            "T02": `
idx = 0
while True:
    start_idx = text.find(',\n        variant_match_results: {\n            "T02": ')
    if start_idx == -1:
        break
    
    # We need to find the specific `\n        }` that closes this block.
    # We can just count braces `{` and `}` properly!
    
    # Let's write a simple brace parser from `start_idx + len(',\n        variant_match_results: ')`
    # which points right at `{`.
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
print("SUCCESS")
