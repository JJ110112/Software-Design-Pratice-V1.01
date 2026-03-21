import re

files_to_update = {
    'pages/記憶翻牌遊戲.html': {
        'search': '''        } else {
            nextBtn.style.display = 'none';
            nextBtn.onclick = null;
        }''',
        'replace': '''        } else if (currentIndex === LEVEL_SEQUENCE.length - 1) {
            nextBtn.style.display = 'block';
            nextBtn.innerHTML = '挑戰下一主題 ⏭️';
            nextBtn.onclick = () => {
                window.location.href = '中英選擇題.html?q=SETUP&t=T01';
            };
        } else {
            nextBtn.style.display = 'none';
            nextBtn.onclick = null;
        }'''
    },
    'pages/中英選擇題.html': {
         'search': '''            } else if (currentIndex === LEVEL_SEQUENCE.length - 1) {
                // Last level completed, jump to the next phase
                nextBtn.style.display = 'block';
                nextBtn.innerHTML = '🎉 進入第二階段 (翻牌)';
                nextBtn.onclick = () => {
                    window.location.href = '記憶翻牌遊戲.html?q=SETUP&t=T01';
                };
            } else {''',
         'replace': '''            } else if (currentIndex === LEVEL_SEQUENCE.length - 1) {
                // Last level completed, jump to the next phase
                nextBtn.style.display = 'block';
                nextBtn.innerHTML = '🎉 進入第二階段 (朗讀練習)';
                nextBtn.onclick = () => {
                    window.location.href = '程式碼朗讀練習.html?q=SETUP&t=T01';
                };
            } else {'''
    },
    'pages/一行程式碼翻譯.html': {
         'search': '''        } else {
            nextBtn.style.display = 'none';
            nextBtn.onclick = null;
        }''',
         'replace': '''        } else if (currentIndex === LEVEL_SEQUENCE.length - 1) {
            nextBtn.style.display = 'block';
            nextBtn.innerHTML = '挑戰下一主題 ⏭️';
            nextBtn.onclick = () => {
                window.location.href = '錯誤找找看.html?q=SETUP&t=T01';
            };
        } else {
            nextBtn.style.display = 'none';
            nextBtn.onclick = null;
        }'''
    },
    'pages/錯誤找找看.html': {
         'search': '''        } else {
            nextBtn.style.display = 'none';
            nextBtn.onclick = null;
        }''',
         'replace': '''        } else if (currentIndex === LEVEL_SEQUENCE.length - 1) {
            nextBtn.style.display = 'block';
            nextBtn.innerHTML = '🎯 進入第三階段 (排列重組)';
            nextBtn.onclick = () => {
                window.location.href = '程式碼排列重組.html?q=SETUP&t=T01';
            };
        } else {
            nextBtn.style.display = 'none';
            nextBtn.onclick = null;
        }'''
    }
}

for filepath, substitutions in files_to_update.items():
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        content_norm = content.replace('\r\n', '\n')
        if substitutions['search'] in content_norm:
            res = content_norm.replace(substitutions['search'], substitutions['replace'])
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(res)
            print("Updated", filepath)
        else:
            print(f"Target string not found in {filepath}. Trying regex or partial match...")
            # For 記憶翻牌, check if we can find the specific block safely
            if filepath == 'pages/記憶翻牌遊戲.html':
                 s = """        } else {
            nextBtn.style.display = 'none';
            nextBtn.onclick = null;
        }"""
                 if s in content_norm:
                     res = content_norm.replace(s, substitutions['replace'])
                     with open(filepath, 'w', encoding='utf-8') as f:
                         f.write(res)
                     print(f"Updated {filepath} on second try")
                 else:
                     print("STILL NOT FOUND inside Memory Match.")

    except Exception as e:
        print(f"Error processing {filepath}: {e}")
