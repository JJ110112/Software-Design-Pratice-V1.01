const fs = require('fs');
const fn = 'c:/Users/hitea/Antigravity/Software Design Pratice/pages/看中文寫程式.html';
let content = fs.readFileSync(fn, 'utf-8');

content = content.replace("document.getElementById('mode-pill').textContent = labelText;", `        document.getElementById('mode-pill').textContent = labelText;
        
        let winMissionStr = qID === 'SETUP' ? 'Form1_Load' : qID;
        if(document.getElementById('win-mission-title')) document.getElementById('win-mission-title').textContent = \`\${winMissionStr} 完整的程式片段\`;`);

fs.writeFileSync(fn, content);
console.log('Done replacement.');
