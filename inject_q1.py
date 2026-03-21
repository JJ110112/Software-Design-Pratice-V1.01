import json

with open("js/quiz_data.js", "r", encoding="utf-8") as f:
    content = f.read()

q1_anchor = """result: 'Level is not a palindrome.\\n(L 與 l 尚未轉換大小寫被視為不同，ans="not")' }\\n        ],"""
q1_t02 = """
            "T02": [
                { code: 'Dim s As String = "12321"\\nDim ans As String = ""\\nDim i As Integer = 0\\nDo While i <= s.Length \\\\ 2 - 1\\n    If s(i) <> s(s.Length - i - 1) Then\\n        ans = "not" : Exit Do\\n    End If\\n    i += 1\\nLoop', result: '12321 is  a palindrome.\\n(對稱字元都相同，ans維持為空)' },
                { code: 'Dim s As String = "TEST"\\nDim ans As String = ""\\nDim i As Integer = 0\\nDo While i <= s.Length \\\\ 2 - 1\\n    If s(i) <> s(s.Length - i - 1) Then\\n        ans = "not" : Exit Do\\n    End If\\n    i += 1\\nLoop', result: 'TEST is not a palindrome.\\n(中間的 E 與 S 不等，ans="not")' },
                { code: 'Dim s As String = "Level"\\nDim ans As String = ""\\nDim i As Integer = 0\\nDo While i <= s.Length \\\\ 2 - 1\\n    If s(i) <> s(s.Length - i - 1) Then\\n        ans = "not" : Exit Do\\n    End If\\n    i += 1\\nLoop', result: 'Level is not a palindrome.\\n(L 與 l 尚未轉換大小寫被視為不同，ans="not")' }
            ],"""
q1_t03 = """
            "T03": [
                { code: 'Dim s As String = "12321"\\nDim ans As String = ""\\nDim i As Integer = 0\\nDo\\n    If s(i) <> s(s.Length - i - 1) Then\\n        ans = "not" : Exit Do\\n    End If\\n    i += 1\\nLoop While i <= s.Length \\\\ 2 - 1', result: '12321 is  a palindrome.\\n(對稱字元都相同，ans維持為空)' },
                { code: 'Dim s As String = "TEST"\\nDim ans As String = ""\\nDim i As Integer = 0\\nDo\\n    If s(i) <> s(s.Length - i - 1) Then\\n        ans = "not" : Exit Do\\n    End If\\n    i += 1\\nLoop While i <= s.Length \\\\ 2 - 1', result: 'TEST is not a palindrome.\\n(中間的 E 與 S 不等，ans="not")' },
                { code: 'Dim s As String = "Level"\\nDim ans As String = ""\\nDim i As Integer = 0\\nDo\\n    If s(i) <> s(s.Length - i - 1) Then\\n        ans = "not" : Exit Do\\n    End If\\n    i += 1\\nLoop While i <= s.Length \\\\ 2 - 1', result: 'Level is not a palindrome.\\n(L 與 l 尚未轉換大小寫被視為不同，ans="not")' }
            ]"""
q1_inject = q1_anchor + '\\n        variant_match_results: {' + q1_t02 + q1_t03 + '\\n        },'
content = content.replace(q1_anchor.replace('\\\\', '\\'), q1_inject.replace('\\\\', '\\'))

with open("js/quiz_data.js", "w", encoding="utf-8") as f:
    f.write(content)
print("INJECTED Q1")
