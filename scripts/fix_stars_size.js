const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html') && f !== 'map.html');

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // We will target the HTML string injected for the stars
    const searchString = /font-size:\s*3\.5rem;\s*filter:/g;
    content = content.replace(searchString, "font-size: 2.5rem; filter:");
    
    // Also fix the padding for the container to give more space
    const paddingSearch = /finalScoreSpan\.style\.padding\s*=\s*"15px 10px";/g;
    content = content.replace(paddingSearch, 'finalScoreSpan.style.padding = "20px 10px 25px 10px";');

    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed stars size in:', file);
    }
});
