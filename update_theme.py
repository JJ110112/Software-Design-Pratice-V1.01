import os
import re

files_to_check = ['index.html', 'leaderboard.html', 'pages/map.html']

for filepath in files_to_check:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Update inline styles to use --accent / #38bdf8 (rgb: 56,189,248) instead of --gold / #fbbf24 (rgb: 251,191,36)
        content = content.replace("color: var(--gold);", "color: var(--accent);")
        content = content.replace("background: rgba(251,191,36,0.08);", "background: rgba(56,189,248,0.08);")
        content = content.replace("border: 1px solid rgba(251,191,36,0.2);", "border: 1px solid rgba(56,189,248,0.3);")

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
