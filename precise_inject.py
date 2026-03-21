import json

with open("js/quiz_data.js", "r", encoding="utf-8") as f:
    content = f.read()

# For Q1
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

# For Q2
q2_anchor = """123\\n12\\n1" }\\n        ],"""
q2_t02 = """
            "T02": [
                { code: "Dim n = 3\\nDim i As Integer = 1\\nDo While i <= n\\n  Dim j As Integer = 1\\n  Do While j <= i\\n    Console.Write(j)\\n    j += 1\\n  Loop\\n  Console.WriteLine()\\n  i += 1\\nLoop", result: "1\\n12\\n123" },
                { code: "Dim n = 3\\nDim i As Integer = 1\\nDo While i <= n\\n  Dim j As Integer = 1\\n  Do While j <= n\\n    Console.Write(\\"*\\")\\n    j += 1\\n  Loop\\n  Console.WriteLine()\\n  i += 1\\nLoop", result: "***\\n***\\n***" },
                { code: "Dim n = 3\\nDim i As Integer = 1\\nDo While i <= n\\n  Dim j As Integer = 1\\n  Do While j <= i\\n    Console.Write(\\"*\\")\\n    j += 1\\n  Loop\\n  Console.WriteLine()\\n  i += 1\\nLoop", result: "*\\n**\\n***" },
                { code: "Dim n = 3\\nDim i As Integer = n\\nDo While i >= 1\\n  Dim j As Integer = 1\\n  Do While j <= i\\n    Console.Write(j)\\n    j += 1\\n  Loop\\n  Console.WriteLine()\\n  i -= 1\\nLoop", result: "123\\n12\\n1" }
            ],"""
q2_t03 = """
            "T03": [
                { code: "Dim n = 3\\nDim i As Integer = 1\\nDo\\n  Dim j As Integer = 1\\n  Do\\n    Console.Write(j)\\n    j += 1\\n  Loop While j <= i\\n  Console.WriteLine()\\n  i += 1\\nLoop While i <= n", result: "1\\n12\\n123" },
                { code: "Dim n = 3\\nDim i As Integer = 1\\nDo\\n  Dim j As Integer = 1\\n  Do\\n    Console.Write(\\"*\\")\\n    j += 1\\n  Loop While j <= n\\n  Console.WriteLine()\\n  i += 1\\nLoop While i <= n", result: "***\\n***\\n***" },
                { code: "Dim n = 3\\nDim i As Integer = 1\\nDo\\n  Dim j As Integer = 1\\n  Do\\n    Console.Write(\\"*\\")\\n    j += 1\\n  Loop While j <= i\\n  Console.WriteLine()\\n  i += 1\\nLoop While i <= n", result: "*\\n**\\n***" },
                { code: "Dim n = 3\\nDim i As Integer = n\\nDo\\n  Dim j As Integer = 1\\n  Do\\n    Console.Write(j)\\n    j += 1\\n  Loop While j <= i\\n  Console.WriteLine()\\n  i -= 1\\nLoop While i >= 1", result: "123\\n12\\n1" }
            ]"""
q2_inject = q2_anchor + '\\n        variant_match_results: {' + q2_t02 + q2_t03 + '\\n        },'
content = content.replace(q2_anchor.replace('\\\\', '\\'), q2_inject.replace('\\\\', '\\'))

# For Q3
q3_anchor = """result: "N" }\\n        ],"""
q3_t02 = """
            "T02": [
                { code: "Dim n = 5\\nDim ans = \\"\\"\\nDim i As Integer = 2\\nDo While i <= n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\n  i += 1\\nLoop\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "Y" },
                { code: "Dim n = 6\\nDim ans = \\"\\"\\nDim i As Integer = 2\\nDo While i <= n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\n  i += 1\\nLoop\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "N" },
                { code: "Dim n = 7\\nDim ans = \\"\\"\\nDim i As Integer = 2\\nDo While i <= n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\n  i += 1\\nLoop\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "Y" },
                { code: "Dim n = 9\\nDim ans = \\"\\"\\nDim i As Integer = 2\\nDo While i <= n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\n  i += 1\\nLoop\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "N" }
            ],"""
