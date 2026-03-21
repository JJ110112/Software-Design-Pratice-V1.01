const fs = require('fs');
let c = fs.readFileSync('pages/中英選擇題.html', 'utf8');
const p1 = c.indexOf('window.saveScore(user.className, user.name, qID');
const p2 = c.indexOf('</script>', p1);
const newChunk = `window.saveScore(user.className, user.name, qID + '_' + tID, "中英選擇題", seconds, "PASS", stars)
              .then(res => console.log("選擇題成績上傳完成:", res));
        }
    }

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
    if (currentIndex >= 0 && currentIndex < LEVEL_SEQUENCE.length - 1) {
        const nextLv = LEVEL_SEQUENCE[currentIndex + 1];
        nextBtn.style.display = 'block';
        nextBtn.onclick = () => {
            window.location.href = \`中英選擇題.html?q=\${nextLv.q}&t=\${nextLv.t}\`;
        };
    } else {
        nextBtn.style.display = 'none';
        nextBtn.onclick = null;
    }
}
`;
fs.writeFileSync('pages/中英選擇題.html', c.substring(0, p1) + newChunk + c.substring(p2));
console.log('Done mapping next level button!');
