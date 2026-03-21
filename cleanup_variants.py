import re

with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    c = f.read()

# The insertion was:
# f',\\n        variant_match_results: {{\\n            "T02": {t2},\\n            "T03": {t3}\\n        }}'
# We want to remove it.
# It starts with `,\n        variant_match_results: {\n            "T02": `
# And ends with `\n        }` (with exactly 8 spaces indent)
# Let's define the pattern carefully:
pattern = r',\n\s*variant_match_results: \{\n\s*"T02": \[.*?"T03": \[.*?\n\s*\}\n'
# But `t3` itself might end in `]` which is indented. The insertion ends with:
# `\n        }`
# We can find the exact indices.
while True:
    idx = c.find(',\n        variant_match_results: {')
    if idx == -1:
        break
    # Find the matching closing brace for this `variant_match_results: {`
    open_braces = 0
    in_str = False
    escape = False
    end_idx = -1
    for i in range(idx + len(',\n        variant_match_results: '), len(c)):
        char = c[i]
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
        if char == '"' or char == "'":
            # simple toggle (ignores that " and ' are different, but good enough for well formed JS)
            # Actually let's just use strict stack:
            pass
    
    # Actually, a simpler regex because the syntax error broke the file, but `,\n        variant_match_results: {\n            "T02": ` is unique.
    # The end of the insertion is exactly `\n        }` followed by whatever was after `orig_match.group(0)` (which was usually `, \n "bug_tests"` etc).
    # Since I just ran this command 5 minutes ago, I could also just look at git diff if I made a git commit? But I'm not in a git repo.

# Let's try splitting by `,\n        variant_match_results: {\n            "T02": `
parts = c.split(',\n        variant_match_results: {\n            "T02": ')
if len(parts) > 1:
    new_c = parts[0]
    for i in range(1, len(parts)):
        # Each part[i] starts with the t2 array.
        # We need to find the specific `\n        }` that closes the insertion.
        # Look for `"T03": `
        t03_idx = parts[i].find('"T03": ')
        if t03_idx != -1:
            # from t03_idx, find the closing `] }`
            # since `t3` is an array `[...]`, it ends with `]`. Then my insertion adds `\n        }`
            end_seq_idx = parts[i].find(']\n        }', t03_idx)
            if end_seq_idx != -1:
                # Append the rest of this part
                new_c += parts[i][end_seq_idx + len(']\n        }'):]
            else:
                print("Could not find end of T03 for part", i)
        else:
            print("Could not find T03 for part", i)
    
    with open('js/quiz_data.js', 'w', encoding='utf-8') as f:
        f.write(new_c)
    print("Cleaned up variant_match_results!")
else:
    print("No variant_match_results found during cleanup.")
