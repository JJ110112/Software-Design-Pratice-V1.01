import glob
import re

wrapper = '<div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:20px; flex-wrap:wrap;">'

for path in glob.glob('pages/*.html'):
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    # Find the buttons pattern
    pattern = r'(<button[^>]+id="btn-again"[^>]*>.*?</button>)\s*(<button[^>]+id="btn-next-level"[^>]*>.*?</button>)'
    
    # We will just remove any existing wrappers that we might have inserted.
    # The wrappers look like `<div style="display:flex; ...">\n` before the buttons,
    # and `</div>` after the buttons.
    
    # Actually, simpler way: Let's extract the two buttons, completely strip any immediately surrounding wrappers,
    # and then put exactly one wrapper.
    
    def replace_func(m):
        btn1 = m.group(1)
        btn2 = m.group(2)
        return wrapper + '\n        ' + btn1 + '\n        ' + btn2 + '\n    </div>'
    
    # We first collapse the double/triple wrappers by matching the repeated flex divs
    # Let's match any number of `<div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:15px; flex-wrap:wrap;">`
    # or `margin-top:20px`
    
    c = re.sub(r'(<div style="display:flex[^>]*>\s*)+', r'<div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:20px; flex-wrap:wrap;">\n        ', c)
    
    # Wait, some pages might have legitimate other display:flex divs!
    # A safer approach: Find exactly the nested pattern we created.
    
    # Let's target the exact string:
    double_wrap1 = '<div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:15px; flex-wrap:wrap;">\n        <div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:15px; flex-wrap:wrap;">'
    double_wrap2 = '<div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:20px; flex-wrap:wrap;">\n        <div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:20px; flex-wrap:wrap;">'
    
    c = c.replace(double_wrap1, wrapper)
    c = c.replace(double_wrap2, wrapper)
    
    # Also clean up the extra </div>
    c = re.sub(r'</div>\n    </div>\n  </div>\n</div>', '</div>\n  </div>\n</div>', c)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
