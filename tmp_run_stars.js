const fs = require('fs');
const fn = 'c:/Users/hitea/Antigravity/Software Design Pratice/pages/看中文寫程式.html';
let content = fs.readFileSync(fn, 'utf-8');

const tOldRegex = /document\.getElementById\('win-score-box'\)\.innerHTML = `[\s\S]*?`;/g;

const newScoreBox = `
  let stars = 3;
  if (mistakes > 0 && mistakes <= 2) stars = 2;
  if (mistakes > 2) stars = 1;
  const scorePct = Math.max(0, Math.round(100 - (mistakes * 4)));
  if (scorePct < 60) stars = 1;

  document.getElementById('win-score-box').innerHTML = \`
    挑戰用時：\${seconds} 秒<br>
    語法錯誤：\${mistakes} 次<br>
    專業開發力：\${scorePct}%
    <div class="star-display-container" style="margin-top: 20px; width: 100%; display: flex; flex-direction: column; align-items: center;">
        <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 5px; flex-wrap: nowrap;">
            \${Array(3).fill(0).map((_, i) => \\\`<span style="font-size: 2.5rem; filter: \${i < stars ? 'drop-shadow(0 0 12px rgba(251,191,36,0.8))' : 'grayscale(100%) opacity(20%)'}; transform: scale(\${i < stars ? 1.1 : 1}); transition: all 0.3s ease; line-height: 1;">⭐</span>\\\`).join('')}
        </div>
    </div>
  \`;`;

content = content.replace(tOldRegex, newScoreBox);

const UI_REGEX_CLOUD = /let stars = 3;[\s\S]*?finalScoreSpan\.innerHTML = originHtml.*? \+ `[\s\S]*?`;/g;
content = content.replace(UI_REGEX_CLOUD, '');

fs.writeFileSync(fn, content);
console.log('Done script execution');
