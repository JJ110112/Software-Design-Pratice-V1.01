import re

# Update '一行程式碼翻譯.html'
file_1 = 'pages/一行程式碼翻譯.html'
with open(file_1, 'r', encoding='utf-8') as f:
    content_1 = f.read()

content_1 = content_1.replace('\r\n', '\n')

# 1. Add call to setupNextLevelButton() inside endGame()
target_call = '''          window.saveScore(user.className, user.name, qID + '_' + tID, "一行程式碼翻譯", seconds, "PASS", stars)
            .then(res => console.log("成績上傳完成:", res));
      }
  }
}'''
replace_call = '''          window.saveScore(user.className, user.name, qID + '_' + tID, "一行程式碼翻譯", seconds, "PASS", stars)
            .then(res => console.log("成績上傳完成:", res));
      }
  }
  setupNextLevelButton();
}'''
if target_call in content_1:
    content_1 = content_1.replace(target_call, replace_call)

# 2. Add setupNextLevelButton() function
target_end = '''// ══════════ button bindings ══════════'''
replace_end = '''function setupNextLevelButton() {
    const LEVEL_SEQUENCE = [
      { q: 'SETUP', t: 'T01' }, { q: 'Q1', t: 'T01' }, { q: 'Q1', t: 'T02' }, { q: 'Q1', t: 'T03' },
      { q: 'Q2', t: 'T01' }, { q: 'Q2', t: 'T02' }, { q: 'Q2', t: 'T03' }, { q: 'Q3', t: 'T01' },
      { q: 'Q3', t: 'T02' }, { q: 'Q3', t: 'T03' }, { q: 'Q4', t: 'T01' }, { q: 'Q4', t: 'T02' },
      { q: 'Q4', t: 'T03' }, { q: 'Q5', t: 'T01' }, { q: 'Q5', t: 'T02' }, { q: 'Q5', t: 'T03' },
      { q: '1060306', t: 'T01' }, { q: '1060307', t: 'T01' }, { q: '1060308', t: 'T01' }
    ];
    let currentIndex = LEVEL_SEQUENCE.findIndex(l => l.q === qID && l.t === tID);
    const nextBtn = document.getElementById('btn-next-level');
    if (currentIndex >= 0 && currentIndex < LEVEL_SEQUENCE.length - 1) {
        const nextLv = LEVEL_SEQUENCE[currentIndex + 1];
        nextBtn.style.display = 'block';
        nextBtn.innerHTML = '⏭️ 下一關';
        nextBtn.onclick = () => {
            window.location.href = `一行程式碼翻譯.html?q=${nextLv.q}&t=${nextLv.t}`;
        };
    } else if (currentIndex === LEVEL_SEQUENCE.length - 1) {
        nextBtn.style.display = 'block';
        nextBtn.innerHTML = '挑戰下一主題 ⏭️';
        nextBtn.onclick = () => {
            window.location.href = '錯誤找找看.html?q=SETUP&t=T01';
        };
    } else {
        nextBtn.style.display = 'none';
        nextBtn.onclick = null;
    }
}

// ══════════ button bindings ══════════'''
if target_end in content_1 and 'function setupNextLevelButton()' not in content_1:
    content_1 = content_1.replace(target_end, replace_end)

with open(file_1, 'w', encoding='utf-8') as f:
    f.write(content_1)
print(f"Updated {file_1}")

# Update '錯誤找找看.html'
file_2 = 'pages/錯誤找找看.html'
with open(file_2, 'r', encoding='utf-8') as f:
    content_2 = f.read()

content_2 = content_2.replace('\r\n', '\n')

target_pointer = '''    } else {
        nextBtn.style.display = 'none';
        nextBtn.onclick = null;
    }'''
replace_pointer = '''    } else if (currentIndex === LEVEL_SEQUENCE.length - 1) {
        nextBtn.style.display = 'block';
        nextBtn.innerHTML = '🎯 進入第三階段 (排列重組)';
        nextBtn.onclick = () => {
            window.location.href = '程式碼排列重組.html?q=SETUP&t=T01';
        };
    } else {
        nextBtn.style.display = 'none';
        nextBtn.onclick = null;
    }'''
if target_pointer in content_2:
    content_2 = content_2.replace(target_pointer, replace_pointer)

with open(file_2, 'w', encoding='utf-8') as f:
    f.write(content_2)
print(f"Updated {file_2}")
