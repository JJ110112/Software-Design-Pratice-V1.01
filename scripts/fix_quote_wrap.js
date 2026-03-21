const fs = require('fs');

const files = [
    'index.html',
    'pages/map.html',
    'leaderboard.html'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Replace max-width constraints
        content = content.replace(/max-width:\s*500px;/g, 'max-width: 90%;');
        content = content.replace(/max-width:\s*600px;/g, 'max-width: 90%;');
        
        // Ensure white-space is normal but we give it enough room
        // Optionally add 'display: inline-block;' if it helps with centering and width
        content = content.replace(/id="motivational-quote" style="/g, 'id="motivational-quote" style="display: inline-block; ');
        
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
}
