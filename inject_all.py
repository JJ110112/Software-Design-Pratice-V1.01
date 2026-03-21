import json

with open("js/quiz_data.js", "r", encoding="utf-8") as f:
    text = f.read()

# Q2 Replacement
q2_placeholder = """        match_results: [
            { code: "' Q2 範例程式區塊 1", result: "執行結果暫未設定" },
            { code: "' Q2 範例程式區塊 2", result: "執行結果暫未設定" }
        ]"""

q2_t01 = """        match_results: [
            { code: "Dim n = 3\\nFor i = 1 To n\\n  For j = 1 To i\\n    Console.Write(j)\\n  Next\\n  Console.WriteLine()\\nNext", result: "1\\n12\\n123" },
            { code: "Dim n = 3\\nFor i = 1 To n\\n  For j = 1 To n\\n    Console.Write(\\"*\\")\\n  Next\\n  Console.WriteLine()\\nNext", result: "***\\n***\\n***" },
            { code: "Dim n = 3\\nFor i = 1 To n\\n  For j = 1 To i\\n    Console.Write(\\"*\\")\\n  Next\\n  Console.WriteLine()\\nNext", result: "*\\n**\\n***" },
            { code: "Dim n = 3\\nFor i = n DownTo 1 Step -1\\n  For j = 1 To i\\n    Console.Write(j)\\n  Next\\n  Console.WriteLine()\\nNext", result: "123\\n12\\n1" }
        ],"""
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
q2_full = q2_t01 + "\\n        variant_match_results: {" + q2_t02 + q2_t03 + "\\n        }"

text = text.replace(q2_placeholder, q2_full.replace("\\\\", "\\"))

# Q3 Replacement
q3_placeholder = """        match_results: [
            { code: "' Q3 範例程式區塊 1", result: "執行結果暫未設定" },
            { code: "' Q3 範例程式區塊 2", result: "執行結果暫未設定" }
        ]"""
q3_t01 = """        match_results: [
            { code: "Dim n = 5\\nDim ans = \\"\\"\\nFor i = 2 To n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\nNext\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "Y" },
            { code: "Dim n = 6\\nDim ans = \\"\\"\\nFor i = 2 To n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\nNext\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "N" },
            { code: "Dim n = 7\\nDim ans = \\"\\"\\nFor i = 2 To n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\nNext\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "Y" },
            { code: "Dim n = 9\\nDim ans = \\"\\"\\nFor i = 2 To n - 1\\n  If n Mod i = 0 Then ans = \\"not\\"\\nNext\\nIf ans = \\"not\\" Then Print(\\"N\\") Else Print(\\"Y\\")", result: "N" }
        ],"""
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
q3_full = q3_t01 + "\\n        variant_match_results: {" + q3_t02 + q3_t03 + "\\n        }"
text = text.replace(q3_placeholder, q3_full.replace("\\\\", "\\"))

# Q5 Replacement
q5_placeholder = """        match_results: [
            { code: "' Q5 範例程式區塊 1", result: "執行結果暫未設定" },
            { code: "' Q5 範例程式區塊 2", result: "執行結果暫未設定" }
        ]"""
q5_t01 = """        match_results: [
            { code: "Dim a() = {1, 3, 5, 7}\\nDim sum As Integer = 0\\nFor Each i In a\\n  sum += i\\nNext\\nPrint(sum)", result: "16" },
            { code: "Dim a() = {8, 2, 6, 4}\\nDim max As Integer = a(0)\\nFor Each i In a\\n  If i > max Then max = i\\nNext\\nPrint(max)", result: "8" },
            { code: "Dim a() = {8, 2, 6, 4}\\nDim min As Integer = a(0)\\nFor Each i In a\\n  If i < min Then min = i\\nNext\\nPrint(min)", result: "2" },
            { code: "Dim a() = {1, 2, 3, 4, 5}\\nDim c As Integer = 0\\nFor Each i In a\\n  If i Mod 2 = 0 Then c += 1\\nNext\\nPrint(c)", result: "2" }
        ],"""
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
q5_full = q5_t01 + "\\n        variant_match_results: {" + q5_t02 + q5_t03 + "\\n        }"
text = text.replace(q5_placeholder, q5_full.replace("\\\\", "\\"))

with open("js/quiz_data.js", "w", encoding="utf-8") as f:
    f.write(text)
print("SUCCESS: REPLACED Q2, Q3, Q5 PLACEHOLDERS")
