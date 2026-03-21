import glob
import re

for path in glob.glob('pages/*.html'):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    # Look for btn-again and btn-next-level next to each other
    pattern = r'(<button[^>]+id="btn-again"[^>]*>.*?</button>)\s*(<button[^>]+id="btn-next-level"[^>]*>.*?</button>)'
    
    match = re.search(pattern, c)
    if match:
        # Check if they are already wrapped in our flex container
        prev_chars = c[max(0, match.start()-100):match.start()]
        if 'display:flex' not in prev_chars and 'display: flex' not in prev_chars:
            replacement = r'<div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:20px; flex-wrap:wrap;">\n        \1\n        \2\n    </div>'
            c_new = re.sub(pattern, replacement, c)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(c_new)
            print(f'Wrapped buttons in {path}')
        else:
            print(f'Already wrapped in {path}')
