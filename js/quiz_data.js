/* quiz_data.js - 軟體設計丙級術科練習核心數據 */

const QUIZ_DATA = {
    // 通用表單載入內容 (每個考題開頭都一樣)
    "SETUP": {
        title: "Form1_Load (通用考生資訊)",
        steps: [
            { zh: "輸出個人基本資料第一行", code: 'RichTextBox1.Text &= "姓名：吳烱賢　　術科測試編號：12345678" + vbCrLf', hint: 'RichTextBox1.Text &= "姓名：..." + vbCrLf' },
            { zh: "輸出個人基本資料第二行", code: 'RichTextBox1.Text &= "座號：９９　　　日期：2026/05/18" + vbCrLf', hint: 'RichTextBox1.Text &= "座號：..." + vbCrLf' },
            { zh: "呼叫 Q1 副程式執行", code: 'Q1()', hint: 'Q1()' },
            { zh: "呼叫 Q2 副程式執行", code: 'Q2()', hint: 'Q2()' },
            { zh: "呼叫 Q3 副程式執行", code: 'Q3()', hint: 'Q3()' },
            { zh: "呼叫 Q4 副程式執行", code: 'Q4()', hint: 'Q4()' },
            { zh: "呼叫 Q5 副程式執行", code: 'Q5()', hint: 'Q5()' }
        ],
        match_results: [
            { code: 'RichTextBox1.Text &= "姓名：吳烱賢　　術科測試編號：12345678" + vbCrLf', result: '姓名：吳烱賢　　術科測試編號：12345678\n(換行)' },
            { code: 'RichTextBox1.Text &= "座號：９９　　　日期：2026/05/18" + vbCrLf', result: '座號：９９　　　日期：2026/05/18\n(換行)' },
            { code: 'Q1()\nQ2()\nQ3()\nQ4()\nQ5()', result: '依序觸發對應的副程式模組邏輯' }
        ],
        bug_tests: [
            { lineNum: '第 1 行', tokens: ['RichTextBox2.Text ', '&= ', '"姓名：吳烱賢　　術科測試編號：12345678" ', '+ vbCrLf'], errorIndex: 0, hint: '表單上的大文字方塊叫什麼名字？', explain: '題目預設的文字方塊控制項名稱是 RichTextBox1，不是 RichTextBox2。', correct: 'RichTextBox1.Text &= "姓名：吳烱賢　　術科測試編號：12345678" + vbCrLf' },
            { lineNum: '第 2 行', tokens: ['RichTextBox1.Text ', '&= ', '"座號：９９　　　日期：2026/05/18" ', '- ', 'vbCrLf'], errorIndex: 3, hint: '字串串接應該用加號還是減號？', explain: '在串接字串與常數 vbCrLf (換行) 時，必須使用「+」或「&」，不能使用減號「-」。', correct: 'RichTextBox1.Text &= "座號：９９　　　日期：2026/05/18" + vbCrLf' },
            { lineNum: '第 3 行', tokens: ['Q1', '[', ']'], errorIndex: 1, hint: '呼叫副程式時，應該用哪一種括號？', explain: 'VB.NET 呼叫副程式使用的是小括號 ()，中括號 [] 是其他的語法用途。', correct: 'Q1()' }
        ]
    },
    // 第一部分 Q1 ~ Q5
    "Q1": {
        title: "迴文判斷",
        // 副程式開始部分
        procedure_start: [
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "'* 11900-1060301 Program Start *", zh: "程式註解：題號 程式開始" },
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "Private Sub Q1()", zh: "私有副程式 Q1" },
            { raw: 'Dim f As New StreamReader("c:\\test\\1060301.{{EXT}}")', zh: "新增檔案讀取物件 f，讀取對應資料檔" },
            { raw: "Dim s As String = f.ReadLine()", zh: "讀取檔案中的一行文字字串" },
            { raw: 'Dim ans As String = ""', zh: "定義 ans 為字串型態，並初始化 ans 為空字串" }
        ],
        // 迴圈邏輯變體 (根據 T01/T02/T03 切換)
        loop_variants: {
            "T01": [ // For...Next
                { raw: "For i = 0 To s.Length \\ 2 - 1", zh: "設定 For 迴圈從 0 到一半長度減 1", hint: "For i = 0 To s.Length \\ 2 - 1" },
                { raw: "If s(i) <> s(s.Length - i - 1) Then", zh: "判斷：字串對稱位置字元是否不同", hint: "If s(i) <> s(s.Length - i - 1) Then" },
                { raw: 'ans = "not"', zh: "若不同，將 ans 設為 not", hint: 'ans = "not"' },
                { raw: "Exit For", zh: "立即跳出 For 迴圈", hint: "Exit For" },
                { raw: "End If", zh: "結束判斷式", hint: "End If" },
                { raw: "Next i", zh: "下個 i", hint: "Next i" }
            ],
            "T02": [ // Do While...Loop (前測試)
                { raw: "Dim i As Integer = 0", zh: "定義 i 為整數型態，並初始化 i 為 0", hint: "Dim i As Integer = 0" },
                { raw: "Do While i <= s.Length \\ 2 - 1", zh: "當 i <= s.Length \\ 2 - 1 時，執行 Do While 迴圈", hint: "Do While i <= s.Length \\ 2 - 1" },
                { raw: "If s(i) <> s(s.Length - i - 1) Then", zh: "判斷：字串對稱位置字元是否不同", hint: "If s(i) <> s(s.Length - i - 1) Then" },
                { raw: 'ans = "not"', zh: "若不同，將 ans 設為 not", hint: 'ans = "not"' },
                { raw: "Exit Do", zh: "跳出 Do 迴圈", hint: "Exit Do" },
                { raw: "End If", zh: "結束判斷式", hint: "End If" },
                { raw: "i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "Loop", zh: "迴圈結尾 Loop", hint: "Loop" }
            ],
            "T03": [ // Do...Loop While (後測試)
                { raw: "Dim i As Integer = 0", zh: "定義 i 為整數型態，並初始化 i 為 0", hint: "Dim i As Integer = 0" },
                { raw: "Do", zh: "迴圈開頭 Do", hint: "Do" },
                { raw: "If s(i) <> s(s.Length - i - 1) Then", zh: "判斷：字串對稱位置字元是否不同", hint: "If s(i) <> s(s.Length - i - 1) Then" },
                { raw: 'ans = "not"', zh: "若不同，將 ans 設為 not", hint: 'ans = "not"' },
                { raw: "Exit Do", zh: "跳出 Do 迴圈", hint: "Exit Do" },
                { raw: "End If", zh: "結束判斷式", hint: "End If" },
                { raw: "i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "Loop While i <= s.Length \\ 2 - 1", zh: "當 i <= s.Length \\ 2 - 1 時，執行 Do While 迴圈", hint: "Loop While i <= s.Length \\ 2 - 1" }
            ]
        },
        // 副程式固定結尾部分
        procedure_end: [
            { raw: 'RichTextBox1.Text &= "第一題結果：" & s & " is " & ans & " a palindrome." & vbCrLf', zh: "整合結果字串並輸出至 RichTextBox1", hint: "RichTextBox1.Text &= ..." },
            { raw: "End Sub", zh: "結束副程式 Sub", hint: "End Sub" }
        ],
        match_results: [
            { code: 'Dim s As String = "12321"\nDim ans As String = ""\nFor i = 0 To s.Length \\ 2 - 1\n    If s(i) <> s(s.Length - i - 1) Then\n        ans = "not" : Exit For\n    End If\nNext i', result: '12321 is  a palindrome.\n(對稱字元都相同，ans維持為空)' },
            { code: 'Dim s As String = "TEST"\nDim ans As String = ""\nFor i = 0 To s.Length \\ 2 - 1\n    If s(i) <> s(s.Length - i - 1) Then\n        ans = "not" : Exit For\n    End If\nNext i', result: 'TEST is not a palindrome.\n(中間的 E 與 S 不等，ans="not")' },
            { code: 'Dim s As String = "Level"\nDim ans As String = ""\nFor i = 0 To s.Length \\ 2 - 1\n    If s(i) <> s(s.Length - i - 1) Then\n        ans = "not" : Exit For\n    End If\nNext i', result: 'Level is not a palindrome.\n(L 與 l 尚未轉換大小寫被視為不同，ans="not")' }
        ],
        bug_tests: [
            { lineNum: '第 2 行', tokens: ['Dim f ', 'As New ', 'StreamWriter', '(Application.StartupPath & "\\Q1.txt")'], errorIndex: 2, hint: '要讀取檔案，應該用哪個類別？', explain: '「StreamWriter」是用來寫入檔案的類別。要讀取文字檔，應改用 StreamReader。', correct: 'Dim f As New StreamReader(Application.StartupPath & "\\Q1.txt")' },
            { lineNum: '第 3 行', tokens: ['Dim s ', 'As Integer ', '= f.ReadLine()'], errorIndex: 1, hint: 'ReadLine() 回傳的是什麼型別？', explain: '「As Integer」宣告的是整數變數，但 f.ReadLine() 回傳的是字串（String），型別不符合。應改為 As String。', correct: 'Dim s As String = f.ReadLine()' },
            { lineNum: '第 4 行', tokens: ['Dim ans ', 'As String ', '= ', '"not"'], errorIndex: 3, hint: '初始值代表「是迴文」，應該是什麼？', explain: '初始值設為 "not" 代表預設就是「非迴文」，邏輯相反。正確寫法的初始值應為空字串 ""，找到不匹配時才設為 "not"。', correct: 'Dim ans As String = ""' },
            { lineNum: '第 5 行', tokens: ['For i = ', '0 ', 'To ', 's.Length ', '\\ ', '2'], errorIndex: 5, hint: '字串索引從0開始，比較到一半時上限需不需要減去什麼？', explain: '因為字串的索引是從 0 開始，長度的一半作為進度上限時，必須要把長度除以 2 之後再減 1，否則會發生索引超出範圍的錯誤。', correct: 'For i = 0 To s.Length \\ 2 - 1' },
            { lineNum: '第 5 行（補充）', tokens: ['For i = ', '1 ', 'To s.Length \\ 2 - 1'], errorIndex: 1, hint: '字串索引從幾開始？', explain: '「For i = 1」從索引 1 開始，會漏掉第一個字元（索引 0）。VB.NET 字串索引從 0 開始，正確寫法是 For i = 0。', correct: 'For i = 0 To s.Length \\ 2 - 1' },
            { lineNum: '第 6 行', tokens: ['If ', 's(i) ', '= ', 's(s.Length - i - 1)'], errorIndex: 2, hint: '要判斷「不相等」應該用哪個運算子？', explain: '「=」是相等比較，但這行要判斷的是「頭尾字元不相等」時才執行後續動作，應改為 <> (不等於)。', correct: 'If s(i) <> s(s.Length - i - 1) Then' },
            { lineNum: '第 7 行', tokens: ['ans ', '= ', '"no"'], errorIndex: 2, hint: '最後一列輸出時會和哪個字串比較？', explain: '「"no"」與題目後段輸出判斷用的字串不符。程式用 ans 來組合輸出，預期的非迴文標記是 "not"，應改為 ans = "not"。', correct: 'ans = "not"' },
            { lineNum: '第 8 行', tokens: ['Continue ', 'For'], errorIndex: 0, hint: '找到不匹配後，應該立即離開迴圈，用哪個關鍵字？', explain: '「Continue For」的意思是跳過本次迴圈、繼續下一次，並不會跳出迴圈。要立即終止迴圈應使用 Exit For。', correct: 'Exit For' },
            { lineNum: '第 10 行', tokens: ['End ', 'For'], errorIndex: 0, hint: 'For 迴圈的結尾是用 End 還是其他關鍵字？', explain: 'VB.NET 中 For 迴圈的結尾必須使用 Next，而不是 End For。', correct: 'Next' },
            { lineNum: '第 11 行', tokens: ['RichTextBox1.Text ', '+= ', 's & " is " & ans & "palindrome" & vbCrLf'], errorIndex: 1, hint: 'VB.NET 用什麼運算子做字串串接與指定？', explain: '「+=」是數值加法指定運算子，在 VB.NET 字串串接時應使用 &= 來附加字串，或改用 = 配合 & 連接。', correct: 'RichTextBox1.Text &= s & " is " & ans & "palindrome" & vbCrLf' }
        ],
        variant_bug_tests: {
            "T02": [
                { lineNum: '第 2 行', tokens: ['Dim f ', 'As New ', 'StreamWriter', '(Application.StartupPath & "\\Q1.txt")'], errorIndex: 2, hint: '要讀取檔案，應該用哪個類別？', explain: '「StreamWriter」是用來寫入檔案的類別。要讀取文字檔，應改用 StreamReader。', correct: 'Dim f As New StreamReader(Application.StartupPath & "\\Q1.txt")' },
                { lineNum: '第 3 行', tokens: ['Dim s ', 'As Integer ', '= f.ReadLine()'], errorIndex: 1, hint: 'ReadLine() 回傳的是什麼型別？', explain: '「As Integer」宣告的是整數變數，但 f.ReadLine() 回傳的是字串（String），型別不符合。應改為 As String。', correct: 'Dim s As String = f.ReadLine()' },
                { lineNum: '第 4 行', tokens: ['Dim ans ', 'As String ', '= ', '"not"'], errorIndex: 3, hint: '初始值代表「是迴文」，應該是什麼？', explain: '初始值設為 "not" 代表預設就是「非迴文」，邏輯相反。正確寫法的初始值應為空字串 ""，找到不匹配時才設為 "not"。', correct: 'Dim ans As String = ""' },
                { lineNum: '第 5 行', tokens: ['Dim i ', 'As String ', '= 0'], errorIndex: 1, hint: '迴圈計數器應該用哪一種型別？', explain: '做為字串索引的計數器 i 必須是整數型態，應該宣告為 As Integer，不能宣告為字串。', correct: 'Dim i As Integer = 0' },
                { lineNum: '第 6 行', tokens: ['Do ', 'Until ', 'i <= s.Length \\ 2 - 1'], errorIndex: 1, hint: '題目是要在條件成立時繼續執行，還是直到條件成立時停止？', explain: '這裡的邏輯是「當 i 還在前半段時繼續比較」，所以要用 Do While (當...時執行)，而不是 Do Until (直到...時停止)。', correct: 'Do While i <= s.Length \\ 2 - 1' },
                { lineNum: '第 7 行', tokens: ['If ', 's(i) ', '= ', 's(s.Length - i - 1)'], errorIndex: 2, hint: '要判斷「不相等」應該用哪個運算子？', explain: '「=」是相等比較，但這行要判斷的是「頭尾字元不相等」時才執行後續動作，應改為 <> (不等於)。', correct: 'If s(i) <> s(s.Length - i - 1) Then' },
                { lineNum: '第 8 行', tokens: ['ans ', '= ', '"no"'], errorIndex: 2, hint: '最後一列輸出時會和哪個字串比較？', explain: '「"no"」與題目後段輸出判斷用的字串不符。預期的非迴文標記是 "not"，應改為 ans = "not"。', correct: 'ans = "not"' },
                { lineNum: '第 9 行', tokens: ['Exit ', 'While'], errorIndex: 1, hint: '跳出 Do 迴圈的語法是什麼？', explain: '在 VB.NET 中，跳出 Do 迴圈的關鍵字是 Exit Do，而不是 Exit While。', correct: 'Exit Do' },
                { lineNum: '第 11 行', tokens: ['i ', '*= ', '1'], errorIndex: 1, hint: '迴圈每次執行完，計數器應該要怎麼變動？', explain: '計數器 i 應該要加 1 才對，如果是 *= 1，i 的值永遠不會改變，會造成無窮迴圈！正確是 += 1。', correct: 'i += 1' },
                { lineNum: '第 12 行', tokens: ['End ', 'Do'], errorIndex: 0, hint: 'Do 迴圈的結尾是什麼？', explain: 'Do 迴圈的搭配結尾是 Loop，並沒有 End Do 這種語法。', correct: 'Loop' }
            ],
            "T03": [
                { lineNum: '第 2 行', tokens: ['Dim f ', 'As New ', 'StreamWriter', '(Application.StartupPath & "\\Q1.txt")'], errorIndex: 2, hint: '要讀取檔案，應該用哪個類別？', explain: '「StreamWriter」是用來寫入檔案的類別。要讀取文字檔，應改用 StreamReader。', correct: 'Dim f As New StreamReader(Application.StartupPath & "\\Q1.txt")' },
                { lineNum: '第 3 行', tokens: ['Dim s ', 'As Integer ', '= f.ReadLine()'], errorIndex: 1, hint: 'ReadLine() 回傳的是什麼型別？', explain: '「As Integer」宣告的是整數變數，但 f.ReadLine() 回傳的是字串（String），型別不符合。應改為 As String。', correct: 'Dim s As String = f.ReadLine()' },
                { lineNum: '第 4 行', tokens: ['Dim ans ', 'As String ', '= ', '"not"'], errorIndex: 3, hint: '初始值代表「是迴文」，應該是什麼？', explain: '初始值設為 "not" 代表預設就是「非迴文」，邏輯相反。正確寫法的初始值應為空字串 ""，找到不匹配時才設為 "not"。', correct: 'Dim ans As String = ""' },
                { lineNum: '第 5 行', tokens: ['Dim i ', 'As Decimal ', '= 0'], errorIndex: 1, hint: '迴圈計數器應該用哪一種型別？', explain: '做為字串索引的計數器 i 必須是整數型態，應該宣告為 As Integer，不需要宣告為小數 Decimal。', correct: 'Dim i As Integer = 0' },
                { lineNum: '第 6 行', tokens: ['Do ', 'Loop'], errorIndex: 1, hint: '迴圈開頭只需要什麼關鍵字？', explain: '這是一個後測試迴圈，開頭只需要保留 Do 即可，Loop 是放在結尾的。', correct: 'Do' },
                { lineNum: '第 7 行', tokens: ['If ', 's(i) ', '= ', 's(s.Length - i - 1)'], errorIndex: 2, hint: '要判斷「不相等」應該用哪個運算子？', explain: '「=」是相等比較，但這行要判斷的是「頭尾字元不相等」時才執行後續動作，應改為 <> (不等於)。', correct: 'If s(i) <> s(s.Length - i - 1) Then' },
                { lineNum: '第 8 行', tokens: ['ans ', '= ', '"no"'], errorIndex: 2, hint: '最後一列輸出時會和哪個字串比較？', explain: '「"no"」與題目後段輸出判斷用的字串不符。預期的非迴文標記是 "not"，應改為 ans = "not"。', correct: 'ans = "not"' },
                { lineNum: '第 9 行', tokens: ['Continue ', 'Do'], errorIndex: 0, hint: '找到不匹配後，應該立即離開迴圈，用哪個關鍵字？', explain: '「Continue Do」會跳過當下這輪並繼續下一次迴圈，但我們要直接中斷並跳出，應使用 Exit Do。', correct: 'Exit Do' },
                { lineNum: '第 11 行', tokens: ['i ', '-= ', '1'], errorIndex: 1, hint: '迴圈變數的進度方向錯了！', explain: '字串比對是從頭開始遞增往中間檢查，應該是向右推進 (加 1)，寫成 -= 1 會導致索引出錯。', correct: 'i += 1' },
                { lineNum: '第 12 行', tokens: ['Loop ', 'Until ', 'i <= s.Length \\ 2 - 1'], errorIndex: 1, hint: '條件中寫的是當 i 在前半段時，應該配什麼關鍵字？', explain: '「i <= 一半長度」是迴圈要「繼續執行」的條件，所以要用 Loop While (當...時繼續)。若是 Loop Until，意思會變成直到符合才停止，邏輯相反。', correct: 'Loop While i <= s.Length \\ 2 - 1' }
            ]
        }
    },
    "Q2": {
        title: "直角三角形列印",
        procedure_start: [
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "'* 11900-1060302 Program Start *", zh: "程式註解：題號 程式開始" },
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "Private Sub Q2()", zh: "宣告名為 Q2 的私有副程式", hint: "Private Sub Q2()" }
        ],
        loop_variants: {
            "T01": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060302.T01\")", zh: "新增檔案讀取物件 f，讀取 1060302.T01 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060302.T01\")" },
                { raw: "        Dim n As Integer = f.ReadLine()", zh: "定義整數型態變數 n，從檔案讀取一行存入該變數", hint: "Dim n As Integer = f.ReadLine()" },
                { raw: "        RichTextBox1.Text &= \"第二題結果：\" & vbCrLf", zh: "將第二題結果：串接到RichTextBox1後面", hint: "RichTextBox1.Text &= \"第二題結果：\" & vbCrLf" },
                { raw: "        For i = 1 To n", zh: "設定 For 迴圈 i 從 1 到 n", hint: "For i = 1 To n" },
                { raw: "            For j = 1 To i", zh: "設定 For 迴圈 j 從 1 到 i", hint: "For j = 1 To i" },
                { raw: "                RichTextBox1.Text &= j", zh: "將變數 j 附加至 RichTextBox1", hint: "RichTextBox1.Text &= j" },
                { raw: "            Next j", zh: "下個 j", hint: "Next j" },
                { raw: "            RichTextBox1.Text &= vbCrLf", zh: "將換行字元附加至 RichTextBox1", hint: "RichTextBox1.Text &= vbCrLf" },
                { raw: "        Next i", zh: "下個 i", hint: "Next i" }
            ],
            "T02": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060302.T02\")", zh: "新增檔案讀取物件 f，讀取 1060302.T02 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060302.T02\")" },
                { raw: "        Dim n As Integer = f.ReadLine()", zh: "定義整數型態變數 n，從檔案讀取一行存入該變數", hint: "Dim n As Integer = f.ReadLine()" },
                { raw: "        RichTextBox1.Text &= \"第二題結果：\" & vbCrLf", zh: "將第二題結果：串接到RichTextBox1後面", hint: "RichTextBox1.Text &= \"第二題結果：\" & vbCrLf" },
                { raw: "        Dim i As Integer = 1", zh: "定義整數型態變數 i 並設定為 1", hint: "Dim i As Integer = 1" },
                { raw: "        Do While i <= n", zh: "當  i <= n 執行迴圈", hint: "Do While i <= n" },
                { raw: "            Dim j As Integer = 1", zh: "定義整數型態變數 j 並設定為 1", hint: "Dim j As Integer = 1" },
                { raw: "            Do While j <= i", zh: "當  j <= i 執行迴圈", hint: "Do While j <= i" },
                { raw: "                RichTextBox1.Text &= j", zh: "將變數 j 附加至 RichTextBox1", hint: "RichTextBox1.Text &= j" },
                { raw: "                j += 1", zh: "把 j 加 1", hint: "j += 1" },
                { raw: "            Loop", zh: "從頭執行迴圈", hint: "Loop" },
                { raw: "            RichTextBox1.Text &= vbCrLf", zh: "將換行字元附加至 RichTextBox1", hint: "RichTextBox1.Text &= vbCrLf" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        Loop", zh: "從頭執行迴圈", hint: "Loop" }
            ],
            "T03": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060302.T03\")", zh: "新增檔案讀取物件 f，讀取 1060302.T03 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060302.T03\")" },
                { raw: "        Dim n As Integer = f.ReadLine()", zh: "定義整數型態變數 n，從檔案讀取一行存入該變數", hint: "Dim n As Integer = f.ReadLine()" },
                { raw: "        RichTextBox1.Text &= \"第二題結果：\" & vbCrLf", zh: "將第二題結果：串接到RichTextBox1後面", hint: "RichTextBox1.Text &= \"第二題結果：\" & vbCrLf" },
                { raw: "        Dim i As Integer = 1", zh: "定義整數型態變數 i 並設定為 1", hint: "Dim i As Integer = 1" },
                { raw: "        Do", zh: "迴圈開頭 Do", hint: "Do" },
                { raw: "            Dim j As Integer = 1", zh: "定義整數型態變數 j 並設定為 1", hint: "Dim j As Integer = 1" },
                { raw: "            Do", zh: "迴圈開頭 Do", hint: "Do" },
                { raw: "                RichTextBox1.Text &= j", zh: "將變數 j 附加至 RichTextBox1", hint: "RichTextBox1.Text &= j" },
                { raw: "                j += 1", zh: "把 j 加 1", hint: "j += 1" },
                { raw: "            Loop While j <= i", zh: "當  j <= i 執行迴圈", hint: "Loop While j <= i" },
                { raw: "            RichTextBox1.Text &= vbCrLf", zh: "將換行字元附加至 RichTextBox1", hint: "RichTextBox1.Text &= vbCrLf" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        Loop While i <= n", zh: "當 i <= n 時，執行 Do While 迴圈", hint: "Loop While i <= n" }
            ]
        },
        variant_bug_tests: {
            "T01": [
                { lineNum: '第 2 行', tokens: ['Dim n ', 'As String ', '= f.ReadLine()'], errorIndex: 1, hint: '變數 n 要做迴圈次數，型別應該為何？', explain: '應宣告為 As Integer，字串型態不應用於數學與計數運算。', correct: 'Dim n As Integer = f.ReadLine()' },
                { lineNum: '第 4 行', tokens: ['For i = ', '0 ', 'To n'], errorIndex: 1, hint: '直角三角形的第一列要印幾個數字？', explain: '第一列只印 1 個字，所以計數器初始應為 1，改為 0 會多印一列。', correct: 'For i = 1 To n' },
                { lineNum: '第 5 行', tokens: ['For j = 1 To ', 'n'], errorIndex: 1, hint: '內層迴圈要印到多少為止？', explain: '內層迴圈的次數會隨著外層 i 的增加而變多，所以上限應為 i 而不是 n。', correct: 'For j = 1 To i' },
                { lineNum: '第 6 行', tokens: ['RichTextBox1.Text ', '= ', 'j'], errorIndex: 1, hint: '要保留之前的輸出，應該用什麼運算子？', explain: '使用「=」會將原本的文字覆蓋掉，應使用「&=」將結果附加到現有文字之後。', correct: 'RichTextBox1.Text &= j' },
                { lineNum: '第 7 行', tokens: ['End ', 'For'], errorIndex: 0, hint: 'For 迴圈的結尾是什麼？', explain: 'VB.NET 的 For 迴圈應使用 Next 結尾，沒有 End For 語法。', correct: 'Next' }
            ],
            "T02": [
                { lineNum: '第 5 行', tokens: ['Do ', 'While ', 'i < n'], errorIndex: 2, hint: '最後一列 n 需不需印出來？', explain: '條件若寫作 i < n 會少印最後一列，應改為 i <= n 包含邊界。', correct: 'Do While i <= n' },
                { lineNum: '第 7 行', tokens: ['Do ', 'Until ', 'j <= i'], errorIndex: 1, hint: '這行的意思是「直到 j <= i 才停止」還是「當 j <= i 繼續做」？', explain: '應使用 Do While 當條件成立時執行。若用 Do Until 會變成只要 j <= i 就不做事。', correct: 'Do While j <= i' },
                { lineNum: '第 9 行', tokens: ['j ', '-= ', '1'], errorIndex: 1, hint: '計數器要越來越大還是越來越小？', explain: '數字應往上數才能達到上限 i，改為 -= 1 會導致無窮迴圈，應寫 += 1。', correct: 'j += 1' },
                { lineNum: '第 10 行', tokens: ['End ', 'Do'], errorIndex: 0, hint: 'Do 迴圈的結尾是什麼關鍵字？', explain: 'Do 迴圈的結尾標記是 Loop，並沒有 End Do 這種語法。', correct: 'Loop' },
                { lineNum: '第 12 行', tokens: ['j ', '+= 1'], errorIndex: 0, hint: '外層迴圈是要控制哪一個變數？', explain: '外層迴圈依賴變數 i 作為計數，如果不增加 i 而增加 j，會導致外層陷入無窮迴圈，應為 i += 1。', correct: 'i += 1' }
            ],
            "T03": [
                { lineNum: '第 4 行', tokens: ['Dim i ', 'As Decimal ', '= 1'], errorIndex: 1, hint: '這是一個整數計數器，需要宣告成 Decimal 嗎？', explain: '作為迴圈控制使用整數即可，應宣告成 As Integer，避免浮點數運算潛在問題。', correct: 'Dim i As Integer = 1' },
                { lineNum: '第 6 行', tokens: ['Loop'], errorIndex: 0, hint: '迴圈起頭應該用什麼字？', explain: '迴圈開頭應使用 Do，Loop 是用來放在迴圈結尾搭配的。', correct: 'Do' },
                { lineNum: '第 8 行', tokens: ['RichTextBox1.Text ', '+= ', 'j'], errorIndex: 1, hint: 'VB 字串串接用什麼特殊運算子？', explain: '字串附加應使用 &= 運算子，不建議在字串上使用數值加法的 +=。', correct: 'RichTextBox1.Text &= j' },
                { lineNum: '第 9 行', tokens: ['j ', '= ', '+ 1'], errorIndex: 1, hint: '這樣寫是賦值還是累加？', explain: '= + 1 意思是把 j 設成 1，而不是加 1！累加要寫 j += 1。', correct: 'j += 1' },
                { lineNum: '第 10 行', tokens: ['Loop ', 'Until ', 'j <= i'], errorIndex: 1, hint: '結尾的意思是要讓迴圈繼續還是停止？', explain: '應使用 Loop While 讓條件成立時「繼續」。若用 Until 則變成條件成立時「停止」，將只印一個字。', correct: 'Loop While j <= i' }
            ]
        },
        procedure_end: [
            { raw: "    End Sub", zh: "結束副程式 Sub", hint: "End Sub" }
        ],
        match_results: [
            { code: "Dim n = 3\nFor i = 1 To n\n  For j = 1 To i\n    Console.Write(j)\n  Next\n  Console.WriteLine()\nNext", result: "1\n12\n123" },
            { code: "Dim n = 3\nFor i = 1 To n\n  For j = 1 To n\n    Console.Write(\"*\")\n  Next\n  Console.WriteLine()\nNext", result: "***\n***\n***" },
            { code: "Dim n = 3\nFor i = 1 To n\n  For j = 1 To i\n    Console.Write(\"*\")\n  Next\n  Console.WriteLine()\nNext", result: "*\n**\n***" },
            { code: "Dim n = 3\nFor i = n DownTo 1 Step -1\n  For j = 1 To i\n    Console.Write(j)\n  Next\n  Console.WriteLine()\nNext", result: "123\n12\n1" }
        ],
        variant_match_results: {
            "T02": [
                { code: "Dim n = 3\nDim i As Integer = 1\nDo While i <= n\n  Dim j As Integer = 1\n  Do While j <= i\n    Console.Write(j)\n    j += 1\n  Loop\n  Console.WriteLine()\n  i += 1\nLoop", result: "1\n12\n123" },
                { code: "Dim n = 3\nDim i As Integer = 1\nDo While i <= n\n  Dim j As Integer = 1\n  Do While j <= n\n    Console.Write(\"*\")\n    j += 1\n  Loop\n  Console.WriteLine()\n  i += 1\nLoop", result: "***\n***\n***" },
                { code: "Dim n = 3\nDim i As Integer = 1\nDo While i <= n\n  Dim j As Integer = 1\n  Do While j <= i\n    Console.Write(\"*\")\n    j += 1\n  Loop\n  Console.WriteLine()\n  i += 1\nLoop", result: "*\n**\n***" },
                { code: "Dim n = 3\nDim i As Integer = n\nDo While i >= 1\n  Dim j As Integer = 1\n  Do While j <= i\n    Console.Write(j)\n    j += 1\n  Loop\n  Console.WriteLine()\n  i -= 1\nLoop", result: "123\n12\n1" }
            ],
            "T03": [
                { code: "Dim n = 3\nDim i As Integer = 1\nDo\n  Dim j As Integer = 1\n  Do\n    Console.Write(j)\n    j += 1\n  Loop While j <= i\n  Console.WriteLine()\n  i += 1\nLoop While i <= n", result: "1\n12\n123" },
                { code: "Dim n = 3\nDim i As Integer = 1\nDo\n  Dim j As Integer = 1\n  Do\n    Console.Write(\"*\")\n    j += 1\n  Loop While j <= n\n  Console.WriteLine()\n  i += 1\nLoop While i <= n", result: "***\n***\n***" },
                { code: "Dim n = 3\nDim i As Integer = 1\nDo\n  Dim j As Integer = 1\n  Do\n    Console.Write(\"*\")\n    j += 1\n  Loop While j <= i\n  Console.WriteLine()\n  i += 1\nLoop While i <= n", result: "*\n**\n***" },
                { code: "Dim n = 3\nDim i As Integer = n\nDo\n  Dim j As Integer = 1\n  Do\n    Console.Write(j)\n    j += 1\n  Loop While j <= i\n  Console.WriteLine()\n  i -= 1\nLoop While i >= 1", result: "123\n12\n1" }
            ]
        }
    },
    "Q3": {
        title: "質數計算",
        procedure_start: [
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "'* 11900-1060303 Program Start *", zh: "程式註解：題號 程式開始" },
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "Private Sub Q3()", zh: "宣告私有副程式 Q3", hint: "Private Sub Q3()" }
        ],
        loop_variants: {
            "T01": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060303.T01\")", zh: "新增檔案讀取物件 f，讀取 1060303.T01 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060303.T01\")" },
                { raw: "        Dim n As Integer = f.ReadLine()", zh: "定義整數型態變數 n，從檔案讀取一行存入該變數", hint: "Dim n As Integer = f.ReadLine()" },
                { raw: "        Dim ans As String = \"\"", zh: "定義 ans 為字串型態，並初始化 ans 為空字串", hint: "Dim ans As String = \"\"" },
                { raw: "        For i = 2 To n - 1", zh: "設定 For 迴圈 i 從 2 到 n - 1", hint: "For i = 2 To n - 1" },
                { raw: "            If n Mod i = 0 Then", zh: "若 n 能夠被 i 整除", hint: "If n Mod i = 0 Then" },
                { raw: "                ans = \"not\"", zh: "將 ans 設為 not", hint: "ans = \"not\"" },
                { raw: "                Exit For", zh: "跳出 For 迴圈", hint: "Exit For" },
                { raw: "            End If", zh: "結束 If 判斷式", hint: "End If" },
                { raw: "        Next i", zh: "下一個 i", hint: "Next i" }
            ],
            "T02": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060303.T02\")", zh: "新增檔案讀取物件 f，讀取 1060303.T02 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060303.T02\")" },
                { raw: "        Dim n As Integer = f.ReadLine()", zh: "定義整數型態變數 n，從檔案讀取一行存入該變數", hint: "Dim n As Integer = f.ReadLine()" },
                { raw: "        Dim ans As String = \"\"", zh: "定義字串變數 ans，並初始化為空字串", hint: "Dim ans As String = \"\"" },
                { raw: "        Dim i As Integer = 2", zh: "定義整數型態變數 i，並初始化為 2", hint: "Dim i As Integer = 2" },
                { raw: "        Do While i <= n - 1", zh: "當  i <= n - 1 執行迴圈", hint: "Do While i <= n - 1" },
                { raw: "            If n Mod i = 0 Then", zh: "若 n 能夠被 i 整除", hint: "If n Mod i = 0 Then" },
                { raw: "                ans = \"not\"", zh: "將 ans 設為 not", hint: "ans = \"not\"" },
                { raw: "                Exit Do", zh: "跳出 Do 迴圈", hint: "Exit Do" },
                { raw: "            End If", zh: "結束 If 判斷式", hint: "End If" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        Loop", zh: "從頭執行迴圈", hint: "Loop" }
            ],
            "T03": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060303.T03\")", zh: "新增檔案讀取物件 f，讀取 1060303.T03 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060303.T03\")" },
                { raw: "        Dim n As Integer = f.ReadLine()", zh: "定義整數型態變數 n，從檔案讀取一行存入該變數", hint: "Dim n As Integer = f.ReadLine()" },
                { raw: "        Dim ans As String = \"\"", zh: "定義字串變數 ans，並初始化為空字串", hint: "Dim ans As String = \"\"" },
                { raw: "        Dim i As Integer = 2", zh: "定義整數型態變數 i，並初始化為 2", hint: "Dim i As Integer = 2" },
                { raw: "        Do", zh: "迴圈開頭 Do", hint: "Do" },
                { raw: "            If n Mod i = 0 Then", zh: "若 n 能夠被 i 整除", hint: "If n Mod i = 0 Then" },
                { raw: "                ans = \"not\"", zh: "將 ans 設為 not", hint: "ans = \"not\"" },
                { raw: "                Exit Do", zh: "跳出 Do 迴圈", hint: "Exit Do" },
                { raw: "            End If", zh: "結束 If 判斷式", hint: "End If" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        Loop While i <= n - 1", zh: "當 i <= n - 1 執行迴圈", hint: "Loop While i <= n - 1" }
            ]
        },
        variant_bug_tests: {
            "T01": [
                { lineNum: '第 4 行', tokens: ['Dim ans ', 'As String ', '= ', '"not"'], errorIndex: 3, hint: '若一開始假設為質數，初始值應該是什麼？', explain: '題目是判斷是否為質數，若以空字串代表質數，"not" 代表不是質數，初始應該假設為質數（空字串）。', correct: 'Dim ans As String = ""' },
                { lineNum: '第 5 行', tokens: ['For i = ', '1 ', 'To n - 1'], errorIndex: 1, hint: '判斷質數時可以除以 1 嗎？', explain: '任何整數除以 1 餘數都為 0，這會把所有數字都判定為不是質數。應該從 2 開始除。', correct: 'For i = 2 To n - 1' },
                { lineNum: '第 6 行', tokens: ['If ', 'n ', '\\ ', 'i = 0 Then'], errorIndex: 2, hint: '要判斷是否整除，應該用哪個運算子？', explain: '「\\」是整數除法，只取商；要判斷是否整除必須用「Mod」來取餘數，判斷餘數是否為 0。', correct: 'If n Mod i = 0 Then' },
                { lineNum: '第 7 行', tokens: ['ans ', '= ', '"no"'], errorIndex: 2, hint: '不是質數時，字串應該標記為什麼？', explain: '依據題目要求，輸出格式為 "is not a prime number"，因此這裡應該標記為 "not"。', correct: 'ans = "not"' },
                { lineNum: '第 8 行', tokens: ['Continue ', 'For'], errorIndex: 0, hint: '只要找到一個除數，還需要繼續檢查後面的數字嗎？', explain: '只要能被任何數字整除就不再是質數，應該立即終止迴圈以節省運算時間，請使用 Exit For。', correct: 'Exit For' }
            ],
            "T02": [
                { lineNum: '第 5 行', tokens: ['Dim i ', 'As Integer ', '= 0'], errorIndex: 2, hint: '檢查質數時，除數可以從 0 開始嗎？', explain: '任何數字除以 0 都會發生「除以零」的嚴重錯誤，除數應從 2 開始檢查。', correct: 'Dim i As Integer = 2' },
                { lineNum: '第 6 行', tokens: ['Do ', 'While ', 'i < n - 1'], errorIndex: 2, hint: '條件若寫作 i < n - 1 會漏查哪一個數字？', explain: '為了完整檢查到 n-1 的數字，需包含邊界，應改為 i <= n - 1。', correct: 'Do While i <= n - 1' },
                { lineNum: '第 7 行', tokens: ['If ', 'n Mod i ', '= 1 ', 'Then'], errorIndex: 2, hint: '整除的意思是餘數為多少？', explain: '能被整除代表餘數為 0，不是 1。所以應該寫 n Mod i = 0。', correct: 'If n Mod i = 0 Then' },
                { lineNum: '第 9 行', tokens: ['Exit ', 'While'], errorIndex: 1, hint: '跳出 Do 迴圈的語法是什麼？', explain: '在 VB.NET 中，跳出 Do 迴圈的關鍵字是 Exit Do，而不是 Exit While。', correct: 'Exit Do' },
                { lineNum: '第 11 行', tokens: ['i ', '-= ', '1'], errorIndex: 1, hint: '除數要越來越大還是越來越小？', explain: '數字應往上數才能達到上限 n-1 進行完整的除數檢查，寫成 -= 1 會導致無窮迴圈，應寫 += 1。', correct: 'i += 1' }
            ],
            "T03": [
                { lineNum: '第 5 行', tokens: ['Dim i ', 'As Decimal ', '= 2'], errorIndex: 1, hint: '這是一個整數除數計數器，需要宣告成 Decimal 嗎？', explain: '作為迴圈控制與除數使用整數即可，應宣告成 As Integer，避免浮點數運算混淆。', correct: 'Dim i As Integer = 2' },
                { lineNum: '第 6 行', tokens: ['Loop'], errorIndex: 0, hint: '迴圈起頭應該用什麼字？', explain: '迴圈開頭應使用 Do，Loop 是用來放在迴圈結尾搭配的。', correct: 'Do' },
                { lineNum: '第 8 行', tokens: ['ans ', '= ', '"yes"'], errorIndex: 2, hint: '能被整除代表「不是質數」，字串應設定什麼？', explain: '能被 2 到 n-1 整除，代表該數字有其他因數，因此「不是」質數，標記應設為 "not"。', correct: 'ans = "not"' },
                { lineNum: '第 11 行', tokens: ['i ', '*= ', '1'], errorIndex: 1, hint: '這樣會增加除數嗎？', explain: 'i *= 1 表示 i 乘以 1 原封不動，這會導致 i 一直卡在 2 形成無窮迴圈。應該寫 += 1。', correct: 'i += 1' },
                { lineNum: '第 12 行', tokens: ['Loop ', 'Until ', 'i <= n - 1'], errorIndex: 1, hint: '結尾的意思是要讓迴圈繼續還是停止？', explain: '應使用 Loop While 讓條件成立時「繼續」。若用 Until 則變成小於等於 n-1 時就「馬上停止」。', correct: 'Loop While i <= n - 1' }
            ]
        },
        procedure_end: [
            { raw: "        RichTextBox1.Text &= \"第三題結果：\" & n & \" is \" & ans & \" a prime number.\" & vbCrLf", zh: "將第三題結果串接到 RichTextBox1", hint: "RichTextBox1.Text &= \"第三題結果：\" & n & \" is \" & ans & \" a prime number.\" & vbCrLf" },
            { raw: "    End Sub", zh: "結束副程式 Sub", hint: "End Sub" }
        ],
        match_results: [
            { code: "Dim n = 5\nDim ans = \"\"\nFor i = 2 To n - 1\n  If n Mod i = 0 Then ans = \"not\"\nNext\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "Y" },
            { code: "Dim n = 6\nDim ans = \"\"\nFor i = 2 To n - 1\n  If n Mod i = 0 Then ans = \"not\"\nNext\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "N" },
            { code: "Dim n = 7\nDim ans = \"\"\nFor i = 2 To n - 1\n  If n Mod i = 0 Then ans = \"not\"\nNext\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "Y" },
            { code: "Dim n = 9\nDim ans = \"\"\nFor i = 2 To n - 1\n  If n Mod i = 0 Then ans = \"not\"\nNext\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "N" }
        ],
        variant_match_results: {
            "T02": [
                { code: "Dim n = 5\nDim ans = \"\"\nDim i As Integer = 2\nDo While i <= n - 1\n  If n Mod i = 0 Then ans = \"not\"\n  i += 1\nLoop\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "Y" },
                { code: "Dim n = 6\nDim ans = \"\"\nDim i As Integer = 2\nDo While i <= n - 1\n  If n Mod i = 0 Then ans = \"not\"\n  i += 1\nLoop\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "N" },
                { code: "Dim n = 7\nDim ans = \"\"\nDim i As Integer = 2\nDo While i <= n - 1\n  If n Mod i = 0 Then ans = \"not\"\n  i += 1\nLoop\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "Y" },
                { code: "Dim n = 9\nDim ans = \"\"\nDim i As Integer = 2\nDo While i <= n - 1\n  If n Mod i = 0 Then ans = \"not\"\n  i += 1\nLoop\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "N" }
            ],
            "T03": [
                { code: "Dim n = 5\nDim ans = \"\"\nDim i As Integer = 2\nDo\n  If n Mod i = 0 Then ans = \"not\"\n  i += 1\nLoop While i <= n - 1\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "Y" },
                { code: "Dim n = 6\nDim ans = \"\"\nDim i As Integer = 2\nDo\n  If n Mod i = 0 Then ans = \"not\"\n  i += 1\nLoop While i <= n - 1\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "N" },
                { code: "Dim n = 7\nDim ans = \"\"\nDim i As Integer = 2\nDo\n  If n Mod i = 0 Then ans = \"not\"\n  i += 1\nLoop While i <= n - 1\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "Y" },
                { code: "Dim n = 9\nDim ans = \"\"\nDim i As Integer = 2\nDo\n  If n Mod i = 0 Then ans = \"not\"\n  i += 1\nLoop While i <= n - 1\nIf ans = \"not\" Then Print(\"N\") Else Print(\"Y\")", result: "N" }
            ]
        }
    },
    "Q4": {
        title: "BMI值計算",
        procedure_start: [
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "'* 11900-1060304 Program Start *", zh: "程式註解：題號 程式開始" },
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "Private Sub Q4()", zh: "宣告私有副程式 Q4", hint: "Private Sub Q4()" }
        ],
        loop_variants: {
            "T01": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060304.T01\")", zh: "新增檔案讀取物件 f，讀取 1060304.T01 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060304.T01\")" },
                { raw: "        Dim min As Integer = 99", zh: "定義 min 為整數型態，並初始化 min 為 99", hint: "Dim min As Integer = 99" },
                { raw: "        For i = 1 To 3", zh: "設定 For 迴圈 i 從 1 到 3", hint: "For i = 1 To 3" },
                { raw: "            Dim data As String() = f.ReadLine().Split(\",\")", zh: "從檔案讀取一行，並以逗號分割，放入字串陣列", hint: "Dim data As String() = f.ReadLine().Split(\",\")" },
                { raw: "            Dim bmi As Integer = data(1) / (data(0) / 100) ^ 2", zh: "依照 BMI 公式 = 體重(公斤) / (身高(公分) / 100) 的平方，計算 bmi", hint: "Dim bmi As Integer = data(1) / (data(0) / 100) ^ 2" },
                { raw: "            If bmi < min Then min = bmi", zh: "判斷若 bmi < min 則更新最小值 min 為 bmi", hint: "If bmi < min Then min = bmi" },
                { raw: "        Next i", zh: "下一個 i", hint: "Next i" },
                { raw: "        Dim ans As String = \"不正常\"", zh: "定義 ans 為字串型態，並初始化 ans 為不正常", hint: "Dim ans As String = \"不正常\"" },
                { raw: "        If min >= 20 And min <= 25 Then ans = \"正常\"", zh: "若 min 在 20 到 25 之間，設定 ans 為正常", hint: "If min >= 20 And min <= 25 Then ans = \"正常\"" },
                { raw: "        RichTextBox1.Text &= \"第四題結果：最小 BMI 值=\" & min & \"，\" & ans & vbCrLf", zh: "將第四題結果輸出至 RichTextBox1 並換行", hint: "RichTextBox1.Text &= \"第四題結果：最小 BMI 值=\" & min & \"，\" & ans & vbCrLf" }
            ],
            "T02": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060304.T02\")", zh: "新增檔案讀取物件 f，讀取 1060304.T02 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060304.T02\")" },
                { raw: "        Dim min As Integer = 99", zh: "定義 min 整數型態，並初始化為 99", hint: "Dim min As Integer = 99" },
                { raw: "        Dim i As Integer", zh: "宣告整數變數 i", hint: "Dim i As Integer" },
                { raw: "        Do While i < 3", zh: "當 i < 3 時執行迴圈", hint: "Do While i < 3" },
                { raw: "            Dim data As String() = f.ReadLine().Split(\",\")", zh: "從檔案讀取一行，並以逗號分割，放入字串陣列", hint: "Dim data As String() = f.ReadLine().Split(\",\")" },
                { raw: "            Dim bmi As Integer = data(1) / (data(0) / 100) ^ 2", zh: "依照 BMI 公式 = 體重(公斤) / (身高(公分) / 100) 的平方，計算 bmi", hint: "Dim bmi As Integer = data(1) / (data(0) / 100) ^ 2" },
                { raw: "            If bmi < min Then min = bmi", zh: "判斷若 bmi < min 則更新最小值 min 為 bmi", hint: "If bmi < min Then min = bmi" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        Loop", zh: "從頭執行迴圈", hint: "Loop" },
                { raw: "        Dim ans As String = \"不正常\"", zh: "定義 ans 為字串型態，並初始化 ans 為不正常", hint: "Dim ans As String = \"不正常\"" },
                { raw: "        If min >= 20 And min <= 25 Then ans = \"正常\"", zh: "若 min 在 20 到 25 之間，設定 ans 為正常", hint: "If min >= 20 And min <= 25 Then ans = \"正常\"" },
                { raw: "        RichTextBox1.Text &= \"第四題結果：最小 BMI 值=\" & min & \"，\" & ans & vbCrLf", zh: "將第四題結果輸出至 RichTextBox1 並換行", hint: "RichTextBox1.Text &= \"第四題結果：最小 BMI 值=\" & min & \"，\" & ans & vbCrLf" }
            ],
            "T03": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060304.T03\")", zh: "新增檔案讀取物件 f，讀取 1060304.T03 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060304.T03\")" },
                { raw: "        Dim min As Integer = 99", zh: "定義 min 為整數型態，並初始化 min 為 99", hint: "Dim min As Integer = 99" },
                { raw: "        Dim i As Integer = 1", zh: "定義整數型態變數 i 並設定為 1", hint: "Dim i As Integer = 1" },
                { raw: "        Do", zh: "迴圈開頭 Do", hint: "Do" },
                { raw: "            Dim data As String() = f.ReadLine().Split(\",\")", zh: "從檔案讀取一行，並以逗號分割，放入字串陣列", hint: "Dim data As String() = f.ReadLine().Split(\",\")" },
                { raw: "            Dim bmi As Integer = data(1) / (data(0) / 100) ^ 2", zh: "依照 BMI 公式 = 體重(公斤) / (身高(公分) / 100) 的平方，計算 bmi", hint: "Dim bmi As Integer = data(1) / (data(0) / 100) ^ 2" },
                { raw: "            If bmi < min Then min = bmi", zh: "判斷若 bmi < min 則更新最小值 min 為 bmi", hint: "If bmi < min Then min = bmi" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        Loop While i <= 3", zh: "當 i <= 3 時執行迴圈", hint: "Loop While i <= 3" },
                { raw: "        Dim ans As String = \"不正常\"", zh: "定義 ans 為字串型態，並初始化 ans 為不正常", hint: "Dim ans As String = \"不正常\"" },
                { raw: "        If min >= 20 And min <= 25 Then ans = \"正常\"", zh: "若 min 在 20 到 25 之間，設定 ans 為正常", hint: "If min >= 20 And min <= 25 Then ans = \"正常\"" },
                { raw: "        RichTextBox1.Text &= \"第四題結果：最小 BMI 值=\" & min & \"，\" & ans & vbCrLf", zh: "將第四題結果輸出至 RichTextBox1 並換行", hint: "RichTextBox1.Text &= \"第四題結果：最小 BMI 值=\" & min & \"，\" & ans & vbCrLf" }
            ]
        },
        variant_bug_tests: {
            "T01": [
                { lineNum: '第 3 行', tokens: ['Dim min ', 'As Integer ', '= ', '0'], errorIndex: 3, hint: '找最小值時，初始預設值應該要很大還是很小？', explain: '若要找最小值，初始值必須設定為一個極大的範圍外數值（如 99），若設為 0 會導致比 0 大的 BMI 都選不進去。', correct: 'Dim min As Integer = 99' },
                { lineNum: '第 4 行', tokens: ['For i = ', '0 ', 'To 3'], errorIndex: 1, hint: '這樣會執行幾次？', explain: '從 0 到 3 會執行 4 次，但題目明確只有 3 筆測資，所以應改為 For i = 1 To 3。', correct: 'For i = 1 To 3' },
                { lineNum: '第 6 行', tokens: ['Dim bmi ', 'As String ', '= data(1) / (data(0) / 100) ^ 2'], errorIndex: 1, hint: 'BMI 要做大小比較，應該用什麼型態？', explain: '經過純數學公式計算出來的數值，應該存在數值型態 (Integer 或 Double) 而非字串 (String)。', correct: 'Dim bmi As Integer = data(1) / (data(0) / 100) ^ 2' },
                { lineNum: '第 7 行', tokens: ['If ', 'bmi > min ', 'Then min = bmi'], errorIndex: 1, hint: '是要找最大的 BMI 還是最小的 BMI？', explain: '若是大於才更新，就會變成找最大值！題目要找最小值，所以運算子應改為 <。', correct: 'If bmi < min Then min = bmi' },
                { lineNum: '第 8 行', tokens: ['End ', 'For'], errorIndex: 0, hint: 'For 迴圈的結尾是什麼？', explain: 'VB.NET 的 For 迴圈應使用 Next 結尾，沒有 End For 語法。', correct: 'Next i' }
            ],
            "T02": [
                { lineNum: '第 3 行', tokens: ['Dim min ', 'As Integer ', '= ', '0'], errorIndex: 3, hint: '找最小值時，初始預設值應該要很大還是很小？', explain: '若要找最小值，初始值必須設定為一個極大的範圍（如 99），若設為 0 會導致比 0 大的 BMI 都無法成為最小值。', correct: 'Dim min As Integer = 99' },
                { lineNum: '第 5 行', tokens: ['Do ', 'While ', 'i <= 3'], errorIndex: 2, hint: '以預設 0 起始的索引，要執行 3 次的條件為何？', explain: 'VB 變數未賦值預設為 0。當 i=0,1,2 時剛好執行 3 次，若寫 <= 3 會執行到 i=3，總共變 4 次，應改為 i < 3。', correct: 'Do While i < 3' },
                { lineNum: '第 8 行', tokens: ['If ', 'min < bmi ', 'Then min = bmi'], errorIndex: 1, hint: '條件反了，這樣到底找大還是找小？', explain: '若寫成 min < bmi 才把 bmi 給 min，表示 min 會一直往上更新成最大值，應該寫 bmi < min。', correct: 'If bmi < min Then min = bmi' },
                { lineNum: '第 9 行', tokens: ['i ', '-= ', '1'], errorIndex: 1, hint: '計數器要越來越大還是越來越小？', explain: '數字應往上數才能達到上限 3，改為 -= 1 會導致無窮迴圈，應寫 += 1。', correct: 'i += 1' },
                { lineNum: '第 10 行', tokens: ['End ', 'While'], errorIndex: 1, hint: 'Do 迴圈的結尾是什麼關鍵字？', explain: 'Do 迴圈的結尾標記是 Loop，並沒有 End While 這種語法。', correct: 'Loop' }
            ],
            "T03": [
                { lineNum: '第 3 行', tokens: ['Dim min ', 'As Integer ', '= ', '0'], errorIndex: 3, hint: '找最小值時，初始預設值應該要很大還是很小？', explain: '若要找最小值，初始值必須設定為一個極大的範圍（如 99），若設為 0 會導致永遠都找不出正常的最小 BMI。', correct: 'Dim min As Integer = 99' },
                { lineNum: '第 5 行', tokens: ['Loop'], errorIndex: 0, hint: '迴圈起頭應該用什麼字？', explain: '後測試迴圈開頭應使用 Do，Loop 是用來放在結尾做條件判斷的。', correct: 'Do' },
                { lineNum: '第 8 行', tokens: ['If ', 'bmi > min ', 'Then min = bmi'], errorIndex: 1, hint: '是要找最大的 BMI 還是最小的 BMI？', explain: '若用 > 表示 BMI 較大時取代，就會變成找出最大值，應改為 <。', correct: 'If bmi < min Then min = bmi' },
                { lineNum: '第 9 行', tokens: ['i ', '*= ', '1'], errorIndex: 1, hint: '這樣寫 i 會累加嗎？', explain: 'i *= 1 會讓 i 永遠維持在 1，導致無窮迴圈。應該要寫成 i += 1 才對。', correct: 'i += 1' },
                { lineNum: '第 10 行', tokens: ['Loop ', 'While ', 'i < 3'], errorIndex: 2, hint: '初始設定 i=1，若條件為 i<3 會執行幾次？', explain: '若條件是 i < 3，只會執行 i=1, 2 共兩次就跳出，應改為 i <= 3 才會順利執行 3 次。', correct: 'Loop While i <= 3' }
            ]
        },
        variant_bug_tests: {
            "T01": [
                { lineNum: '第 3 行', tokens: ['Dim min ', 'As Integer ', '= ', '0'], errorIndex: 3, hint: '找最小值時，初始預設值應該要很大還是很小？', explain: '若要找最小值，初始值必須設定為一個極大的範圍外數值（如 99），若設為 0 會導致比 0 大的 BMI 都選不進去。', correct: 'Dim min As Integer = 99' },
                { lineNum: '第 4 行', tokens: ['For i = ', '0 ', 'To 3'], errorIndex: 1, hint: '這樣會執行幾次？', explain: '從 0 到 3 會執行 4 次，但題目明確只有 3 筆測資，所以應改為 For i = 1 To 3。', correct: 'For i = 1 To 3' },
                { lineNum: '第 6 行', tokens: ['Dim bmi ', 'As String ', '= data(1) / (data(0) / 100) ^ 2'], errorIndex: 1, hint: 'BMI 要做大小比較，應該用什麼型態？', explain: '經過純數學公式計算出來的數值，應該存在數值型態 (Integer 或 Double) 而非字串 (String)。', correct: 'Dim bmi As Integer = data(1) / (data(0) / 100) ^ 2' },
                { lineNum: '第 7 行', tokens: ['If ', 'bmi > min ', 'Then min = bmi'], errorIndex: 1, hint: '是要找最大的 BMI 還是最小的 BMI？', explain: '若是大於才更新，就會變成找最大值！題目要找最小值，所以運算子應改為 <。', correct: 'If bmi < min Then min = bmi' },
                { lineNum: '第 8 行', tokens: ['End ', 'For'], errorIndex: 0, hint: 'For 迴圈的結尾是什麼？', explain: 'VB.NET 的 For 迴圈應使用 Next 結尾，沒有 End For 語法。', correct: 'Next i' }
            ],
            "T02": [
                { lineNum: '第 3 行', tokens: ['Dim min ', 'As Integer ', '= ', '0'], errorIndex: 3, hint: '找最小值時，初始預設值應該要很大還是很小？', explain: '若要找最小值，初始值必須設定為一個極大的範圍（如 99），若設為 0 會導致比 0 大的 BMI 都無法成為最小值。', correct: 'Dim min As Integer = 99' },
                { lineNum: '第 5 行', tokens: ['Do ', 'While ', 'i <= 3'], errorIndex: 2, hint: '以預設 0 起始的索引，要執行 3 次的條件為何？', explain: 'VB 變數未賦值預設為 0。當 i=0,1,2 時剛好執行 3 次，若寫 <= 3 會執行到 i=3，總共變 4 次，應改為 i < 3。', correct: 'Do While i < 3' },
                { lineNum: '第 8 行', tokens: ['If ', 'min < bmi ', 'Then min = bmi'], errorIndex: 1, hint: '條件反了，這樣到底找大還是找小？', explain: '若寫成 min < bmi 才把 bmi 給 min，表示 min 會一直往上更新成最大值，應該寫 bmi < min。', correct: 'If bmi < min Then min = bmi' },
                { lineNum: '第 9 行', tokens: ['i ', '-= ', '1'], errorIndex: 1, hint: '計數器要越來越大還是越來越小？', explain: '數字應往上數才能達到上限 3，改為 -= 1 會導致無窮迴圈，應寫 += 1。', correct: 'i += 1' },
                { lineNum: '第 10 行', tokens: ['End ', 'While'], errorIndex: 1, hint: 'Do 迴圈的結尾是什麼關鍵字？', explain: 'Do 迴圈的結尾標記是 Loop，並沒有 End While 這種語法。', correct: 'Loop' }
            ],
            "T03": [
                { lineNum: '第 3 行', tokens: ['Dim min ', 'As Integer ', '= ', '0'], errorIndex: 3, hint: '找最小值時，初始預設值應該要很大還是很小？', explain: '若要找最小值，初始值必須設定為一個極大的範圍（如 99），若設為 0 會導致永遠都找不出正常的最小 BMI。', correct: 'Dim min As Integer = 99' },
                { lineNum: '第 5 行', tokens: ['Loop'], errorIndex: 0, hint: '迴圈起頭應該用什麼字？', explain: '後測試迴圈開頭應使用 Do，Loop 是用來放在結尾做條件判斷的。', correct: 'Do' },
                { lineNum: '第 8 行', tokens: ['If ', 'bmi > min ', 'Then min = bmi'], errorIndex: 1, hint: '是要找最大的 BMI 還是最小的 BMI？', explain: '若用 > 表示 BMI 較大時取代，就會變成找出最大值，應改為 <。', correct: 'If bmi < min Then min = bmi' },
                { lineNum: '第 9 行', tokens: ['i ', '*= ', '1'], errorIndex: 1, hint: '這樣寫 i 會累加嗎？', explain: 'i *= 1 會讓 i 永遠維持在 1，導致無窮迴圈。應該要寫成 i += 1 才對。', correct: 'i += 1' },
                { lineNum: '第 10 行', tokens: ['Loop ', 'While ', 'i < 3'], errorIndex: 2, hint: '初始設定 i=1，若條件為 i<3 會執行幾次？', explain: '若條件是 i < 3，只會執行 i=1, 2 共兩次就跳出，應改為 i <= 3 才會順利執行 3 次。', correct: 'Loop While i <= 3' }
            ]
        },
        procedure_end: [
            { raw: "    End Sub", zh: "結束副程式 Sub", hint: "End Sub" }
        ],
        match_results: [
            { code: "Dim bmi() = {24, 19, 28}\nDim min As Integer = 99\nFor i = 0 To 2\n  If bmi(i) < min Then min = bmi(i)\nNext\nPrint(min)", result: "19" },
            { code: "Dim bmi() = {24, 19, 28}\nDim count As Integer = 0\nFor i = 0 To 2\n  If bmi(i) >= 20 And bmi(i) <= 25 Then count += 1\nNext\nPrint(count)", result: "1" },
            { code: "Dim bmi() = {24, 19, 28}\nDim max As Integer = 0\nFor i = 0 To 2\n  If bmi(i) > max Then max = bmi(i)\nNext\nPrint(max)", result: "28" },
            { code: "Dim bmi() = {24, 19, 28}\nDim sum As Integer = 0\nFor i = 0 To 2\n  sum += bmi(i)\nNext\nPrint(sum)", result: "71" }
        ],
        variant_match_results: {
            "T02": [
                { code: "Dim bmi() = {24, 19, 28}\nDim min As Integer = 99\nDim i As Integer = 0\nDo While i <= 2\n  If bmi(i) < min Then min = bmi(i)\n  i += 1\nLoop\nPrint(min)", result: "19" },
                { code: "Dim bmi() = {24, 19, 28}\nDim count As Integer = 0\nDim i As Integer = 0\nDo While i <= 2\n  If bmi(i) >= 20 And bmi(i) <= 25 Then count += 1\n  i += 1\nLoop\nPrint(count)", result: "1" },
                { code: "Dim bmi() = {24, 19, 28}\nDim max As Integer = 0\nDim i As Integer = 0\nDo While i <= 2\n  If bmi(i) > max Then max = bmi(i)\n  i += 1\nLoop\nPrint(max)", result: "28" },
                { code: "Dim bmi() = {24, 19, 28}\nDim sum As Integer = 0\nDim i As Integer = 0\nDo While i <= 2\n  sum += bmi(i)\n  i += 1\nLoop\nPrint(sum)", result: "71" }
            ],
            "T03": [
                { code: "Dim bmi() = {24, 19, 28}\nDim min As Integer = 99\nDim i As Integer = 0\nDo\n  If bmi(i) < min Then min = bmi(i)\n  i += 1\nLoop While i <= 2\nPrint(min)", result: "19" },
                { code: "Dim bmi() = {24, 19, 28}\nDim count As Integer = 0\nDim i As Integer = 0\nDo\n  If bmi(i) >= 20 And bmi(i) <= 25 Then count += 1\n  i += 1\nLoop While i <= 2\nPrint(count)", result: "1" },
                { code: "Dim bmi() = {24, 19, 28}\nDim max As Integer = 0\nDim i As Integer = 0\nDo\n  If bmi(i) > max Then max = bmi(i)\n  i += 1\nLoop While i <= 2\nPrint(max)", result: "28" },
                { code: "Dim bmi() = {24, 19, 28}\nDim sum As Integer = 0\nDim i As Integer = 0\nDo\n  sum += bmi(i)\n  i += 1\nLoop While i <= 2\nPrint(sum)", result: "71" }
            ]
        }
    },
    "Q5": {
        title: "矩陣相加",
        procedure_start: [
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "'* 11900-1060305 Program Start *", zh: "程式註解：題號 程式開始" },
            { raw: "'*******************************", zh: "程式註解：星號分隔線" },
            { raw: "Private Sub Q5()", zh: "宣告私有副程式 Q5", hint: "Private Sub Q5()" }
        ],
        loop_variants: {
            "T01": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060305.T01\")", zh: "新增檔案讀取物件 f，讀取 1060305.T01 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060305.T01\")" },
                { raw: "        Dim a(2, 2), b(2, 2), c(2, 2) As Integer", zh: "宣告 3 個大小為 2x2 的整數二維陣列", hint: "Dim a(2, 2), b(2, 2), c(2, 2) As Integer" },
                { raw: "        Dim data As String()", zh: "宣告字串陣列 data", hint: "Dim data As String()" },
                { raw: "        data = f.ReadLine().Split(\",\") : a(1, 1) = data(0) : a(1, 2) = data(1)", zh: "讀取並分割字串填入矩陣 a 第一列", hint: "data = f.ReadLine().Split(\",\") : a(1, 1) = data(0) : a(1, 2) = data(1)" },
                { raw: "        data = f.ReadLine().Split(\",\") : a(2, 1) = data(0) : a(2, 2) = data(1)", zh: "讀取並分割字串填入矩陣 a 第二列", hint: "data = f.ReadLine().Split(\",\") : a(2, 1) = data(0) : a(2, 2) = data(1)" },
                { raw: "        data = f.ReadLine().Split(\",\") : b(1, 1) = data(0) : b(1, 2) = data(1)", zh: "讀取並分割字串填入矩陣 b 第一列", hint: "data = f.ReadLine().Split(\",\") : b(1, 1) = data(0) : b(1, 2) = data(1)" },
                { raw: "        data = f.ReadLine().Split(\",\") : b(2, 1) = data(0) : b(2, 2) = data(1)", zh: "讀取並分割字串填入矩陣 b 第二列", hint: "data = f.ReadLine().Split(\",\") : b(2, 1) = data(0) : b(2, 2) = data(1)" },
                { raw: "        Dim i, j As Integer", zh: "宣告整數變數 i, j", hint: "Dim i, j As Integer" },
                { raw: "        For i = 1 To 2", zh: "設定 For 迴圈 i 從 1 到 2", hint: "For i = 1 To 2" },
                { raw: "            For j = 1 To 2", zh: "設定 For 迴圈 j 從 1 到 2", hint: "For j = 1 To 2" },
                { raw: "                c(i, j) = a(i, j) + b(i, j)", zh: "矩陣 a 與 b 相加存入矩陣 c", hint: "c(i, j) = a(i, j) + b(i, j)" },
                { raw: "            Next j", zh: "下一個 j", hint: "Next j" },
                { raw: "        Next i", zh: "下一個 i", hint: "Next i" },
                { raw: "        RichTextBox1.Text &= \"第五題結果：\" & vbCrLf", zh: "將第五題結果：串接到 RichTextBox1 後面", hint: "RichTextBox1.Text &= \"第五題結果：\" & vbCrLf" },
                { raw: "        RichTextBox1.Text &= \"[\" & c(1, 1) & \"     \" & c(1, 2) & \"]\" & vbCrLf", zh: "格式化輸出矩陣 c 第一列內容，並串接到 RichTextBox1 後面", hint: "RichTextBox1.Text &= \"[\" & c(1, 1) & \"     \" & c(1, 2) & \"]\" & vbCrLf" },
                { raw: "        RichTextBox1.Text &= \"[\" & c(2, 1) & \"     \" & c(2, 2) & \"]\" & vbCrLf", zh: "格式化輸出矩陣 c 第二列內容，並串接到 RichTextBox1 後面", hint: "RichTextBox1.Text &= \"[\" & c(2, 1) & \"     \" & c(2, 2) & \"]\" & vbCrLf" }
            ],
            "T02": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060305.T02\")", zh: "新增檔案讀取物件 f，讀取 1060305.T02 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060305.T02\")" },
                { raw: "        Dim a(2, 2), b(2, 2), c(2, 2) As Integer", zh: "宣告 a, b, c 為二維整數陣列，大小為 2 * 2", hint: "Dim a(2, 2), b(2, 2), c(2, 2) As Integer            '宣告 a, b, c 為二維整數陣列，大小為 2 * 2" },
                { raw: "        Dim data As String()", zh: "宣告字串陣列 data", hint: "Dim data As String()" },
                { raw: "        data = f.ReadLine().Split(\",\") : a(1, 1) = data(0) : a(1, 2) = data(1)", zh: "讀取 a 第 1 行資料", hint: "data = f.ReadLine().Split(\",\") : a(1, 1) = data(0) : a(1, 2) = data(1)" },
                { raw: "        data = f.ReadLine().Split(\",\") : a(2, 1) = data(0) : a(2, 2) = data(1)", zh: "讀取 a 第 2 行資料", hint: "data = f.ReadLine().Split(\",\") : a(2, 1) = data(0) : a(2, 2) = data(1)" },
                { raw: "        data = f.ReadLine().Split(\",\") : b(1, 1) = data(0) : b(1, 2) = data(1)", zh: "讀取 b 第 1 行資料", hint: "data = f.ReadLine().Split(\",\") : b(1, 1) = data(0) : b(1, 2) = data(1)" },
                { raw: "        data = f.ReadLine().Split(\",\") : b(2, 1) = data(0) : b(2, 2) = data(1)", zh: "讀取 b 第 2 行資料", hint: "data = f.ReadLine().Split(\",\") : b(2, 1) = data(0) : b(2, 2) = data(1)" },
                { raw: "        Dim i As Integer = 1", zh: "宣告 i 為整數變數並設定為 1", hint: "Dim i As Integer = 1" },
                { raw: "        Do While i <= 2", zh: "當 i <= 2 時，執行 Do While 迴圈", hint: "Do While i <= 2" },
                { raw: "            Dim j As Integer = 1", zh: "定義整數型態變數 j 並設定為 1", hint: "Dim j As Integer = 1" },
                { raw: "            Do While j <= 2", zh: "當 j <= 2 時，執行 Do While 迴圈", hint: "Do While j <= 2" },
                { raw: "                c(i, j) = a(i, j) + b(i, j)", zh: "矩陣 a 加 b 放到 c", hint: "c(i, j) = a(i, j) + b(i, j)" },
                { raw: "                j += 1", zh: "把 j 加 1", hint: "j += 1" },
                { raw: "            Loop", zh: "從頭執行迴圈", hint: "Loop" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        Loop", zh: "從頭執行迴圈", hint: "Loop" },
                { raw: "        RichTextBox1.Text &= \"第五題結果：\" & vbCrLf", zh: "將第五題結果：串接到 RichTextBox1 後面", hint: "RichTextBox1.Text &= \"第五題結果：\" & vbCrLf" },
                { raw: "        RichTextBox1.Text &= \"[\" & c(1, 1) & \"   \" & c(1, 2) & \"]\" & vbCrLf", zh: "格式化輸出矩陣 c 第一列內容，並串接到 RichTextBox1 後面", hint: "RichTextBox1.Text &= \"[\" & c(1, 1) & \"   \" & c(1, 2) & \"]\" & vbCrLf" },
                { raw: "        RichTextBox1.Text &= \"[\" & c(2, 1) & \"   \" & c(2, 2) & \"]\" & vbCrLf", zh: "格式化輸出矩陣 c 第二列內容，並串接到 RichTextBox1 後面", hint: "RichTextBox1.Text &= \"[\" & c(2, 1) & \"   \" & c(2, 2) & \"]\" & vbCrLf" }
            ],
            "T03": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060305.T03\")", zh: "新增檔案讀取物件 f，讀取 1060305.T03 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060305.T03\")" },
                { raw: "        Dim a(2, 2), b(2, 2), c(2, 2) As Integer", zh: "宣告 3 個大小為 2x2 的整數二維陣列", hint: "Dim a(2, 2), b(2, 2), c(2, 2) As Integer" },
                { raw: "        Dim data As String()", zh: "宣告字串陣列 data", hint: "Dim data As String()" },
                { raw: "        data = f.ReadLine().Split(\",\") : a(1, 1) = data(0) : a(1, 2) = data(1)", zh: "讀取並分割字串填入矩陣 a 第一列", hint: "data = f.ReadLine().Split(\",\") : a(1, 1) = data(0) : a(1, 2) = data(1)" },
                { raw: "        data = f.ReadLine().Split(\",\") : a(2, 1) = data(0) : a(2, 2) = data(1)", zh: "讀取並分割字串填入矩陣 a 第二列", hint: "data = f.ReadLine().Split(\",\") : a(2, 1) = data(0) : a(2, 2) = data(1)" },
                { raw: "        data = f.ReadLine().Split(\",\") : b(1, 1) = data(0) : b(1, 2) = data(1)", zh: "讀取並分割字串填入矩陣 b 第一列", hint: "data = f.ReadLine().Split(\",\") : b(1, 1) = data(0) : b(1, 2) = data(1)" },
                { raw: "        data = f.ReadLine().Split(\",\") : b(2, 1) = data(0) : b(2, 2) = data(1)", zh: "讀取並分割字串填入矩陣 b 第二列", hint: "data = f.ReadLine().Split(\",\") : b(2, 1) = data(0) : b(2, 2) = data(1)" },
                { raw: "        Dim i As Integer = 1", zh: "定義整數型態變數 i 並設定為 1", hint: "Dim i As Integer = 1" },
                { raw: "        Do", zh: "迴圈開頭 Do", hint: "Do" },
                { raw: "            Dim j As Integer = 1", zh: "定義整數型態變數 j 並設定為 1", hint: "Dim j As Integer = 1" },
                { raw: "            Do", zh: "迴圈開頭 Do", hint: "Do" },
                { raw: "                c(i, j) = a(i, j) + b(i, j)", zh: "矩陣 a 與 b 相加存入矩陣 c", hint: "c(i, j) = a(i, j) + b(i, j)" },
                { raw: "                j += 1", zh: "把 j 加 1", hint: "j += 1" },
                { raw: "            Loop While j <= 2", zh: "當  j 小於 2 ，執行 Do While 迴圈內的指令", hint: "Loop While j <= 2" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        Loop While i <= 2", zh: "當  i 小於 2 ，執行 Do While 迴圈內的指令", hint: "Loop While i <= 2" },
                { raw: "        RichTextBox1.Text &= \"第五題結果：\" & vbCrLf", zh: "將第五題結果開頭輸出至 RichTextBox1", hint: "RichTextBox1.Text &= \"第五題結果：\" & vbCrLf" },
                { raw: "        RichTextBox1.Text &= \"[\" & c(1, 1) & \"   \" & c(1, 2) & \"]\" & vbCrLf", zh: "格式化輸出矩陣 c 第一列內容，並串接到 RichTextBox1 後面", hint: "RichTextBox1.Text &= \"[\" & c(1, 1) & \"   \" & c(1, 2) & \"]\" & vbCrLf" },
                { raw: "        RichTextBox1.Text &= \"[\" & c(2, 1) & \"   \" & c(2, 2) & \"]\" & vbCrLf", zh: "格式化輸出矩陣 c 第二列內容，並串接到 RichTextBox1 後面", hint: "RichTextBox1.Text &= \"[\" & c(2, 1) & \"   \" & c(2, 2) & \"]\" & vbCrLf" }
            ]
        },
        variant_bug_tests: {
            "T01": [
                { lineNum: '第 2 行', tokens: ['Dim a(2, 2), b(2, 2), c(2, 2) ', 'As String'], errorIndex: 1, hint: '這是裝數學數字的矩陣，該用什麼型態？', explain: '陣列將用來做「相加」計算，應使用數值相關型態 (如 As Integer)，不應使用字串。', correct: 'Dim a(2, 2), b(2, 2), c(2, 2) As Integer' },
                { lineNum: '第 9 行', tokens: ['For i = ', '0 ', 'To 2'], errorIndex: 1, hint: '題目矩陣的索引範圍是從 1 開始還是 0？', explain: '根據程式碼前方程式碼讀取，陣列索引是從 1 (如 a(1,1)) 開始放到 2，因此應改為 For i = 1 To 2。', correct: 'For i = 1 To 2' },
                { lineNum: '第 11 行', tokens: ['c(i, j) = ', 'a(i, j) ', '* ', 'b(i, j)'], errorIndex: 2, hint: '題目是要做矩陣相加還是相乘？', explain: '題目是「矩陣相加」，所以運算子應該是加號 (+)，而非乘法 (*)。', correct: 'c(i, j) = a(i, j) + b(i, j)' },
                { lineNum: '第 12 行', tokens: ['End ', 'For'], errorIndex: 0, hint: 'For 迴圈的結尾是什麼？', explain: 'VB.NET 的 For 迴圈應使用 Next 結尾，沒有 End For 語法。', correct: 'Next j' },
                { lineNum: '第 13 行', tokens: ['Loop'], errorIndex: 0, hint: 'For 迴圈要配什麼？', explain: '外層的 For i 迴圈，結尾也應該是 Next i，不可以配 Loop。', correct: 'Next i' }
            ],
            "T02": [
                { lineNum: '第 8 行', tokens: ['Dim i As Integer = ', '0'], errorIndex: 1, hint: '陣列索引在此範例中從多少開始放資料？', explain: '前面的程式將資料放入 a(1,1)，起始索引為 1，所以計數器 i 應從 1 開始。', correct: 'Dim i As Integer = 1' },
                { lineNum: '第 9 行', tokens: ['Do ', 'While ', 'i < 2'], errorIndex: 2, hint: '這樣會執行幾個 Row？', explain: '若條件寫 i < 2，只會執行 i=1 這一個 Row，應改為 i <= 2 才能處理 2x2。', correct: 'Do While i <= 2' },
                { lineNum: '第 12 行', tokens: ['c(i, j) = ', 'a(j, i) ', '+ b(i, j)'], errorIndex: 1, hint: '矩陣相加是對應位置相加，索引顛倒了嗎？', explain: '矩陣 a 和 b 應該要是相同的 Row 和 Col 相加，不應該把 a(j, i) 索引反過來。', correct: 'c(i, j) = a(i, j) + b(i, j)' },
                { lineNum: '第 13 行', tokens: ['j ', '-= ', '1'], errorIndex: 1, hint: '計數器要越來越大還是越來越小？', explain: '數字應往上數才能達到上限 2，改為 -= 1 會導致無窮迴圈，應寫 += 1。', correct: 'j += 1' },
                { lineNum: '第 15 行', tokens: ['j ', '+= 1'], errorIndex: 0, hint: '外層迴圈是要控制哪一個變數？', explain: '外層迴圈是處理 i (Row)，在換列時應該是要將 i 加上 1，而不是 j，否則變數 i 沒變會卡死在無窮迴圈中。', correct: 'i += 1' }
            ],
            "T03": [
                { lineNum: '第 8 行', tokens: ['Dim i As Integer = ', '3'], errorIndex: 1, hint: '起始索引對嗎？', explain: '陣列範圍到 2 而已，若設定從 3 開始就會造成索引超出陣列範圍，應改為 1 起始。', correct: 'Dim i As Integer = 1' },
                { lineNum: '第 9 行', tokens: ['Loop'], errorIndex: 0, hint: '迴圈起頭應該用什麼字？', explain: '後測試迴圈開頭應使用 Do，Loop 是用來放在結尾做條件判斷的。', correct: 'Do' },
                { lineNum: '第 12 行', tokens: ['c(i, j) = ', 'a(i, j) ', '- ', 'b(i, j)'], errorIndex: 2, hint: '題目是要陣列相加還是相減？', explain: '矩陣相加題目應為 a(i, j) + b(i, j)，若寫減號邏輯錯誤。', correct: 'c(i, j) = a(i, j) + b(i, j)' },
                { lineNum: '第 13 行', tokens: ['j ', '*= ', '1'], errorIndex: 1, hint: '這樣寫 j 會累加嗎？', explain: 'j *= 1 會讓 j 一直維持 1，導致無窮迴圈。應該要寫成 j += 1。', correct: 'j += 1' },
                { lineNum: '第 14 行', tokens: ['Loop ', 'Until ', 'j <= 2'], errorIndex: 1, hint: '迴圈是要繼續還是停止？', explain: '應使用 Loop While 讓條件成立時「繼續」。若用 Until 則變成條件成立時「停止」。', correct: 'Loop While j <= 2' }
            ]
        },
        variant_bug_tests: {
            "T01": [
                { lineNum: '第 2 行', tokens: ['Dim a(2, 2), b(2, 2), c(2, 2) ', 'As String'], errorIndex: 1, hint: '這是裝數學數字的矩陣，該用什麼型態？', explain: '陣列將用來做「相加」計算，應使用數值相關型態 (如 As Integer)，不應使用字串。', correct: 'Dim a(2, 2), b(2, 2), c(2, 2) As Integer' },
                { lineNum: '第 9 行', tokens: ['For i = ', '0 ', 'To 2'], errorIndex: 1, hint: '題目矩陣的索引範圍是從 1 開始還是 0？', explain: '根據程式碼前方程式碼讀取，陣列索引是從 1 (如 a(1,1)) 開始放到 2，因此應改為 For i = 1 To 2。', correct: 'For i = 1 To 2' },
                { lineNum: '第 11 行', tokens: ['c(i, j) = ', 'a(i, j) ', '* ', 'b(i, j)'], errorIndex: 2, hint: '題目是要做矩陣相加還是相乘？', explain: '題目是「矩陣相加」，所以運算子應該是加號 (+)，而非乘法 (*)。', correct: 'c(i, j) = a(i, j) + b(i, j)' },
                { lineNum: '第 12 行', tokens: ['End ', 'For'], errorIndex: 0, hint: 'For 迴圈的結尾是什麼？', explain: 'VB.NET 的 For 迴圈應使用 Next 結尾，沒有 End For 語法。', correct: 'Next j' },
                { lineNum: '第 13 行', tokens: ['Loop'], errorIndex: 0, hint: 'For 迴圈要配什麼？', explain: '外層的 For i 迴圈，結尾也應該是 Next i，不可以配 Loop。', correct: 'Next i' }
            ],
            "T02": [
                { lineNum: '第 8 行', tokens: ['Dim i As Integer = ', '0'], errorIndex: 1, hint: '陣列索引在此範例中從多少開始放資料？', explain: '前面的程式將資料放入 a(1,1)，起始索引為 1，所以計數器 i 應從 1 開始。', correct: 'Dim i As Integer = 1' },
                { lineNum: '第 9 行', tokens: ['Do ', 'While ', 'i < 2'], errorIndex: 2, hint: '這樣會執行幾個 Row？', explain: '若條件寫 i < 2，只會執行 i=1 這一個 Row，應改為 i <= 2 才能處理 2x2。', correct: 'Do While i <= 2' },
                { lineNum: '第 12 行', tokens: ['c(i, j) = ', 'a(j, i) ', '+ b(i, j)'], errorIndex: 1, hint: '矩陣相加是對應位置相加，索引顛倒了嗎？', explain: '矩陣 a 和 b 應該要是相同的 Row 和 Col 相加，不應該把 a(j, i) 索引反過來。', correct: 'c(i, j) = a(i, j) + b(i, j)' },
                { lineNum: '第 13 行', tokens: ['j ', '-= ', '1'], errorIndex: 1, hint: '計數器要越來越大還是越來越小？', explain: '數字應往上數才能達到上限 2，改為 -= 1 會導致無窮迴圈，應寫 += 1。', correct: 'j += 1' },
                { lineNum: '第 15 行', tokens: ['j ', '+= 1'], errorIndex: 0, hint: '外層迴圈是要控制哪一個變數？', explain: '外層迴圈是處理 i (Row)，在換列時應該是要將 i 加上 1，而不是 j，否則變數 i 沒變會卡死在無窮迴圈中。', correct: 'i += 1' }
            ],
            "T03": [
                { lineNum: '第 8 行', tokens: ['Dim i As Integer = ', '3'], errorIndex: 1, hint: '起始索引對嗎？', explain: '陣列範圍到 2 而已，若設定從 3 開始就會造成索引超出陣列範圍，應改為 1 起始。', correct: 'Dim i As Integer = 1' },
                { lineNum: '第 9 行', tokens: ['Loop'], errorIndex: 0, hint: '迴圈起頭應該用什麼字？', explain: '後測試迴圈開頭應使用 Do，Loop 是用來放在結尾做條件判斷的。', correct: 'Do' },
                { lineNum: '第 12 行', tokens: ['c(i, j) = ', 'a(i, j) ', '- ', 'b(i, j)'], errorIndex: 2, hint: '題目是要陣列相加還是相減？', explain: '矩陣相加題目應為 a(i, j) + b(i, j)，若寫減號邏輯錯誤。', correct: 'c(i, j) = a(i, j) + b(i, j)' },
                { lineNum: '第 13 行', tokens: ['j ', '*= ', '1'], errorIndex: 1, hint: '這樣寫 j 會累加嗎？', explain: 'j *= 1 會讓 j 一直維持 1，導致無窮迴圈。應該要寫成 j += 1。', correct: 'j += 1' },
                { lineNum: '第 14 行', tokens: ['Loop ', 'Until ', 'j <= 2'], errorIndex: 1, hint: '迴圈是要繼續還是停止？', explain: '應使用 Loop While 讓條件成立時「繼續」。若用 Until 則變成條件成立時「停止」。', correct: 'Loop While j <= 2' }
            ]
        },
        procedure_end: [
            { raw: "    End Sub", zh: "結束副程式 Sub", hint: "End Sub" }
        ],
        match_results: [
            { code: "Dim a() = {1, 3, 5, 7}\nDim sum As Integer = 0\nFor Each i In a\n  sum += i\nNext\nPrint(sum)", result: "16" },
            { code: "Dim a() = {8, 2, 6, 4}\nDim max As Integer = a(0)\nFor Each i In a\n  If i > max Then max = i\nNext\nPrint(max)", result: "8" },
            { code: "Dim a() = {8, 2, 6, 4}\nDim min As Integer = a(0)\nFor Each i In a\n  If i < min Then min = i\nNext\nPrint(min)", result: "2" },
            { code: "Dim a() = {1, 2, 3, 4, 5}\nDim c As Integer = 0\nFor Each i In a\n  If i Mod 2 = 0 Then c += 1\nNext\nPrint(c)", result: "2" }
        ],
        variant_match_results: {
            "T02": [
                { code: "Dim a() = {1, 3, 5, 7}\nDim sum As Integer = 0\nDim idx As Integer = 0\nDo While idx < a.Length\n  Dim i = a(idx)\n  sum += i\n  idx += 1\nLoop\nPrint(sum)", result: "16" },
                { code: "Dim a() = {8, 2, 6, 4}\nDim max As Integer = a(0)\nDim idx As Integer = 0\nDo While idx < a.Length\n  Dim i = a(idx)\n  If i > max Then max = i\n  idx += 1\nLoop\nPrint(max)", result: "8" },
                { code: "Dim a() = {8, 2, 6, 4}\nDim min As Integer = a(0)\nDim idx As Integer = 0\nDo While idx < a.Length\n  Dim i = a(idx)\n  If i < min Then min = i\n  idx += 1\nLoop\nPrint(min)", result: "2" },
                { code: "Dim a() = {1, 2, 3, 4, 5}\nDim c As Integer = 0\nDim idx As Integer = 0\nDo While idx < a.Length\n  Dim i = a(idx)\n  If i Mod 2 = 0 Then c += 1\n  idx += 1\nLoop\nPrint(c)", result: "2" }
            ],
            "T03": [
                { code: "Dim a() = {1, 3, 5, 7}\nDim sum As Integer = 0\nDim idx As Integer = 0\nDo\n  Dim i = a(idx)\n  sum += i\n  idx += 1\nLoop While idx < a.Length\nPrint(sum)", result: "16" },
                { code: "Dim a() = {8, 2, 6, 4}\nDim max As Integer = a(0)\nDim idx As Integer = 0\nDo\n  Dim i = a(idx)\n  If i > max Then max = i\n  idx += 1\nLoop While idx < a.Length\nPrint(max)", result: "8" },
                { code: "Dim a() = {8, 2, 6, 4}\nDim min As Integer = a(0)\nDim idx As Integer = 0\nDo\n  Dim i = a(idx)\n  If i < min Then min = i\n  idx += 1\nLoop While idx < a.Length\nPrint(min)", result: "2" },
                { code: "Dim a() = {1, 2, 3, 4, 5}\nDim c As Integer = 0\nDim idx As Integer = 0\nDo\n  Dim i = a(idx)\n  If i Mod 2 = 0 Then c += 1\n  idx += 1\nLoop While idx < a.Length\nPrint(c)", result: "2" }
            ]
        }
    },
    "1060306": {
        title: "身分證號碼檢查",
        procedure_start: [
            { raw: "Private Sub Form1_Load(sender As Object, e As EventArgs) Handles MyBase.Load", zh: "私有表單載入事件副程式", hint: "Private Sub Form1_Load(sender As Object, e As EventArgs) Handles MyBase.Load" }
        ],
        loop_variants: {
            "T01": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060306.T01\")", zh: "開啟測試檔案", hint: "Dim f As New StreamReader(\"c:\\test\\1060306.T01\")" },
                { raw: "        Dim data As New List(Of String())", zh: "宣告字串陣列的串列,名稱為 data", hint: "Dim data As New List(Of String())" },
                { raw: "        Dim i As Integer", zh: "宣告整數變數 i", hint: "Dim i As Integer" },
                { raw: "        Do While Not f.EndOfStream", zh: "讀取檔案直到結尾", hint: "Do While Not f.EndOfStream" },
                { raw: "            data.Add((f.ReadLine() & \",\").Split(\",\"))", zh: "從檔案讀取一筆資料,以逗號分割,取得身分證、姓名、性別資料放到 data List", hint: "data.Add((f.ReadLine() & \",\").Split(\",\"))" },
                { raw: "            Dim ID As String = data(i)(0)", zh: "宣告字串變數 ID 存放身分證", hint: "Dim ID As String = data(i)(0)" },
                { raw: "            If data(i)(3) = \"\" And Not ID Like \"[A-Z]#########\" Then", zh: "若錯誤狀況為空白，且身分證格式不正確", hint: "If data(i)(3) = \"\" And Not ID Like \"[A-Z]#########\" Then" },
                { raw: "                data(i)(3) = \"FORMAT ERROR\"", zh: "把身分證格式錯誤放到陣列第 4 個欄位", hint: "data(i)(3) = \"FORMAT ERROR\"" },
                { raw: "            End If", zh: "結束 If 判斷式", hint: "End If" },
                { raw: "            If data(i)(3) = \"\" And ((ID(1) = \"1\" And data(i)(2) <> \"M\") Or (ID(1) = \"2\" And data(i)(2) <> \"F\")) Then", zh: "判斷錯誤狀況是否為空白且性別不匹配", hint: "If data(i)(3) = \"\" And ((ID(1) = \"1\" And data(i)(2) <> \"M\") Or (ID(1) = \"2\" And data(i)(2) <> \"F\")) Then" },
                { raw: "                data(i)(3) = \"SEX CODE ERROR\"", zh: "把性別錯誤放到陣列第 4 個欄位", hint: "data(i)(3) = \"SEX CODE ERROR\"" },
                { raw: "            End If", zh: "結束 If 判斷式", hint: "End If" },
                { raw: "            Dim X As Integer = InStr(\"ABCDEFGHJKLMNPQRSTUVXYWZIO\", ID(0)) + 9", zh: "宣告整數變數 X，利用 InStr 找出身分證第一個字母對應的數字並加 9", hint: "Dim X As Integer = InStr(\"ABCDEFGHJKLMNPQRSTUVXYWZIO\", ID(0)) + 9" },
                { raw: "            Dim y As Integer = X \\ 10 + 9 * (X Mod 10) + 8 * Val(ID(1)) + 7 * Val(ID(2)) + 6 * Val(ID(3)) + 5 * Val(ID(4)) + 4 * Val(ID(5)) + 3 * Val(ID(6)) + 2 * Val(ID(7)) + Val(ID(8)) + Val(ID(9))", zh: "宣告整數變數 y，按照身分證檢查碼公式計算結果", hint: "Dim y As Integer = X \\ 10 + 9 * (X Mod 10) + 8 * Val(ID(1)) + 7 * Val(ID(2)) + 6 * Val(ID(3)) + 5 * Val(ID(4)) + 4 * Val(ID(5)) + 3 * Val(ID(6)) + 2 * Val(ID(7)) + Val(ID(8)) + Val(ID(9))" },
                { raw: "            If data(i)(3) = \"\" And y Mod 10 <> 0 Then", zh: "判斷檢查碼是否錯誤", hint: "If data(i)(3) = \"\" And y Mod 10 <> 0 Then" },
                { raw: "                data(i)(3) = \"CHECK SUM ERROR\"", zh: "把錯誤狀況 CHECK SUM ERROR 放到陣列第 4 個欄位", hint: "data(i)(3) = \"CHECK SUM ERROR\"" },
                { raw: "            End If", zh: "結束 If 判斷式", hint: "End If" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        Loop", zh: "從頭執行迴圈", hint: "Loop" },
                { raw: "        Dim t As New DataTable", zh: "宣告 t 為資料表物件", hint: "Dim t As New DataTable" },
                { raw: "        t.Columns.Add(\"ID_NO\") : t.Columns.Add(\"NAME\") : t.Columns.Add(\"SEX\") : t.Columns.Add(\"ERROR\")", zh: "加入四個欄位名稱", hint: "t.Columns.Add(\"ID_NO\") : t.Columns.Add(\"NAME\") : t.Columns.Add(\"SEX\") : t.Columns.Add(\"ERROR\")" },
                { raw: "        For i = 0 To data.Count - 1", zh: "迴圈 i 從 0 到 data.Count - 1", hint: "For i = 0 To data.Count - 1" },
                { raw: "            Dim r As DataRow = t.NewRow", zh: "新增資料表的 Row 列", hint: "Dim r As DataRow = t.NewRow" },
                { raw: "            r(0) = data(i)(0) : r(1) = data(i)(1) : r(2) = data(i)(2) : r(3) = data(i)(3)", zh: "將資料放入對應表格欄位", hint: "r(0) = data(i)(0) : r(1) = data(i)(1) : r(2) = data(i)(2) : r(3) = data(i)(3)" },
                { raw: "            t.Rows.Add(r)", zh: "將整列加入資料表", hint: "t.Rows.Add(r)" },
                { raw: "        Next i", zh: "下個 i", hint: "Next i" },
                { raw: "        DataGridView1.DataSource = t", zh: "將資料表 t 指定給 DataGridView1 的資料來源", hint: "DataGridView1.DataSource = t" },
                { raw: "        DataGridView1.Sort(DataGridView1.Columns(0), 0)", zh: "依照身份證由小到大排序", hint: "DataGridView1.Sort(DataGridView1.Columns(0), 0)" },
                { raw: "        DataGridView1.Columns(3).Width = 150", zh: "設定錯誤狀況欄位寬度為 150，以免看不到全部訊息", hint: "DataGridView1.Columns(3).Width = 150" }
            ]
        },
        variant_bug_tests: {
            "T01": [
                { lineNum: '第 4 行', tokens: ['Do While ', 'f.EndOfStream'], errorIndex: 1, hint: '是要讀到「檔案結尾結束」還是「檔案還沒結尾時繼續」？', explain: '若寫成 f.EndOfStream，當檔案還沒結尾時條件就不成立，會連第一筆都讀不到。應該加上 Not 顛倒條件。', correct: 'Do While Not f.EndOfStream' },
                { lineNum: '第 7 行', tokens: ['If data(i)(3) = "" And Not ID Like "[A-Z]', '********', '" Then'], errorIndex: 1, hint: 'VB.NET 裡代表單一數字的萬用字元是什麼？', explain: '判斷字串格式中，單一數字應使用「#」，而非「*」（*號代表任意長度的字串）。', correct: 'If data(i)(3) = "" And Not ID Like "[A-Z]#########" Then' },
                { lineNum: '第 10 行', tokens: ['If data(i)(3) = "" And ((ID(', '2', ') = "1" And data(i)(2) <> "M") Or (ID(', '2', ') = "2" And data(i)(2) <> "F")) Then'], errorIndex: 1, hint: '身分證字號的性別碼是在陣列索引的哪裡？', explain: 'VB.NET 字串索引從 0 開始，第一個字母是 ID(0)，第二個字元（性別碼）應為 ID(1)。', correct: 'If data(i)(3) = "" And ((ID(1) = "1" And data(i)(2) <> "M") Or (ID(1) = "2" And data(i)(2) <> "F")) Then' },
                { lineNum: '第 13 行', tokens: ['Dim X As Integer = InStr("ABCDEFGHJKLMNPQRSTUVXYWZIO", ID(', '1', ')) + 9'], errorIndex: 1, hint: '身分證字號的「字母」是在哪一個位置？', explain: '字串索引從 0 開始，第一碼的英文字母是 ID(0) 而非 ID(1)。', correct: 'Dim X As Integer = InStr("ABCDEFGHJKLMNPQRSTUVXYWZIO", ID(0)) + 9' },
                { lineNum: '第 15 行', tokens: ['If data(i)(3) = "" And y ', '\\ ', '10 <> 0 Then'], errorIndex: 1, hint: '檢查碼的規則是看「餘數」還是「商數」？', explain: '身分證檢查碼規則是除以 10 後「餘數必須為 0」，應使用 Mod 取得餘數，而不是 \\ 取商。', correct: 'If data(i)(3) = "" And y Mod 10 <> 0 Then' }
            ]
        },
        procedure_end: [
            { raw: "    End Sub", zh: "結束副程式 Sub", hint: "End Sub" }
        ],
        match_results: [
            { code: "Dim ID = \"A12345678\"\nIf Not ID Like \"[A-Z]#########\" Then\n  Print(\"FORMAT ERROR\")\nEnd If", result: "FORMAT ERROR" },
            { code: "Dim ID = \"F123456789\"\nDim X = InStr(\"ABCDEFGHJKLMNPQRSTUVXYWZIO\", ID(0)) + 9\nPrint(X)", result: "15" },
            { code: "Dim ID = \"A123456789\"\nDim sex = \"M\"\nIf (ID(1) = \"1\" And sex <> \"M\") Or (ID(1) = \"2\" And sex <> \"F\") Then\n  Print(\"SEX ERROR\")\nElse\n  Print(\"PASS\")\nEnd If", result: "PASS" },
            { code: "Dim ID = \"A223456789\"\nDim sex = \"M\"\nIf (ID(1) = \"1\" And sex <> \"M\") Or (ID(1) = \"2\" And sex <> \"F\") Then\n  Print(\"SEX ERROR\")\nElse\n  Print(\"PASS\")\nEnd If", result: "SEX ERROR" }
        ]
    },
    "1060307": {
        title: "撲克牌比大小",
        procedure_start: [
            { raw: "Private Sub Form1_Load(sender As Object, e As EventArgs) Handles MyBase.Load", zh: "私有表單載入事件副程式", hint: "Private Sub Form1_Load(sender As Object, e As EventArgs) Handles MyBase.Load" }
        ],
        loop_variants: {
            "T01": [
                { raw: "        Dim f As New StreamReader(\"c:\\test\\1060307.T01\")", zh: "新增檔案讀取物件 f，讀取 1060307.T01 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060307.T01\")" },
                { raw: "        Dim n As Integer = f.ReadLine", zh: "定義整數型態變數 n，從檔案讀取一行存入該變數", hint: "Dim n As Integer = f.ReadLine" },
                { raw: "        Dim s(3) As String", zh: "宣告大小為 3 的字串陣列 s", hint: "Dim s(3) As String" },
                { raw: "        s(0) = Encoding.UTF8.GetString({226, 153, 160}) : s(1) = Encoding.UTF8.GetString({226, 153, 165})", zh: "取得黑桃與紅心字元存入字串陣列 s(0), s(1)", hint: "s(0) = Encoding.UTF8.GetString({226, 153, 160}) : s(1) = Encoding.UTF8.GetString({226, 153, 165})" },
                { raw: "        s(2) = Encoding.UTF8.GetString({226, 153, 166}) : s(3) = Encoding.UTF8.GetString({226, 153, 163})", zh: "取得方塊與梅花字元存入字串陣列 s(2), s(3)", hint: "s(2) = Encoding.UTF8.GetString({226, 153, 166}) : s(3) = Encoding.UTF8.GetString({226, 153, 163})" },
                { raw: "        Dim p() = {\"A\", \"2\", \"3\", \"4\", \"5\", \"6\", \"7\", \"8\", \"9\", \"10\", \"J\", \"Q\", \"K\"}", zh: "宣告撲克牌點數陣列 p", hint: "Dim p() = {\"A\", \"2\", \"3\", \"4\", \"5\", \"6\", \"7\", \"8\", \"9\", \"10\", \"J\", \"Q\", \"K\"}" },
                { raw: "        Dim v() = {14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}", zh: "宣告撲克牌點數大小對應陣列 v", hint: "Dim v() = {14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}" },
                { raw: "        Dim cards(51) As Integer", zh: "宣告大小為 51 的整數陣列 cards", hint: "Dim cards(51) As Integer" },
                { raw: "        Dim i As Integer", zh: "宣告整數變數 i", hint: "Dim i As Integer" },
                { raw: "        Dim a, b As Integer", zh: "宣告整數變數 a, b", hint: "Dim a, b As Integer" },
                { raw: "        Dim dt As New DataTable", zh: "宣告 DataTable 分頁資料表物件 dt", hint: "Dim dt As New DataTable" },
                { raw: "        dt.Columns.Add(\"序號\") : dt.Columns.Add(\"玩家\") : dt.Columns.Add(\"莊家\") : dt.Columns.Add(\"結果\")", zh: "為 DataTable dt 加入四個欄位名稱", hint: "dt.Columns.Add(\"序號\") : dt.Columns.Add(\"玩家\") : dt.Columns.Add(\"莊家\") : dt.Columns.Add(\"結果\")" },
                { raw: "        While Not f.EndOfStream", zh: "讀取檔案直到結尾 (While 迴圈)", hint: "While Not f.EndOfStream" },
                { raw: "            Dim no As Integer", zh: "宣告整數變數 no", hint: "Dim no As Integer" },
                { raw: "            Do", zh: "迴圈開頭 Do", hint: "Do" },
                { raw: "                no = Int(f.ReadLine * 52)", zh: "讀取亂數種子並放大 52 倍取整數對應牌號", hint: "no = Int(f.ReadLine * 52)" },
                { raw: "            Loop While cards(no) = 1", zh: "若已抽過該張牌則重新抽籤", hint: "Loop While cards(no) = 1" },
                { raw: "            cards(no) = 1", zh: "標記該張牌已經抽過", hint: "cards(no) = 1" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "            If i Mod 2 = 1 Then", zh: "判斷是否為玩家抽牌 (奇數次)", hint: "If i Mod 2 = 1 Then" },
                { raw: "                a = no", zh: "將牌號指定給玩家 a", hint: "a = no" },
                { raw: "            Else", zh: "否則", hint: "Else" },
                { raw: "                b = no", zh: "將牌號指定給莊家 b", hint: "b = no" },
                { raw: "                Dim r As DataRow = dt.NewRow", zh: "建立 DataTable 的新資料列 r", hint: "Dim r As DataRow = dt.NewRow" },
                { raw: "                r(0) = i / 2", zh: "將回合數存入 r(0)", hint: "r(0) = i / 2" },
                { raw: "                r(1) = s(a \\ 13) & p(a Mod 13)", zh: "組合花色與點數存入玩家卡牌 r(1)", hint: "r(1) = s(a \\ 13) & p(a Mod 13)" },
                { raw: "                r(2) = s(b \\ 13) & p(b Mod 13)", zh: "組合花色與點數存入莊家卡牌 r(2)", hint: "r(2) = s(b \\ 13) & p(b Mod 13)" },
                { raw: "                If v(a Mod 13) > v(b Mod 13) Then", zh: "如果玩家點數大於莊家", hint: "If v(a Mod 13) > v(b Mod 13) Then" },
                { raw: "                    r(3) = \"玩家贏\"", zh: "結果為玩家贏", hint: "r(3) = \"玩家贏\"" },
                { raw: "                ElseIf v(a Mod 13) < v(b Mod 13) Then", zh: "如果玩家點數小於莊家", hint: "ElseIf v(a Mod 13) < v(b Mod 13) Then" },
                { raw: "                    r(3) = \"莊家贏\"", zh: "結果為莊家贏", hint: "r(3) = \"莊家贏\"" },
                { raw: "                Else", zh: "否則", hint: "Else" },
                { raw: "                    r(3) = \"平手\"", zh: "結果為平手", hint: "r(3) = \"平手\"" },
                { raw: "                End If", zh: "結束 If 判斷式", hint: "End If" },
                { raw: "                dt.Rows.Add(r)", zh: "加入該列資料到表格中", hint: "dt.Rows.Add(r)" },
                { raw: "            End If", zh: "結束 If 判斷式", hint: "End If" },
                { raw: "            If i = n * 2 Then Exit While", zh: "如果抽牌次數達到總局數則跳出迴圈", hint: "If i = n * 2 Then Exit While" },
                { raw: "        End While", zh: "結束 While", hint: "End While" },
                { raw: "        DataGridView1.DataSource = dt", zh: "將資料表指定給 DataGridView", hint: "DataGridView1.DataSource = dt" }
            ]
        },
        variant_bug_tests: {
            "T01": [
                { lineNum: '第 16 行', tokens: ['no = Int(f.ReadLine ', '/ ', '52)'], errorIndex: 1, hint: 'ReadLine 讀進來的是 0~1 的小數，要轉為 0~51 的數字該用乘法還是除法？', explain: '必須把 0~1 之間的小數放大 52 倍，所以應使用乘號 (*)，而非除號 (/)。', correct: 'no = Int(f.ReadLine * 52)' },
                { lineNum: '第 17 行', tokens: ['Loop ', 'While ', 'cards(no) = ', '0'], errorIndex: 3, hint: '什麼狀況下必須重新抽牌？', explain: '若抽到的牌已經發過了 (陣列值被標記為 1)，就必須一直重複抽籤。所以條件應為 cards(no) = 1。', correct: 'Loop While cards(no) = 1' },
                { lineNum: '第 18 行', tokens: ['cards(no) = ', '0'], errorIndex: 1, hint: '抽到這張牌後，要把陣列的紀錄改成什麼數字代表已抽出？', explain: '原本陣列預設都是 0 代表未發出，抽出後必須將該位置設為 1 來標記，避免重複發牌。', correct: 'cards(no) = 1' },
                { lineNum: '第 26 行', tokens: ['r(1) = s(a ', 'Mod ', '13) & p(a ', '\\ ', '13)'], errorIndex: 1, hint: '花色跟點數的求法是不是寫反了？', explain: '花色是連續 13 張一樣，所以是除以 13 取商數 (\\)；點數是每 13 張一個循環，所以是除以 13 取餘數 (Mod)。', correct: 'r(1) = s(a \\ 13) & p(a Mod 13)' },
                { lineNum: '第 28 行', tokens: ['If ', 'a Mod 13 ', '> ', 'b Mod 13 ', 'Then'], errorIndex: 1, hint: '撲克牌直接比「餘數」合理嗎？（例如 K 出來餘數是 12, A 出來餘數是 0）', explain: '花色 A, K, Q, J 的大小有特殊定義，應該透過查表陣列 v 來比較真正的點數大小，例如 v(a Mod 13) > v(b Mod 13)。', correct: 'If v(a Mod 13) > v(b Mod 13) Then' }
            ]
        },
        procedure_end: [
            { raw: "    End Sub", zh: "結束副程式 Sub", hint: "End Sub" }
        ],
        match_results: [
            { code: "Dim no = Int(0.5 * 52)\nPrint(no)", result: "26" },
            { code: "Dim p() = {\"A\", \"2\", \"3\", \"4\", \"5\", \"6\", \"7\", \"8\", \"9\", \"10\", \"J\", \"Q\", \"K\"}\nPrint(p(26 Mod 13))", result: "A" },
            { code: "Dim s() = {\"♠\", \"♥\", \"♦\", \"♣\"}\nPrint(s(26 \\ 13))", result: "♦" },
            { code: "Dim v() = {14, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13}\nIf v(0) > v(11) Then\n  Print(\"玩家贏\")\nElse\n  Print(\"莊家贏\")\nEnd If", result: "玩家贏" }
        ]
    },
    "1060308": {
        title: "分數的四則運算",
        procedure_start: [
            { raw: "Private Sub Form1_Load(sender As Object, e As EventArgs) Handles Me.Load", zh: "私有表單載入事件副程式", hint: "Private Sub Form1_Load(sender As Object, e As EventArgs) Handles Me.Load" },
            { raw: "        Dim f As New StreamReader(\"c:\\test\\1060308.sm\")", zh: "新增檔案讀取物件 f，讀取 1060308.sm 資料檔", hint: "Dim f As New StreamReader(\"c:\\test\\1060308.sm\")" }
        ],
        loop_variants: {
            "T01": [
                { raw: "        Dim a, b, op, x, y As New ArrayList", zh: "宣告 ArrayList 物件 a, b, op, x, y", hint: "Dim a, b, op, x, y As New ArrayList" },
                { raw: "        Dim i As Integer", zh: "宣告整數變數 i", hint: "Dim i As Integer" },
                { raw: "        Dim dt As New DataTable", zh: "宣告 DataTable 分頁資料表物件 dt", hint: "Dim dt As New DataTable" },
                { raw: "        dt.Columns.Add(\"VALUE1\") : dt.Columns.Add(\"OP\") : dt.Columns.Add(\"VALUE2\") : dt.Columns.Add(\"ANSWER\")", zh: "為 DataTable dt 加入四個欄位名稱", hint: "dt.Columns.Add(\"VALUE1\") : dt.Columns.Add(\"OP\") : dt.Columns.Add(\"VALUE2\") : dt.Columns.Add(\"ANSWER\")" },
                { raw: "        While Not f.EndOfStream", zh: "讀取檔案直到結尾 (While 迴圈)", hint: "While Not f.EndOfStream" },
                { raw: "            Dim data As String() = f.ReadLine.Split(\",\")", zh: "從檔案讀取一列資料，並以逗號分割，放入 data 陣列中", hint: "Dim data As String() = f.ReadLine.Split(\",\")" },
                { raw: "            b.Add(data(0)) : a.Add(data(1)) : op.Add(data(2)) : y.Add(data(3)) : x.Add(data(4))", zh: "將 data 陣列中的資料依序放入對應陣列 b, a, op, y, x 中", hint: "b.Add(data(0)) : a.Add(data(1)) : op.Add(data(2)) : y.Add(data(3)) : x.Add(data(4))" },
                { raw: "            Dim dr As DataRow = dt.NewRow", zh: "建立新的資料列 dr", hint: "Dim dr As DataRow = dt.NewRow" },
                { raw: "            dr(0) = b(i) & \"/\" & a(i) : dr(1) = op(i) : dr(2) = y(i) & \"/\" & x(i) : dt.Rows.Add(dr)", zh: "格式化分數字串並加入新資料列", hint: "dr(0) = b(i) & \"/\" & a(i) : dr(1) = op(i) : dr(2) = y(i) & \"/\" & x(i) : dt.Rows.Add(dr)" },
                { raw: "            Dim m1, m2, cf As Integer", zh: "宣告整數變數：分子 m1, 分母 m2, 公因數 cf", hint: "Dim m1, m2, cf As Integer" },
                { raw: "            Select Case op(i)", zh: "根據運算子 op 變數進行判斷 switch(i)", hint: "Select Case op(i)" },
                { raw: "                Case \"+\"", zh: "當運算子為加號時", hint: "Case \"+\"" },
                { raw: "                    m1 = b(i) * x(i) + a(i) * y(i) : m2 = a(i) * x(i)", zh: "通分計算加法：分子m1 分母m2", hint: "m1 = b(i) * x(i) + a(i) * y(i) : m2 = a(i) * x(i)" },
                { raw: "                Case \"-\"", zh: "當運算子為減號時", hint: "Case \"-\"" },
                { raw: "                    m1 = b(i) * x(i) - a(i) * y(i) : m2 = a(i) * x(i)", zh: "通分計算減法：分子m1 分母m2", hint: "m1 = b(i) * x(i) - a(i) * y(i) : m2 = a(i) * x(i)" },
                { raw: "                Case \"*\"", zh: "當運算子為乘號時", hint: "Case \"*\"" },
                { raw: "                    m1 = b(i) * y(i) : m2 = a(i) * x(i)", zh: "計算乘法：分母乘分母，分子乘分子", hint: "m1 = b(i) * y(i) : m2 = a(i) * x(i)" },
                { raw: "                Case \"/\"", zh: "當運算子為除號時", hint: "Case \"/\"" },
                { raw: "                    m1 = b(i) * x(i) : m2 = a(i) * y(i)", zh: "計算除法：交叉相乘", hint: "m1 = b(i) * x(i) : m2 = a(i) * y(i)" },
                { raw: "            End Select", zh: "結束 Select 判斷", hint: "End Select" },
                { raw: "            cf = 2", zh: "初始化公因數 cf 為 2", hint: "cf = 2" },
                { raw: "            While cf <= Math.Abs(m1) And cf <= Math.Abs(m2)", zh: "當公因數 cf 小於等於分子與分母絕對值", hint: "While cf <= Math.Abs(m1) And cf <= Math.Abs(m2)" },
                { raw: "                While m1 Mod cf = 0 And m2 Mod cf = 0", zh: "若分子 m1 與分母 m2 皆能被公因數 cf 整除，繼續約分", hint: "While m1 Mod cf = 0 And m2 Mod cf = 0" },
                { raw: "                    m1 \\= cf : m2 \\= cf", zh: "約分：分子分母同除以 cf", hint: "m1 \\= cf : m2 \\= cf" },
                { raw: "                End While", zh: "結束 While", hint: "End While" },
                { raw: "                cf += 1", zh: "公因數 cf 遞增", hint: "cf += 1" },
                { raw: "            End While", zh: "結束 While", hint: "End While" },
                { raw: "            If m1 = 0 Then", zh: "若分子 m1 為 0", hint: "If m1 = 0 Then" },
                { raw: "                dr(3) = 0", zh: "結果直接顯示 0", hint: "dr(3) = 0" },
                { raw: "            ElseIf m2 = 1 Then", zh: "否則若分母 m2 為 1", hint: "ElseIf m2 = 1 Then" },
                { raw: "                dr(3) = m1", zh: "結果直接顯示整數分子", hint: "dr(3) = m1" },
                { raw: "            Else", zh: "否則", hint: "Else" },
                { raw: "                dr(3) = m1 & \"/\" & m2", zh: "結果顯示化簡後的分數形式：分子/分母", hint: "dr(3) = m1 & \"/\" & m2" },
                { raw: "            End If", zh: "結束 If 判斷式", hint: "End If" },
                { raw: "            i += 1", zh: "把 i 加 1", hint: "i += 1" },
                { raw: "        End While", zh: "結束 While", hint: "End While" },
                { raw: "        DataGridView1.DataSource = dt", zh: "將資料表指定給 DataGridView", hint: "DataGridView1.DataSource = dt" },
                { raw: "        DataGridView1.ColumnHeadersDefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter", zh: "欄位名稱置中", hint: "DataGridView1.ColumnHeadersDefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter" },
                { raw: "        DataGridView1.RowsDefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter", zh: "欄位內容置中", hint: "DataGridView1.RowsDefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter" }
            ]
        },
        variant_bug_tests: {
            "T01": [
                { lineNum: '第 13 行', tokens: ['m1 = b(i) * x(i) ', '* ', 'a(i) * y(i) : m2 = a(i) * x(i)'], errorIndex: 1, hint: '這是計算加法時的分數通分，中間應該是什麼運算符號？', explain: '通分後相加的分子應該是相加 (+)，寫成相乘 (*) 就變成不對的運算了。', correct: 'm1 = b(i) * x(i) + a(i) * y(i) : m2 = a(i) * x(i)' },
                { lineNum: '第 22 行', tokens: ['While cf <= Math.Abs(m1) ', 'Or ', 'cf <= Math.Abs(m2)'], errorIndex: 1, hint: '公約數尋找範圍，是不可超過「其中之一就好」還是「都不可超過」？', explain: '這是尋找公約數的上限，公約數不能大於分子跟分母雙方，所以必須兩者都小於等於，應使用 And。', correct: 'While cf <= Math.Abs(m1) And cf <= Math.Abs(m2)' },
                { lineNum: '第 23 行', tokens: ['While m1 Mod cf = 0 ', 'Or ', 'm2 Mod cf = 0'], errorIndex: 1, hint: '所謂的「公因數」，是「其中一個能被整除」還是「兩個都要能被整除」？', explain: '公因數必須同時整除分子和分母才可以約分。若用 Or 會變成只要其中一個能除也可以，導致分子或分母變成小數錯誤。應改為 And。', correct: 'While m1 Mod cf = 0 And m2 Mod cf = 0' },
                { lineNum: '第 24 行', tokens: ['m1 \\= ', '2 ', ': m2 \\= ', '2'], errorIndex: 1, hint: '約分的除數固定會是 2 嗎？', explain: '約分應除以剛剛找到的公因數變數 cf，因為它不一定是 2（可能是 3, 5 等等）。', correct: 'm1 \\= cf : m2 \\= cf' },
                { lineNum: '第 30 行', tokens: ['ElseIf m2 = ', '0 ', 'Then'], errorIndex: 1, hint: '分母如果為 1，分數會變成整數顯示。那分母有可能是 0 嗎？', explain: '數學中分母不可為 0。這裡是要判斷當分母被約分成 1 時（例如 5/1），就直接顯示整數分子（如 5）。', correct: 'ElseIf m2 = 1 Then' }
            ]
        },
        procedure_end: [
            { raw: "    End Sub", zh: "結束副程式 Sub", hint: "End Sub" }
        ],
        match_results: [
            { code: "Dim a=2, b=1, x=3, y=1\n' 計算 1/2 + 1/3 (交叉相乘通分)\nDim m1 = b * x + a * y\nDim m2 = a * x\nPrint(m1 & \"/\" & m2)", result: "5/6" },
            { code: "Dim a=2, b=1, x=3, y=1\n' 計算 1/2 / 1/3 (除法交叉相乘)\nDim m1 = b * x\nDim m2 = a * y\nPrint(m1 & \"/\" & m2)", result: "3/2" },
            { code: "Dim m1 = 10, m2 = 15, cf = 5\n' 若公約數均可整除則約分\nWhile m1 Mod cf=0 And m2 Mod cf=0\n  m1 \\= cf : m2 \\= cf\nEnd While\nPrint(m1 & \"/\" & m2)", result: "2/3" },
            { code: "Dim m1 = 5, m2 = 1\nIf m1 = 0 Then\n  Print(0)\nElseIf m2 = 1 Then\n  Print(m1)\nElse\n  Print(m1 & \"/\" & m2)\nEnd If", result: "5" }
        ]
    }
};

