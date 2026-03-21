const fs = require('fs');
const fn = 'c:/Users/hitea/Antigravity/Software Design Pratice/pages/看中文寫程式.html';
const content = fs.readFileSync(fn, 'utf-8');
const scriptMatches = content.match(/<script>([\s\S]*?)<\/script>/);
try {
    const vm = require('vm');
    new vm.Script(scriptMatches[1]);
    console.log('No syntax errors.');
} catch (e) {
    console.log(e.stack);
}
