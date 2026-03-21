const fs = require('fs');
let c = fs.readFileSync('pages/中英選擇題.html', 'utf8');

if (!c.includes('<script src="../js/quiz_data.js"></script>')) {
    c = c.replace('<script src="../js/users.js"></script>', '<script src="../js/users.js"></script>\n<script src="../js/quiz_data.js"></script>');
}

const oldStartQuiz = `function startQuiz() {
    correctCount = 0;
    currentQuestionIndex = 0;
    
    // Pick 10 random words
    let shuffledDict = shuffle([...DICTIONARY]);
    questions = shuffledDict.slice(0, TOTAL_QUESTIONS);
    
    loadQuestion();
}`;

const newStartQuiz = `function startQuiz() {
    correctCount = 0;
    currentQuestionIndex = 0;
    
    let pool = [...DICTIONARY];
    
    // Try to prioritize words that appear in the current level's code
    if (typeof generateSteps === 'function') {
        const steps = generateSteps(qID, tID);
        const codeText = steps.map(s => s.code).join('\\n');
        
        // Find words in the dictionary that appear in the codeText
        let levelWords = pool.filter(item => {
            let searchWord = item.word;
            if (searchWord.endsWith('()')) {
                searchWord = searchWord.slice(0, -2);
            }
            // Use regex for exact word match where possible to avoid substring matches
            try {
                const regex = new RegExp('\\\\b' + searchWord + '\\\\b', 'i');
                return regex.test(codeText);
            } catch(e) {
                // Fallback for special characters
                return codeText.includes(searchWord);
            }
        });
        
        if (levelWords.length > 0) {
            let otherWords = pool.filter(w => !levelWords.includes(w));
            levelWords = shuffle(levelWords);
            otherWords = shuffle(otherWords);
            pool = levelWords.concat(otherWords);
        } else {
            pool = shuffle(pool);
        }
    } else {
         pool = shuffle(pool);
    }
    
    questions = pool.slice(0, TOTAL_QUESTIONS);
    
    // Adjust TOTAL_QUESTIONS dynamically if the pool is smaller than 10 (though DICTIONARY has 29 items)
    if (questions.length < TOTAL_QUESTIONS) {
        // ... handled implicitly by slice
    }
    
    loadQuestion();
}`;

if (c.includes(oldStartQuiz)) {
    c = c.replace(oldStartQuiz, newStartQuiz);
    fs.writeFileSync('pages/中英選擇題.html', c);
    console.log("Successfully patched dictionary logic!");
} else {
    // Maybe line endings are different
    const oldStartQuizCRLF = oldStartQuiz.replace(/\\n/g, '\\r\\n');
    if (c.includes(oldStartQuizCRLF)) {
        c = c.replace(oldStartQuizCRLF, newStartQuiz.replace(/\\n/g, '\\r\\n'));
        fs.writeFileSync('pages/中英選擇題.html', c);
        console.log("Successfully patched dictionary logic (CRLF)!");
    } else {
        console.log("Could not find startQuiz function matching the signature.");
    }
}
