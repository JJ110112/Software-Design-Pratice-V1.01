import json

with open("js/quiz_data.js", "r", encoding="utf-8") as f:
    text = f.read()

# Q4 Replacement
q4_placeholder = """        match_results: [
            { code: "' Q4 範例程式區塊 1", result: "執行結果暫未設定" },
            { code: "' Q4 範例程式區塊 2", result: "執行結果暫未設定" }
        ]"""

q4_t01 = """        match_results: [
            { code: "Dim bmi() = {24, 19, 28}\\nDim min As Integer = 99\\nFor i = 0 To 2\\n  If bmi(i) < min Then min = bmi(i)\\nNext\\nPrint(min)", result: "19" },
            { code: "Dim bmi() = {24, 19, 28}\\nDim count As Integer = 0\\nFor i = 0 To 2\\n  If bmi(i) >= 20 And bmi(i) <= 25 Then count += 1\\nNext\\nPrint(count)", result: "1" },
            { code: "Dim bmi() = {24, 19, 28}\\nDim max As Integer = 0\\nFor i = 0 To 2\\n  If bmi(i) > max Then max = bmi(i)\\nNext\\nPrint(max)", result: "28" },
            { code: "Dim bmi() = {24, 19, 28}\\nDim sum As Integer = 0\\nFor i = 0 To 2\\n  sum += bmi(i)\\nNext\\nPrint(sum)", result: "71" }
        ],"""
q4_t02 = """
            "T02": [
                { code: "Dim bmi() = {24, 19, 28}\\nDim min As Integer = 99\\nDim i As Integer = 0\\nDo While i <= 2\\n  If bmi(i) < min Then min = bmi(i)\\n  i += 1\\nLoop\\nPrint(min)", result: "19" },
                { code: "Dim bmi() = {24, 19, 28}\\nDim count As Integer = 0\\nDim i As Integer = 0\\nDo While i <= 2\\n  If bmi(i) >= 20 And bmi(i) <= 25 Then count += 1\\n  i += 1\\nLoop\\nPrint(count)", result: "1" },
                { code: "Dim bmi() = {24, 19, 28}\\nDim max As Integer = 0\\nDim i As Integer = 0\\nDo While i <= 2\\n  If bmi(i) > max Then max = bmi(i)\\n  i += 1\\nLoop\\nPrint(max)", result: "28" },
                { code: "Dim bmi() = {24, 19, 28}\\nDim sum As Integer = 0\\nDim i As Integer = 0\\nDo While i <= 2\\n  sum += bmi(i)\\n  i += 1\\nLoop\\nPrint(sum)", result: "71" }
            ],"""
q4_t03 = """
            "T03": [
                { code: "Dim bmi() = {24, 19, 28}\\nDim min As Integer = 99\\nDim i As Integer = 0\\nDo\\n  If bmi(i) < min Then min = bmi(i)\\n  i += 1\\nLoop While i <= 2\\nPrint(min)", result: "19" },
                { code: "Dim bmi() = {24, 19, 28}\\nDim count As Integer = 0\\nDim i As Integer = 0\\nDo\\n  If bmi(i) >= 20 And bmi(i) <= 25 Then count += 1\\n  i += 1\\nLoop While i <= 2\\nPrint(count)", result: "1" },
                { code: "Dim bmi() = {24, 19, 28}\\nDim max As Integer = 0\\nDim i As Integer = 0\\nDo\\n  If bmi(i) > max Then max = bmi(i)\\n  i += 1\\nLoop While i <= 2\\nPrint(max)", result: "28" },
                { code: "Dim bmi() = {24, 19, 28}\\nDim sum As Integer = 0\\nDim i As Integer = 0\\nDo\\n  sum += bmi(i)\\n  i += 1\\nLoop While i <= 2\\nPrint(sum)", result: "71" }
            ]"""
q4_full = q4_t01 + "\\n        variant_match_results: {" + q4_t02 + q4_t03 + "\\n        }"

text = text.replace(q4_placeholder, q4_full.replace("\\\\", "\\"))

with open("js/quiz_data.js", "w", encoding="utf-8") as f:
    f.write(text)
print("SUCCESS: REPLACED Q4 PLACEHOLDER")
