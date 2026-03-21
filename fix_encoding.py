import sys

file_path = 'pages/記憶翻牌遊戲.html'
with open(file_path, 'r', encoding='utf-8') as f:
    bad_text = f.read()

encodings_to_test = ['cp1252', 'cp1250', 'cp950', 'latin1', 'mbcs']
fixed = False

for enc in encodings_to_test:
    try:
        raw_bytes = bad_text.encode(enc)
        good_text = raw_bytes.decode('utf-8')
        if '記憶翻牌遊戲' in good_text or '軟體設計丙級' in good_text or '迴文判斷' in good_text:
            print(f"Successfully reversed using {enc}!")
            with open(file_path, 'w', encoding='utf-8') as out_f:
                out_f.write(good_text)
            fixed = True
            break
    except Exception as e:
        pass

if not fixed:
    print('Failed to reverse mojibake automatically. Will use heuristic replacement if possible.')
    # It might be double-encoded or mangled by CRLF.