/**
 * 輔助函數：根據 ID 與 測資組別產出完整的步驟數組
 * @param {string} id - 如 'Q1'
 * @param {string} type - 'T01', 'T02', 或 'T03'
 * @returns {Array} 完整的練習步驟
 */
function generateSteps(id, type) {
    const data = QUIZ_DATA[id];
    if (!data) return [];

    // 如果是通用 SETUP，直接回傳
    if (id === "SETUP") return data.steps;

    let steps = [];

    // 1. 副程式開始
    const start = (data.procedure_start || []).map(line => ({
        zh: line.zh,
        code: line.raw.replace("{{EXT}}", type),
        hint: line.raw.replace("{{EXT}}", type)
    }));
    steps = steps.concat(start);

    // 3. 迴圈核心 (變體)
    const variant = data.loop_variants ? data.loop_variants[type] : [];
    steps = steps.concat(variant.map(v => ({
        zh: v.zh,
        code: v.raw,
        hint: v.hint || v.raw
    })));

    // 4. 副程式結尾
    steps = steps.concat((data.procedure_end || []).map(line => ({
        zh: line.zh,
        code: line.raw,
        hint: line.hint || line.raw
    })));

    return steps;
}

/* === 動態考場資料注入 === */
(function injectDynamicUserSetup() {
    let userName = "吳烱賢";
    let userSeat = "９９";

    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user) {
            if (user.name) userName = user.name;
            if (user.no) userSeat = String(user.no).padStart(2, '0');
        }
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}/${mm}/${dd}`;

    const step0Code = `RichTextBox1.Text &= "姓名：${userName}　　術科測試編號：12345678" + vbCrLf`;
    const step1Code = `RichTextBox1.Text &= "座號：${userSeat}　　　日期：${dateStr}" + vbCrLf`;

    if (QUIZ_DATA && QUIZ_DATA["SETUP"]) {
        if (QUIZ_DATA["SETUP"].steps && QUIZ_DATA["SETUP"].steps.length >= 2) {
            QUIZ_DATA["SETUP"].steps[0].code = step0Code;
            QUIZ_DATA["SETUP"].steps[1].code = step1Code;
        }

        if (QUIZ_DATA["SETUP"].match_results && QUIZ_DATA["SETUP"].match_results.length >= 2) {
            QUIZ_DATA["SETUP"].match_results[0].code = step0Code;
            QUIZ_DATA["SETUP"].match_results[0].result = `姓名：${userName}　　術科測試編號：12345678\n(換行)`;
            
            QUIZ_DATA["SETUP"].match_results[1].code = step1Code;
            QUIZ_DATA["SETUP"].match_results[1].result = `座號：${userSeat}　　　日期：${dateStr}\n(換行)`;
        }

        if (QUIZ_DATA["SETUP"].bug_tests && QUIZ_DATA["SETUP"].bug_tests.length >= 2) {
            if (QUIZ_DATA["SETUP"].bug_tests[0].tokens && QUIZ_DATA["SETUP"].bug_tests[0].tokens.length >= 3) {
                QUIZ_DATA["SETUP"].bug_tests[0].tokens[2] = `"姓名：${userName}　　術科測試編號：12345678" `;
            }
            QUIZ_DATA["SETUP"].bug_tests[0].correct = step0Code;
            
            if (QUIZ_DATA["SETUP"].bug_tests[1].tokens && QUIZ_DATA["SETUP"].bug_tests[1].tokens.length >= 3) {
                QUIZ_DATA["SETUP"].bug_tests[1].tokens[2] = `"座號：${userSeat}　　　日期：${dateStr}" `;
                QUIZ_DATA["SETUP"].bug_tests[1].correct = step1Code;
            }
        }
    }
})();
