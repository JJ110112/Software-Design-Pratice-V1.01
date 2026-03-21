import re

with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# The end of the injected block looks like:
#             ]\n        }
# We need to replace the literal \n with a real newline.
# \\\\n represents literal \n in python regex string.
text = re.sub(r']\\\\n\s+}', ']\\n        }', text)

with open('js/quiz_data.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("CLEANUP END STRINGS DONE")
