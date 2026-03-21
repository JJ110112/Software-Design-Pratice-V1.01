const fs = require('fs');
const file = 'pages/記憶翻牌遊戲.html';

if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace const PREVIEW_SECS = 5; with dynamic assignment
    // We remove const and declare it as let
    content = content.replace(/const PREVIEW_SECS = 5;/, `let PREVIEW_SECS = 5;
if (qID === '1060306' || qID === '1060307' || qID === '1060308') {
    PREVIEW_SECS = 15;
} else if (qID !== 'SETUP') {
    PREVIEW_SECS = 10;
}`);

    // Replace 750 with a dynamic delay
    const targetSetTimeout = `    setTimeout(() => {
      a.classList.remove('wrong');
      b.classList.remove('wrong');
      hideCard(a);
      hideCard(b);
      locked = false;
    }, 750);`;
    
    const replacementSetTimeout = `    let delay = 1500;
    if (qID === '1060306' || qID === '1060307' || qID === '1060308') {
        delay = 2500;
    }
    setTimeout(() => {
      a.classList.remove('wrong');
      b.classList.remove('wrong');
      hideCard(a);
      hideCard(b);
      locked = false;
    }, delay);`;
    
    // If exact string match fails, fallback to regex
    if (content.includes(targetSetTimeout)) {
        content = content.replace(targetSetTimeout, replacementSetTimeout);
    } else {
        // More robust replace for the delay
        content = content.replace(/setTimeout\(\(\) => \{\s*a\.classList\.remove\('wrong'\);\s*b\.classList\.remove\('wrong'\);\s*hideCard\(a\);\s*hideCard\(b\);\s*locked = false;\s*\}, 750\);/, replacementSetTimeout);
    }

    fs.writeFileSync(file, content);
    console.log('Timers updated successfully in 記憶翻牌遊戲.html');
} else {
    console.log('File not found');
}
