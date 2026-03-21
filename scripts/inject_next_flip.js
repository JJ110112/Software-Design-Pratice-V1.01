const fs = require('fs');
let c = fs.readFileSync('pages/記憶翻牌遊戲.html', 'utf8');

const newChunk = `
    setupNextLevelButton();
}

function setupNextLevelButton() {
    const LEVEL_SEQUENCE = [
      { q: 'SETUP', t: 'T01' }, { q: 'Q1', t: 'T01' }, { q: 'Q1', t: 'T02' }, { q: 'Q1', t: 'T03' },
      { q: 'Q2', t: 'T01' }, { q: 'Q2', t: 'T02' }, { q: 'Q2', t: 'T03' }, { q: 'Q3', t: 'T01' },
      { q: 'Q3', t: 'T02' }, { q: 'Q3', t: 'T03' }, { q: 'Q4', t: 'T01' }, { q: 'Q4', t: 'T02' },
      { q: 'Q4', t: 'T03' }, { q: 'Q5', t: 'T01' }, { q: 'Q5', t: 'T02' }, { q: 'Q5', t: 'T03' },
      { q: '1060306', t: 'T01' }, { q: '1060307', t: 'T01' }, { q: '1060308', t: 'T01' }
    ];
    let currentIndex = LEVEL_SEQUENCE.findIndex(l => l.q === qID && l.t === tID);
    const nextBtn = document.getElementById('btn-next-level');
    if (nextBtn) {
        if (currentIndex >= 0 && currentIndex < LEVEL_SEQUENCE.length - 1) {
            const nextLv = LEVEL_SEQUENCE[currentIndex + 1];
            nextBtn.style.display = 'block';
            nextBtn.onclick = () => {
                window.location.href = \`記憶翻牌遊戲.html?q=\${nextLv.q}&t=\${nextLv.t}\`;
            };
        } else {
            nextBtn.style.display = 'none';
            nextBtn.onclick = null;
        }
    }
}

function updateStats`;

if (c.includes('function updateStats')) {
    // Replace the end of `showWin` and insert the new function
    // Look for `}\n\nfunction updateStats` or `}\r\n\r\nfunction updateStats`
    let replaced = false;
    if (c.includes('}\n\nfunction updateStats')) {
        c = c.replace('}\n\nfunction updateStats', newChunk);
        replaced = true;
    } else if (c.includes('}\r\n\r\nfunction updateStats')) {
        c = c.replace('}\r\n\r\nfunction updateStats', newChunk);
        replaced = true;
    } else if (c.includes('}\nfunction updateStats')) {
        c = c.replace('}\nfunction updateStats', newChunk);
        replaced = true;
    } else if (c.includes('}\r\nfunction updateStats')) {
        c = c.replace('}\r\nfunction updateStats', newChunk);
        replaced = true;
    }
    
    if (replaced) {
        fs.writeFileSync('pages/記憶翻牌遊戲.html', c);
        console.log('Successfully injected setupNextLevelButton!');
    } else {
        console.log('Could not find exact format for function updateStats replacement');
    }
} else {
    console.log('updateStats function not found');
}
