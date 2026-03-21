with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

# ']\n        }' in the console meant the file natively contains characters: ], \, n, space... }
# In python string literal, that sequence is written as ']\\n        }'
text = text.replace(']\\n        }', ']\\n        }'.replace('\\\\n', '\\n'))

with open('js/quiz_data.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("FIX 3 DONE")
