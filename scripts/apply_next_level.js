const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html') && f !== 'map.html');

for (const file of files) {
    const fullPath = path.join(pagesDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if it's a game mode by looking for btn-again
    if (content.includes('id="btn-again"')) {
        // Check if nextlevel.js is already included
        if (!content.includes('nextlevel.js')) {
            // Inject just before </body>
            content = content.replace('</body>', '<script src="../js/nextlevel.js"></script>\n</body>');
            fs.writeFileSync(fullPath, content);
            console.log(`Injected nextlevel.js into ${file}`);
        } else {
            console.log(`Already injected in ${file}`);
        }
    }
}
