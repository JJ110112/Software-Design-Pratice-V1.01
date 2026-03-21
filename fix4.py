with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace literal backslash-n with real newline at the end of the blocks
text = text.replace(']\\n        }', ']\n        }')

with open('js/quiz_data.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("FIX 4 DONE")
