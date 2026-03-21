import re
import json

with open('js/quiz_data.js', 'r', encoding='utf-8') as f:
    c = f.read()

# We will dynamically generate `variant_match_results` for Q1, Q2, Q3, Q5
# By doing a string replace on the match_results blocks!

def transform_q1(match_results_str):
    # For to Do While
    t02 = match_results_str.replace("For i = 0 To s.Length \\ 2 - 1", "Dim i As Integer = 0\\nDo While i <= s.Length \\ 2 - 1")
    t02 = t02.replace("ans = \\\"not\\\" : Exit For", "ans = \\\"not\\\" : Exit Do")
    t02 = t02.replace("Next i", "    i += 1\\nLoop")
    
    # For to Do Loop While
    t03 = match_results_str.replace("For i = 0 To s.Length \\ 2 - 1", "Dim i As Integer = 0\\nDo")
    t03 = t03.replace("ans = \\\"not\\\" : Exit For", "ans = \\\"not\\\" : Exit Do")
    t03 = t03.replace("Next i", "    i += 1\\nLoop While i <= s.Length \\ 2 - 1")
    return t02, t03

def transform_q2(match_results_str):
    # Q2 has nested loops
    t02 = match_results_str
    # Replace outer loop (up)
    t02 = t02.replace("For i = 1 To n\\n", "Dim i As Integer = 1\\nDo While i <= n\\n")
    # Replace outer loop (down)
    t02 = t02.replace("For i = n DownTo 1 Step -1\\n", "Dim i As Integer = n\\nDo While i >= 1\\n")
    
    # Replace inner loop
    t02 = t02.replace("  For j = 1 To i\\n", "  Dim j As Integer = 1\\n  Do While j <= i\\n")
    t02 = t02.replace("  For j = 1 To n\\n", "  Dim j As Integer = 1\\n  Do While j <= n\\n")
    
    # Replace inner Next
    t02 = t02.replace("  Next\\n", "    j += 1\\n  Loop\\n")
    
    # Replace outer Next (up)
    t02 = t02.replace("  Console.WriteLine()\\nNext", "  Console.WriteLine()\\n  i += 1\\nLoop")
    # Actually wait! If i decreases in DownTo, then `i -= 1`. We need to handle them carefully.
    return None

def transform_q2_t02(match_results_str):
    t02 = match_results_str
    t02 = re.sub(r'For i = 1 To n\\n\s*For j = 1 To i\\n', r'Dim i As Integer = 1\\nDo While i <= n\\n  Dim j As Integer = 1\\n  Do While j <= i\\n', t02)
    t02 = re.sub(r'For i = 1 To n\\n\s*For j = 1 To n\\n', r'Dim i As Integer = 1\\nDo While i <= n\\n  Dim j As Integer = 1\\n  Do While j <= n\\n', t02)
    t02 = re.sub(r'For i = n DownTo 1 Step -1\\n\s*For j = 1 To i\\n', r'Dim i As Integer = n\\nDo While i >= 1\\n  Dim j As Integer = 1\\n  Do While j <= i\\n', t02)
    
    t02 = t02.replace("  Next\\n  Console.WriteLine()\\nNext", "    j += 1\\n  Loop\\n  Console.WriteLine()\\n  i += 1\\nLoop")
    # Fix the DownTo case (which needs i -= 1)
    # The string above replaced ALL Nexts with i+=1. We fix DownTo specifically.
    t02 = re.sub(r'(Do While i >= 1.*?Console\.WriteLine\(\)\\n)  i \+= 1(\\nLoop)', r'\1  i -= 1\2', t02, flags=re.DOTALL)
    return t02
    
def transform_q2_t03(match_results_str):
    t03 = match_results_str
    t03 = re.sub(r'For i = 1 To n\\n\s*For j = 1 To i\\n', r'Dim i As Integer = 1\\nDo\\n  Dim j As Integer = 1\\n  Do\\n', t03)
    t03 = re.sub(r'For i = 1 To n\\n\s*For j = 1 To n\\n', r'Dim i As Integer = 1\\nDo\\n  Dim j As Integer = 1\\n  Do\\n', t03)
    t03 = re.sub(r'For i = n DownTo 1 Step -1\\n\s*For j = 1 To i\\n', r'Dim i As Integer = n\\nDo\\n  Dim j As Integer = 1\\n  Do\\n', t03)
    
    # We can't do a blanket replacement for Loop While because conditions depend on n, i
    # Let's just process item by item
    return None

import json
parts = {}
for q in ['Q1', 'Q2', 'Q3', 'Q5']:
    match = re.search(f'"{q}": {{.*?match_results:\s*(\[.*?\])(?=\s*}}|\s*,\s*"bug_tests"|\s*,\s*"Q)', c, re.DOTALL)
    if match:
        parts[q] = match.group(1)

# Manual overrides for cleaner code
q1_t02 = parts['Q1'].replace("For i = 0 To s.Length \\\\ 2 - 1", "Dim i As Integer = 0\\nDo While i <= s.Length \\\\ 2 - 1").replace("ans = \\\"not\\\" : Exit For", "ans = \\\"not\\\" : Exit Do").replace("Next i", "    i += 1\\nLoop")
q1_t03 = parts['Q1'].replace("For i = 0 To s.Length \\\\ 2 - 1", "Dim i As Integer = 0\\nDo").replace("ans = \\\"not\\\" : Exit For", "ans = \\\"not\\\" : Exit Do").replace("Next i", "    i += 1\\nLoop While i <= s.Length \\\\ 2 - 1")

