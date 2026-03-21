const fs = require('fs');
let c = fs.readFileSync('pages/中英選擇題.html', 'utf8');

const newDictionary = `const DICTIONARY = [
    { word: "Dim", desc: "宣告變數" },
    { word: "As", desc: "定義資料型別" },
    { word: "Integer", desc: "整數資料型別" },
    { word: "String", desc: "字串資料型別" },
    { word: "New", desc: "建立新物件" },
    { word: "StreamReader", desc: "用以讀取檔案內容的串流" },
    { word: "ReadLine()", desc: "從檔案或串流中讀取一行文字" },
    { word: "For", desc: "計數迴圈的開始" },
    { word: "To", desc: "指定 For 迴圈的終止數值" },
    { word: "If", desc: "條件判斷式的開頭" },
    { word: "Then", desc: "判斷式成立時所要執行的區塊標記" },
    { word: "Next", desc: "For 迴圈的結尾，用來遞增計數器" },
    { word: "Exit For", desc: "強制跳出 For 迴圈" },
    { word: "Exit Do", desc: "強制跳出 Do 迴圈" },
    { word: "Do While", desc: "條件為真時，繼續執行的迴圈開頭 (前測試)" },
    { word: "Do", desc: "迴圈開頭標記 (常與 Loop搭配)" },
    { word: "Loop", desc: "Do 迴圈的結尾標記" },
    { word: "Loop While", desc: "條件為真時，繼續執行的迴圈結尾標記 (後測試)" },
    { word: "Length", desc: "取得字串的長度或陣列的大小" },
    { word: "Sub", desc: "宣告一個不回傳值的副程式 (程序)" },
    { word: "End Sub", desc: "宣告副程式 (程序) 的結束" },
    { word: "vbCrLf", desc: "VB 專屬的換行字元 (Carriage Return + Line Feed)" },
    { word: "RichTextBox", desc: "能夠顯示與編輯多格式文字的文字方塊控制項" },
    { word: "AppendText()", desc: "將文字附加到現有文字的最後面" },
    { word: "StreamWriter", desc: "用以將字元寫入串流中" },
    { word: "Mid()", desc: "從字串中間擷取指定長度的子字串" },
    { word: "Split()", desc: "使用指定的分隔符號將字串切割成陣列" },
    { word: "FileOpen()", desc: "開啟指定路徑的檔案供讀寫" },
    { word: "PrintLine()", desc: "將一行包含換行符號的文字寫入檔案" },
    { word: "EOF()", desc: "判斷是否已經讀取到檔案的結尾 (End Of File)" },
    // --- 新增的進階/特定關卡關鍵字 ---
    { word: "Math.Abs()", desc: "取得數值的絕對值" },
    { word: "Val()", desc: "將字串轉換成對應的數值" },
    { word: "DataTable", desc: "表示記憶體內的一份資料表物件" },
    { word: "NewRow", desc: "建立資料表的一筆新紀錄 (Row)" },
    { word: "DataRow", desc: "表示資料表中的資料列型別" },
    { word: "Columns.Add()", desc: "在資料表的欄位集合中新增一個欄位" },
    { word: "Rows.Add()", desc: "將一筆資料列加入至資料表的列集合" },
    { word: "Mod", desc: "取除法計算後的餘數" },
    { word: "\\\\", desc: "整數除法運算子，會無條件捨去小數點" },
    { word: "Encoding.UTF8.GetString()", desc: "將 UTF-8 編碼的位元組陣列轉換為字串" },
    { word: "Int()", desc: "將數字無條件捨去至最接近的整數" },
    { word: "List(Of String())", desc: "宣告一個儲存字串陣列的動態串列" },
    { word: "InStr()", desc: "傳回某字串在另一個字串中第一次出現的起始位置" },
    { word: "Sort()", desc: "對資料進行排序" },
    { word: "DataSource", desc: "設定或取得控制項用來顯示的資料來源" },
    { word: "Align", desc: "設定對齊方式" },
    { word: "DataGridView", desc: "以可自訂的格線顯示資料表的控制項" }
];`;

const newStartQuiz = `let currentQuizQuestionsTotal = 10;
let TOTAL_QUESTIONS = 10;
function startQuiz() {
    correctCount = 0;
    currentQuestionIndex = 0;
    
    let pool = [...DICTIONARY];
    
    // Try to prioritize words that appear in the current level's code
    if (typeof generateSteps === 'function') {
        const steps = generateSteps(qID, tID);
        const codeText = steps.map(s => s.code).join('\\n');
        
        let levelWords = pool.filter(item => {
            let searchWord = item.word;
            if (searchWord.endsWith('()')) {
                searchWord = searchWord.slice(0, -2);
            }
            if (searchWord === '\\\\') searchWord = '\\\\\\\\'; // escape for regex if needed, wait, backslash is tricky.
            
            if (item.word === '\\\\') {
                return codeText.includes('\\\\');
            }

            try {
                // simple boundary matching
                const regex = new RegExp('\\\\b' + searchWord + '\\\\b', 'i');
                return regex.test(codeText);
            } catch(e) {
                return codeText.includes(searchWord);
            }
        });
        
        if (levelWords.length > 0) {
            let otherWords = pool.filter(w => !levelWords.includes(w));
            levelWords = shuffle(levelWords);
            otherWords = shuffle(otherWords);
            
            // Limit the questions to around the amount of keywords found, max 10, min 5
            currentQuizQuestionsTotal = Math.min(10, Math.max(5, levelWords.length));
            TOTAL_QUESTIONS = currentQuizQuestionsTotal;
            
            pool = levelWords.concat(otherWords);
        } else {
            pool = shuffle(pool);
            TOTAL_QUESTIONS = 10;
            currentQuizQuestionsTotal = 10;
        }
    } else {
         pool = shuffle(pool);
    }
    
    questions = pool.slice(0, TOTAL_QUESTIONS);
    
    loadQuestion();
}`;

// Replacing DICTIONARY
c = c.replace(/const DICTIONARY = \[\s*\{[\s\S]*?\}\s*\];/, newDictionary);

// Replacing startQuiz
// We also need to be careful not to keep the old TOTAL_QUESTIONS global if startQuiz uses it
c = c.replace(/function startQuiz\(\) \{[\s\S]*?loadQuestion\(\);\s*\}/, newStartQuiz);

// Since we redefine TOTAL_QUESTIONS in the newStartQuiz (or override it), 
// we should remove the old \`const TOTAL_QUESTIONS = 10;\` if it exists to avoid const re-assignment errors.
c = c.replace('const TOTAL_QUESTIONS = 10;', ''); 

fs.writeFileSync('pages/中英選擇題.html', c);
console.log('Successfully expanded dictionary and dynamic levels.');
