const fs = require('fs');
let c = fs.readFileSync('pages/中英選擇題.html', 'utf8');

const anchor = `// Try to prioritize words that appear in the current level's code`;
const endAnchor = `loadQuestion();\n}`;

const newChunk = `// Try to prioritize words that appear in the current level's code
    if (typeof generateSteps === 'function') {
        const steps = generateSteps(qID, tID);
        const codeText = steps.map(s => s.code).join('\\n');
        
        let levelWords = pool.filter(item => {
            let searchWord = item.word;
            if (searchWord.endsWith('()')) {
                searchWord = searchWord.slice(0, -2);
            }
            if (searchWord === '\\\\') searchWord = '\\\\\\\\';
            if (item.word === '\\\\') return codeText.includes('\\\\');
            try {
                const regex = new RegExp('\\\\b' + searchWord + '\\\\b', 'i');
                return regex.test(codeText);
            } catch(e) {
                return codeText.includes(searchWord);
            }
        });
        
        let seenWords = JSON.parse(sessionStorage.getItem('seenDictWords') || '[]');

        if (levelWords.length > 0) {
            // Priority 1: Unseen words in this level's code
            let unseenLevel = levelWords.filter(w => !seenWords.includes(w.word));
            // Priority 2: Seen words in this level's code
            let seenLevel = levelWords.filter(w => seenWords.includes(w.word));
            
            unseenLevel = shuffle(unseenLevel);
            seenLevel = shuffle(seenLevel);
            
            // Limit the questions to max 5 to reduce repetition on similar stages
            currentQuizQuestionsTotal = Math.min(5, Math.max(3, levelWords.length));
            TOTAL_QUESTIONS = currentQuizQuestionsTotal;
            
            pool = unseenLevel.concat(seenLevel);
        } else {
            pool = shuffle(pool);
            TOTAL_QUESTIONS = 5;
            currentQuizQuestionsTotal = 5;
        }
    } else {
         pool = shuffle(pool);
         TOTAL_QUESTIONS = 5;
    }
    
    questions = pool.slice(0, TOTAL_QUESTIONS);
    
    // Mark these as seen for the next game
    let seenWordsUpdate = JSON.parse(sessionStorage.getItem('seenDictWords') || '[]');
    questions.forEach(q => {
        if (!seenWordsUpdate.includes(q.word)) seenWordsUpdate.push(q.word);
    });
    sessionStorage.setItem('seenDictWords', JSON.stringify(seenWordsUpdate));
    
    loadQuestion();
}`;

let newC = c.replace(/[\s\S]*?loadQuestion\(\);\s*\}/g, match => {
    // Only replace the last occurrence in startQuiz, actually let's just use string replace carefully
    return match;
});

// A safer way:
const regex = /\/\/ Try to prioritize words that appear in the current level's code[\s\S]*?loadQuestion\(\);\s*\}/;
c = c.replace(regex, newChunk);

fs.writeFileSync('pages/中英選擇題.html', c);
console.log('Successfully added sessionStorage tracking and dynamic question sizing.');