q2_t02 = parts['Q2'].replace('For i = 1 To n\\n  For j = 1 To i\\n', 'Dim i As Integer = 1\\nDo While i <= n\\n  Dim j As Integer = 1\\n  Do While j <= i\\n').replace('For i = 1 To n\\n  For j = 1 To n\\n', 'Dim i As Integer = 1\\nDo While i <= n\\n  Dim j As Integer = 1\\n  Do While j <= n\\n').replace('For i = n DownTo 1 Step -1\\n  For j = 1 To i\\n', 'Dim i As Integer = n\\nDo While i >= 1\\n  Dim j As Integer = 1\\n  Do While j <= i\\n').replace('    Console.Write(j)\\n  Next\\n  Console.WriteLine()\\nNext", result: "1\\n12\\n123"', '    Console.Write(j)\\n    j += 1\\n  Loop\\n  Console.WriteLine()\\n  i += 1\\nLoop", result: "1\\n12\\n123"').replace('    Console.Write(\\"*\\")\\n  Next\\n  Console.WriteLine()\\nNext", result: "***\\n***\\n***"', '    Console.Write(\\"*\\")\\n    j += 1\\n  Loop\\n  Console.WriteLine()\\n  i += 1\\nLoop", result: "***\\n***\\n***"').replace('    Console.Write(\\"*\\")\\n  Next\\n  Console.WriteLine()\\nNext", result: "*\\n**\\n***"', '    Console.Write(\\"*\\")\\n    j += 1\\n  Loop\\n  Console.WriteLine()\\n  i += 1\\nLoop", result: "*\\n**\\n***"').replace('    Console.Write(j)\\n  Next\\n  Console.WriteLine()\\nNext", result: "123\\n12\\n1"', '    Console.Write(j)\\n    j += 1\\n  Loop\\n  Console.WriteLine()\\n  i -= 1\\nLoop", result: "123\\n12\\n1"')

q2_t03 = parts['Q2'].replace('For i = 1 To n\\n  For j = 1 To i\\n', 'Dim i As Integer = 1\\nDo\\n  Dim j As Integer = 1\\n  Do\\n').replace('For i = 1 To n\\n  For j = 1 To n\\n', 'Dim i As Integer = 1\\nDo\\n  Dim j As Integer = 1\\n  Do\\n').replace('For i = n DownTo 1 Step -1\\n  For j = 1 To i\\n', 'Dim i As Integer = n\\nDo\\n  Dim j As Integer = 1\\n  Do\\n').replace('    Console.Write(j)\\n  Next\\n  Console.WriteLine()\\nNext", result: "1\\n12\\n123"', '    Console.Write(j)\\n    j += 1\\n  Loop While j <= i\\n  Console.WriteLine()\\n  i += 1\\nLoop While i <= n", result: "1\\n12\\n123"').replace('    Console.Write(\\"*\\")\\n  Next\\n  Console.WriteLine()\\nNext", result: "***\\n***\\n***"', '    Console.Write(\\"*\\")\\n    j += 1\\n  Loop While j <= n\\n  Console.WriteLine()\\n  i += 1\\nLoop While i <= n", result: "***\\n***\\n***"').replace('    Console.Write(\\"*\\")\\n  Next\\n  Console.WriteLine()\\nNext", result: "*\\n**\\n***"', '    Console.Write(\\"*\\")\\n    j += 1\\n  Loop While j <= i\\n  Console.WriteLine()\\n  i += 1\\nLoop While i <= n", result: "*\\n**\\n***"').replace('    Console.Write(j)\\n  Next\\n  Console.WriteLine()\\nNext", result: "123\\n12\\n1"', '    Console.Write(j)\\n    j += 1\\n  Loop While j <= i\\n  Console.WriteLine()\\n  i -= 1\\nLoop While i >= 1", result: "123\\n12\\n1"')

q3_t02 = parts['Q3'].replace('For i = 2 To n - 1', 'Dim i As Integer = 2\\nDo While i <= n - 1').replace('Next\\n', '  i += 1\\nLoop\\n')
q3_t03 = parts['Q3'].replace('For i = 2 To n - 1', 'Dim i As Integer = 2\\nDo').replace('Next\\n', '  i += 1\\nLoop While i <= n - 1\\n')

q5_t02 = parts['Q5'].replace('For Each i In a\\n', 'Dim idx As Integer = 0\\nDo While idx < a.Length\\n  Dim i = a(idx)\\n').replace('Next\\n', '  idx += 1\\nLoop\\n')
q5_t03 = parts['Q5'].replace('For Each i In a\\n', 'Dim idx As Integer = 0\\nDo\\n  Dim i = a(idx)\\n').replace('Next\\n', '  idx += 1\\nLoop While idx < a.Length\\n')

# Now inject variant_match_results into quiz_data.js!
for q, (t2, t3) in [('Q1', (q1_t02, q1_t03)), ('Q2', (q2_t02, q2_t03)), ('Q3', (q3_t02, q3_t03)), ('Q5', (q5_t02, q5_t03))]:
    # Find match_results array again to replace
    orig_match = re.search(f'"{q}": {{.*?match_results:\s*\[.*?\]', c, re.DOTALL)
    if orig_match:
        insertion = f',\\n        variant_match_results: {{\\n            "T02": {t2},\\n            "T03": {t3}\\n        }}'
        # Insert right after match_results[...]
        target_str = orig_match.group(0)
        c = c.replace(target_str, target_str + insertion)

with open('js/quiz_data.js', 'w', encoding='utf-8') as f:
    f.write(c)

print('Success: Updated variant_match_results for Q1, Q2, Q3, Q5')
