const fs = require('fs');

const files = [
    'index.html',
    'pages/map.html',
    'leaderboard.html'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Match the entire style attribute and replace it
        // We will make it nice and responsive
        const newStyle = 'style="margin-top: 15px; font-size: 0.95rem; color: var(--gold); font-style: italic; width: fit-content; max-width: 90vw; margin-left: auto; margin-right: auto; text-align: center; line-height: 1.5; padding: 12px 20px; background: rgba(251,191,36,0.08); border-radius: 8px; border: 1px solid rgba(251,191,36,0.2); text-wrap: balance; word-break: keep-all;"';
        
        content = content.replace(/style="[^"]*rgba\(251,191,36,0\.08[^\"]*"/, newStyle);
        content = content.replace(/style="[^"]*rgba\(251,191,36,0\.1[^\"]*"/, newStyle); // for map and leaderboard where it might have been 0.1
        
        fs.writeFileSync(file, content);
        console.log(`Updated ${file}`);
    }
}
