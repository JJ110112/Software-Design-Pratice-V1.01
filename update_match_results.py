import re
import json

updates = {
    'Q2': [
        {'code': 'Dim n = 3\\nFor i = 1 To n\\n  For j = 1 To i\\n    Console.Write(j)\\n  Next\\n  Console.WriteLine()\\nNext', 'result': '1\\n12\\n123'},
        {'code': 'Dim n = 3\\nFor i = 1 To n\\n  For j = 1 To n\\n    Console.Write(\\"*\\")\\n  Next\\n  Console.WriteLine()\\nNext', 'result': '***\\n***\\n***'},
        {'code': 'Dim n = 3\\nFor i = 1 To n\\n  For j = 1 To i\\n    Console.Write(\\"*\\")\\n  Next\\n  Console.WriteLine()\\nNext', 'result': '*\\n**\\n***'},
        {'code': 'Dim n = 3\\nFor i = n DownTo 1 Step -1\\n  For j = 1 To i\\n    Console.Write(j)\\n  Next\\n  Console.WriteLine()\\nNext', 'result': '123\\n12\\n1'}
    ],
    'Q3': [
        {'code': 'Dim n = 5\\nDim ans = \\"\\"\\nFor i = 2 To n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\nNext\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")', 'result': 'Y'},
        {'code': 'Dim n = 6\\nDim ans = \\"\\"\\nFor i = 2 To n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\nNext\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")', 'result': 'N'},
        {'code': 'Dim n = 7\\nDim ans = \\"\\"\\nFor i = 2 To n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\nNext\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")', 'result': 'Y'},
        {'code': 'Dim n = 9\\nDim ans = \\"\\"\\nFor i = 2 To n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\nNext\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")', 'result': 'N'}
    ],
    'Q4': [
        {'code': 'Dim w=2, h=3, d=4\\nDim vol = w * h * d\\nConsole.Write(\\"體積: \\" & vol)', 'result': '體積: 24'},
        {'code': 'Dim r=3\\nDim vol = (4/3) * 3.14 * r^3\\nConsole.Write(\\"球體積: \\" & Math.Round(vol,2))', 'result': '球體積: 113.04'},
        {'code': 'Dim r=2, h=5\\nDim vol = 3.14 * r^2 * h\\nConsole.Write(\\"圓柱體積: \\" & Math.Round(vol,2))', 'result': '圓柱體積: 62.8'},
        {'code': 'Dim a=5\\nDim vol = a^3\\nConsole.Write(\\"正方體積: \\" & vol)', 'result': '正方體積: 125'}
    ],
    'Q5': [
        {'code': 'Dim a() = {1, 3, 5, 7}\\nDim sum As Integer = 0\\nFor Each i In a\\n  sum += i\\nNext\\nPrint(sum)', 'result': '16'},
        {'code': 'Dim a() = {8, 2, 6, 4}\\nDim max As Integer = a(0)\\nFor Each i In a\\n  If i > max Then max = i\\nNext\\nPrint(max)', 'result': '8'},
        {'code': 'Dim a() = {8, 2, 6, 4}\\nDim min As Integer = a(0)\\nFor Each i In a\\n  If i < min Then min = i\\nNext\\nPrint(min)', 'result': '2'},
        {'code': 'Dim a() = {1, 2, 3, 4, 5}\\nDim c As Integer = 0\\nFor Each i In a\\n  If i Mod 2 = 0 Then c += 1\\nNext\\nPrint(c)', 'result': '2'}
    ],
    '1060306': [
        {'code': 'Dim ID = \\"A123456789\\"\\nIf ID Like \\"[A-Z]#########\\" Then\\n  Print(\\"格式正確\\")\\nElse\\n  Print(\\"格式錯誤\\")\\nEnd If', 'result': '格式正確'},
        {'code': 'Dim ID = \\"123456789\\"\\nIf ID Like \\"[A-Z]#########\\" Then\\n  Print(\\"格式正確\\")\\nElse\\n  Print(\\"格式錯誤\\")\\nEnd If', 'result': '格式錯誤'},
        {'code': 'Dim ID = \\"A123456789\\"\\nIf ID(1) = \\"1\\" Then\\n  Print(\\"男性\\")\\nElse\\n  Print(\\"女性\\")\\nEnd If', 'result': '男性'},
        {'code': 'Dim ID = \\"A223456789\\"\\nIf ID(1) = \\"1\\" Then\\n  Print(\\"男性\\")\\nElse\\n  Print(\\"女性\\")\\nEnd If', 'result': '女性'}
    ],
    '1060307': [
        {'code': 'Dim v() = {14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}\\nDim card = 0 \\\' 代表A\\nPrint(v(card Mod 13))', 'result': '14'},
        {'code': 'Dim v() = {14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}\\nDim card = 12 \\\' 代表K\\nPrint(v(card Mod 13))', 'result': '13'},
        {'code': 'Dim s() = {\\"黑桃\\", \\"紅心\\", \\"方塊\\", \\"梅花\\"}\\nDim card = 0\\nPrint(s(card \\\\ 13))', 'result': '黑桃'},
        {'code': 'Dim s() = {\\"黑桃\\", \\"紅心\\", \\"方塊\\", \\"梅花\\"}\\nDim card = 14\\nPrint(s(card \\\\ 13))', 'result': '紅心'}
    ],
    '1060308': [
        {'code': 'Dim a=1, b=2, x=1, y=3\\nDim m1 = b*x + a*y\\nDim m2 = a*x\\nPrint(m1 & \\"/\\" & m2)', 'result': '5/1'},
        {'code': 'Dim a=2, b=1, x=3, y=1\\nDim m1 = b*x + a*y\\nDim m2 = a*x\\nPrint(m1 & \\"/\\" & m2)', 'result': '5/6'},
        {'code': 'Dim a=2, b=1, x=2, y=1\\nDim m1 = b*y\\nDim m2 = a*x\\nPrint(m1 & \\"/\\" & m2)', 'result': '1/4'},
        {'code': 'Dim a=3, b=2, x=2, y=1\\nDim m1 = b*x\\nDim m2 = a*y\\nPrint(m1 & \\"/\\" & m2)', 'result': '4/3'}
    ]
}

