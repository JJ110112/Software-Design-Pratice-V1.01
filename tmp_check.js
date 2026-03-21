const fs = require('fs');
const fn = 'c:/Users/hitea/Antigravity/Software Design Pratice/pages/看中文寫程式.html';
const content = fs.readFileSync(fn, 'utf-8');
const scriptMatches = content.match(/<script>([\s\S]*?)<\/script>/);
if (scriptMatches) {
    try {
        new Function(scriptMatches[1]);
        console.log('No syntax errors found in inline script.');
    } catch (e) {
        console.log('Syntax Error:', e.message);
    }
} else {
    console.log('No inline script found.');
}
