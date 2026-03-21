import re

with open('pages/程式碼朗讀練習.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('\r\n', '\n')

old_overlay_start = '<!-- complete overlay -->'
old_overlay_end = '<!-- complete overlay -->\n<div id=\"overlay\"'

# Replace overlay
target = '''<!-- complete overlay -->
<div id="overlay" style="display:none; position:fixed; inset:0; background:rgba(11,15,26,.88); backdrop-filter:blur(6px); z-index:9999; align-items:center; justify-content:center;">
    <div class="overlay-card" style="background:#1a2236; border:1px solid #2a3550; border-radius:14px; padding:44px 52px; text-align:center; max-width:420px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,.5); animation:popIn .4s cubic-bezier(.4,0,.2,1);">
        <div class="big-emoji" style="font-size:3.2rem; margin-bottom:12px;">🎉</div>
        <h2 style="font-size:1.7rem; font-weight:900; margin-bottom:8px;">全部完成！</h2>
        <p style="color:#64748b; margin-bottom:6px; font-size:.9rem;">你已朗讀完所有的程式碼！</p>
        <div class="score-display" id="final-score" style="font-family:'JetBrains Mono',monospace; color:#4ade80; font-size:1rem; margin:16px 0 24px; background:rgba(74,222,128,.08); border:1px solid rgba(74,222,128,.2); border-radius:6px; padding:12px;">已成功點擊並聆聽所有步驟</div>
        <div style="display:flex; justify-content:center; gap:10px; margin-top:20px;">
            <button class="btn btn-primary" id="btn-again" style="background:linear-gradient(135deg,#38bdf8,#818cf8); border:none; color:#000; padding:12px 24px; border-radius:8px; font-weight:700; cursor:pointer;" onclick="window.location.href='../pages/map.html?mode=程式碼朗讀練習&tab=map'">回關卡地圖</button>
        </div>
    </div>
</div>'''

new_overlay = '''<!-- overlay -->
<div id="overlay">
  <div class="overlay-card">
    <div class="big-emoji" id="result-emoji">🎉</div>
    <h2 id="result-title">全部完成！</h2>
    <p id="result-desc">你已完整聆聽這段程式碼的所有關鍵步驟了！</p>
    <div class="score-display" id="final-score"></div>
    <div style="display:flex; justify-content:center; gap:10px; margin-top:20px;">
        <button class="btn btn-primary" id="btn-again" style="white-space: nowrap;">再聆聽一次</button>
        <button class="btn btn-primary" id="btn-next-level" style="background: linear-gradient(90deg, #4ade80, #10b981); display:none; white-space: nowrap;">⏭️ 下一關</button>
    </div>
  </div>
</div>'''

content = content.replace(target, new_overlay)

target_js = '''                if (clickedLines.size === totalClickable) {
                    if (typeof window.saveScore === 'function') {
                        window.saveScore(qID, tID, 3);
                    }
                    setTimeout(() => {
                        document.getElementById('overlay').style.display = 'flex';
                    }, 1500);
                }'''

new_js = '''                if (clickedLines.size === totalClickable) {
                    setTimeout(() => {
                        showResult();
                    }, 1500);
                }'''

content = content.replace(target_js, new_js)

extra_functions = '''
document.getElementById('btn-again').addEventListener('click', () => {
    document.getElementById('overlay').classList.remove('show');
    clickedLines.clear();
});

function showResult() {
    let stars = 3;
    let finalScoreSpan = document.getElementById('final-score');
    if (finalScoreSpan) {
        finalScoreSpan.innerHTML = `
            <div class="star-display-container" style="margin-top: 10px; width: 100%; display: flex; flex-direction: column; align-items: center;">
                <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 5px; flex-wrap: nowrap;">
                    ${Array(3).fill(0).map((_, i) => `<span style="font-size: 2.5rem; filter: drop-shadow(0 0 12px rgba(251,191,36,0.8)); transform: scale(1.1); transition: all 0.3s ease; line-height: 1;">⭐</span>`).join('')}
                </div>
                <div style="font-size: 0.85rem; color: var(--green); text-align: center; margin-top: 10px; font-weight:700;">
                    已成功點擊並聆聽所有步驟
                </div>
            </div>
        `;
    }

    document.getElementById('overlay').classList.add('show');

    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user && typeof window.saveScore === 'function') {
            window.saveScore(user.className, user.name, qID + '_' + tID, "程式碼朗讀練習", 0, "PASS", stars)
              .then(res => console.log("朗讀練習成績上傳完成:", res));
        }
    }

    setupNextLevelButton();
}

function setupNextLevelButton() {
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
            window.location.href = `程式碼朗讀練習.html?q=${nextLv.q}&t=${nextLv.t}`;
        };
    } else if (currentIndex === LEVEL_SEQUENCE.length - 1) {
        nextBtn.style.display = 'block';
        nextBtn.innerHTML = '🎯 進入第二階段 (一行程式碼對譯)';
        nextBtn.onclick = () => {
            window.location.href = '一行程式碼翻譯.html?q=SETUP&t=T01';
        };
    } else {
        nextBtn.style.display = 'none';
        nextBtn.onclick = null;
    }
}
'''

content = content.replace('</script>\n<script src="../js/game-toolbar.js"></script>', extra_functions + '\n</script>\n<script src="../js/game-toolbar.js"></script>')

with open('pages/程式碼朗讀練習.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Python overlay replacement complete!")