updates['1060302'] = updates['Q2']
updates['1060303'] = updates['Q3']
updates['1060304'] = updates['Q4']
updates['1060305'] = updates['Q5']

with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re

for qid, results in updates.items():
    res_str = "[\\n"
    for idx, r in enumerate(results):
        code_str = r['code'].replace('\\n', '\\\\n').replace('\"', '\\\\\"')
        result_str = r['result'].replace('\\n', '\\\\n').replace('\"', '\\\\\"')
        res_str += f"            {{ code: \\\"{code_str}\\\", result: \\\"{result_str}\\\" }}"
        if idx < len(results) - 1:
            res_str += ",\\n"
        else:
            res_str += "\\n"
    res_str += "        ]"
    
    # robust regex that only matches inside the block for `qid`
    # We find \"qid\": { ... match_results: [ ... ]
    # using match_results: \s*\[(.*?)\]
    # but we need to restrict it to the current QID block
    # A safer way to replace is to split the text by \"QID\": {
    # but some keys might be identical.
    
    # Let's just find `\"QID\": {` and then the NEXT `match_results: [`
    start_idx = text.find(f'"{qid}": {{')
    if start_idx == -1: continue
    match_idx = text.find('match_results:', start_idx)
    if match_idx == -1: continue
    
    bracket_start = text.find('[', match_idx)
    bracket_end = text.find(']', bracket_start)
    
    text = text[:bracket_start] + res_str + text[bracket_end+1:]

with open('js/quiz_data.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated successfully")
