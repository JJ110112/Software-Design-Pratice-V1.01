import re

with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace ],\n (where \n is literally backslash and n) with ],\n (a real newline character)
text = text.replace('],\\n        variant_match_results: {', '],\\n        variant_match_results: {'.replace('\\\\n', '\\n'))

# Wait! Let's do it even simpler:
text = text.replace('],\\n        variant_m', '],\\n        variant_m')
# The python representation of ],[backslash][n] is '],\\\\n'!!
# Let me use regex to be safe:
# Replace a literal backslash followed by n followed by spaces and variant_match
text = re.sub(r'],\\\\n\\s+variant_match_results: \\{', '],\\n        variant_match_results: {', text)

with open('js/quiz_data.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("CLEANUP DONE")