q3_t03 = """
            "T03": [
                { code: "Dim n = 5\\nDim ans = \\"\\"\\nDim i As Integer = 2\\nDo\\n  If n Mod i = 0 Then ans = \\"not\\"\\n  i += 1\\nLoop While i <= n - 1\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "Y" },
                { code: "Dim n = 6\\nDim ans = \\"\\"\\nDim i As Integer = 2\\nDo\\n  If n Mod i = 0 Then ans = \\"not\\"\\n  i += 1\\nLoop While i <= n - 1\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "N" },
                { code: "Dim n = 7\\nDim ans = \\"\\"\\nDim i As Integer = 2\\nDo\\n  If n Mod i = 0 Then ans = \\"not\\"\\n  i += 1\\nLoop While i <= n - 1\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "Y" },
                { code: "Dim n = 9\\nDim ans = \\"\\"\\nDim i As Integer = 2\\nDo\\n  If n Mod i = 0 Then ans = \\"not\\"\\n  i += 1\\nLoop While i <= n - 1\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "N" }
            ]"""
q3_inject = q3_anchor + '\\n        variant_match_results: {' + q3_t02 + q3_t03 + '\\n        },'
content = content.replace(q3_anchor.replace('\\\\', '\\'), q3_inject.replace('\\\\', '\\'))

# For Q5
q5_anchor = """If i Mod 2 = 0 Then c += 1\\nNext\\nPrint(c)", result: "2" }\\n        ],"""
q5_t02 = """
            "T02": [
                { code: "Dim a() = {1, 3, 5, 7}\\nDim sum As Integer = 0\\nDim idx As Integer = 0\\nDo While idx < a.Length\\n  Dim i = a(idx)\\n  sum += i\\n  idx += 1\\nLoop\\nPrint(sum)", result: "16" },
                { code: "Dim a() = {8, 2, 6, 4}\\nDim max As Integer = a(0)\\nDim idx As Integer = 0\\nDo While idx < a.Length\\n  Dim i = a(idx)\\n  If i > max Then max = i\\n  idx += 1\\nLoop\\nPrint(max)", result: "8" },
                { code: "Dim a() = {8, 2, 6, 4}\\nDim min As Integer = a(0)\\nDim idx As Integer = 0\\nDo While idx < a.Length\\n  Dim i = a(idx)\\n  If i < min Then min = i\\n  idx += 1\\nLoop\\nPrint(min)", result: "2" },
                { code: "Dim a() = {1, 2, 3, 4, 5}\\nDim c As Integer = 0\\nDim idx As Integer = 0\\nDo While idx < a.Length\\n  Dim i = a(idx)\\n  If i Mod 2 = 0 Then c += 1\\n  idx += 1\\nLoop\\nPrint(c)", result: "2" }
            ],"""
q5_t03 = """
            "T03": [
                { code: "Dim a() = {1, 3, 5, 7}\\nDim sum As Integer = 0\\nDim idx As Integer = 0\\nDo\\n  Dim i = a(idx)\\n  sum += i\\n  idx += 1\\nLoop While idx < a.Length\\nPrint(sum)", result: "16" },
                { code: "Dim a() = {8, 2, 6, 4}\\nDim max As Integer = a(0)\\nDim idx As Integer = 0\\nDo\\n  Dim i = a(idx)\\n  If i > max Then max = i\\n  idx += 1\\nLoop While idx < a.Length\\nPrint(max)", result: "8" },
                { code: "Dim a() = {8, 2, 6, 4}\\nDim min As Integer = a(0)\\nDim idx As Integer = 0\\nDo\\n  Dim i = a(idx)\\n  If i < min Then min = i\\n  idx += 1\\nLoop While idx < a.Length\\nPrint(min)", result: "2" },
                { code: "Dim a() = {1, 2, 3, 4, 5}\\nDim c As Integer = 0\\nDim idx As Integer = 0\\nDo\\n  Dim i = a(idx)\\n  If i Mod 2 = 0 Then c += 1\\n  idx += 1\\nLoop While idx < a.Length\\nPrint(c)", result: "2" }
            ]"""
q5_inject = q5_anchor + '\\n        variant_match_results: {' + q5_t02 + q5_t03 + '\\n        },'
content = content.replace(q5_anchor.replace('\\\\', '\\'), q5_inject.replace('\\\\', '\\'))

with open("js/quiz_data.js", "w", encoding="utf-8") as f:
    f.write(content)
print("INJECTION SUCCESS")
