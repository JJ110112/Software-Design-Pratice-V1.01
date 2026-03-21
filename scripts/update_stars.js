const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html') && f !== 'map.html');

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 1. Add totalHintsUsed
    if (content.includes('let hintUsed') && !content.includes('totalHintsUsed = 0')) {
        content = content.replace(/let hintUsed\s*=\s*(false|true);/g, 'let hintUsed = $1;\nlet totalHintsUsed = 0;');
        modified = true;
    }

    // 2. Increment totalHintsUsed on hint click
    if (content.includes("document.getElementById('btn-hint').addEventListener('click'") && !content.includes('totalHintsUsed++')) {
        content = content.replace(/hintUsed\s*=\s*true;/g, 'hintUsed = true;\n  if (typeof totalHintsUsed !== "undefined") { totalHintsUsed++; }');
        modified = true;
    }

    // 3. Inject star calculation before window.saveScore
    if (content.includes('window.saveScore(') && !content.includes('let stars = 3;')) {
        content = content.replace(/window\.saveScore\(([^)]+)\)/g, (match, argsStr) => {
            if (argsStr.includes('stars')) return match;
            
            let finalArgs = argsStr.trim();
            if (!finalArgs.endsWith('"PASS"') && !finalArgs.endsWith("'PASS'") && !finalArgs.endsWith('`PASS`')) {
                finalArgs += ', "PASS"';
            }
            finalArgs += ', stars';
            
            return `
          let stars = 3;
          if (typeof totalHintsUsed !== 'undefined') {
              if (totalHintsUsed > 0 && totalHintsUsed <= 3) stars = 2;
              if (totalHintsUsed > 3) stars = 1;
          }
          let finalScoreSpan = document.getElementById('final-score');
          if (finalScoreSpan && !finalScoreSpan.innerHTML.includes('⭐ 提示')) {
              finalScoreSpan.innerHTML += \`<br>⭐ 提示 \${typeof totalHintsUsed !== 'undefined' ? totalHintsUsed : 0} 次，獲得星數：\${stars} 顆\`;
          }
          window.saveScore(${finalArgs})`;
        });
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', file);
    }
});
