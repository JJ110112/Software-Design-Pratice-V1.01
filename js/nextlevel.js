// js/nextlevel.js
// A generic script included to automatically wire up "Next Level" buttons in all game modes
document.addEventListener('DOMContentLoaded', () => {
    let nextBtn = document.getElementById('btn-next-level');
    const againBtn = document.getElementById('btn-again');
    const overlay = document.getElementById('overlay') || document.getElementById('win-overlay');
    
    // 1. Ensure btn-next-level exists in the overlay
    if (againBtn && !nextBtn && overlay && overlay.contains(againBtn)) {
        nextBtn = document.createElement('button');
        nextBtn.id = 'btn-next-level';
        nextBtn.className = againBtn.className || 'btn btn-primary';
        nextBtn.style.cssText = againBtn.style.cssText;
        nextBtn.style.background = 'linear-gradient(90deg, #4ade80, #10b981)';
        nextBtn.style.marginLeft = '10px';
        nextBtn.style.color = '#fff';
        nextBtn.style.border = 'none';
        nextBtn.style.whiteSpace = 'nowrap';
        nextBtn.innerHTML = '⏭️ 下一關';
        
        // Ensure it doesn't conflict with any wrapping settings
        if(againBtn.style.margin === '0 auto') {
            againBtn.style.margin = '0';
        }
        
        againBtn.parentNode.insertBefore(nextBtn, againBtn.nextSibling);
    }
    
    // 2. Setup logic when overlay shows
    if (overlay) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && overlay.classList.contains('show')) {
                    wireNextButton();
                }
            });
        });
        observer.observe(overlay, { attributes: true });
        
        // If already showing on load (e.g. debugging)
        if (overlay.classList.contains('show')) {
            wireNextButton();
        }
    }
});

function wireNextButton() {
    const nextBtn = document.getElementById('btn-next-level');
    if (!nextBtn) return;
    
    const LEVEL_SEQUENCE = [
      { q: 'SETUP', t: 'T01' }, { q: 'Q1', t: 'T01' }, { q: 'Q1', t: 'T02' }, { q: 'Q1', t: 'T03' },
      { q: 'Q2', t: 'T01' }, { q: 'Q2', t: 'T02' }, { q: 'Q2', t: 'T03' }, { q: 'Q3', t: 'T01' },
      { q: 'Q3', t: 'T02' }, { q: 'Q3', t: 'T03' }, { q: 'Q4', t: 'T01' }, { q: 'Q4', t: 'T02' },
      { q: 'Q4', t: 'T03' }, { q: 'Q5', t: 'T01' }, { q: 'Q5', t: 'T02' }, { q: 'Q5', t: 'T03' },
      { q: '1060306', t: 'T01' }, { q: '1060307', t: 'T01' }, { q: '1060308', t: 'T01' }
    ];
    
    const urlParams = new URLSearchParams(window.location.search);
    const qID = urlParams.get('q') || 'Q1';
    const tID = urlParams.get('t') || 'T01';
    
    let currentIndex = LEVEL_SEQUENCE.findIndex(l => l.q === qID && l.t === tID);
    const currentFile = decodeURIComponent(window.location.pathname.split('/').pop());
    
    // Ensure display is inline-block so it shows
    nextBtn.style.display = 'inline-block';
    
    if (currentIndex >= 0 && currentIndex < LEVEL_SEQUENCE.length - 1) {
        const nextLv = LEVEL_SEQUENCE[currentIndex + 1];
        nextBtn.innerHTML = '⏭️ 下一關';
        nextBtn.onclick = () => {
            window.location.href = `${currentFile}?q=${nextLv.q}&t=${nextLv.t}`;
        };
    } else {
        // Last level completed, generic jump to map
        nextBtn.innerHTML = '🏆 返回闖關地圖';
        nextBtn.onclick = () => {
            window.location.href = 'map.html?tab=map';
        };
        if (currentFile.includes('中英選擇題')) {
            nextBtn.innerHTML = '🎉 進入第二階段 (朗讀練習)';
            nextBtn.onclick = () => window.location.href = '程式碼朗讀練習.html?q=SETUP&t=T01';
        } else if (currentFile.includes('錯誤找找看')) {
            nextBtn.innerHTML = '🎯 進入第三階段 (排列重組)';
            nextBtn.onclick = () => window.location.href = '程式碼排列重組.html?q=SETUP&t=T01';
        } else if (currentFile.includes('逐行中文注解填空')) {
            nextBtn.innerHTML = '🎯 進入第四階段 (打字練習)';
            nextBtn.onclick = () => window.location.href = '打字練習.html?q=SETUP&t=T01&sub=keyword';
        } else if (currentFile.includes('看中文寫程式')) {
            nextBtn.innerHTML = '⏭️ 下一練習 (打字-完整)';
            nextBtn.onclick = () => window.location.href = '打字練習.html?q=SETUP&t=T01&sub=full';
        } else if (currentFile.includes('程式填空')) {
            nextBtn.innerHTML = '⏭️ 下一練習 (獨立全程式撰寫)';
            nextBtn.onclick = () => window.location.href = '獨立全程式撰寫.html?q=SETUP&t=T01';
        } else if (currentFile.includes('獨立全程式撰寫')) {
            nextBtn.innerHTML = '⏭️ 下一練習 (錯誤程式除錯)';
            nextBtn.onclick = () => window.location.href = '錯誤程式除錯.html?q=SETUP&t=T01';
        }
    }
}
