const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html') && f !== 'map.html');

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Use a robust regex to find our previously injected block or the first version of the block.
    // The previous block starts with `let stars = 3;` and ends with `window.saveScore(`.
    // We will match everything between `let stars = 3;` and `window.saveScore` and replace it.
    
    // Using RegExp to find the block we injected:
    const re = /let stars = 3;\s*if \(typeof totalHintsUsed !== 'undefined'\) \{\s*if \(totalHintsUsed > 0 && totalHintsUsed <= 3\) stars = 2;\s*if \(totalHintsUsed > 3\) stars = 1;\s*\}\s*let finalScoreSpan = document\.getElementById\('final-score'\);[\s\S]*?window\.saveScore\((.*?)\)/g;

    content = content.replace(re, (match, argsStr) => {
        return `let stars = 3;
          if (typeof totalHintsUsed !== 'undefined') {
              if (totalHintsUsed > 0 && totalHintsUsed <= 3) stars = 2;
              if (totalHintsUsed > 3) stars = 1;
          }
          let finalScoreSpan = document.getElementById('final-score');
          if (finalScoreSpan) {
              finalScoreSpan.style.width = "calc(100% + 40px)";
              finalScoreSpan.style.marginLeft = "-20px";
              finalScoreSpan.style.padding = "15px 10px";
              finalScoreSpan.style.boxSizing = "border-box";
              const hintsCount = typeof totalHintsUsed !== 'undefined' ? totalHintsUsed : 0;
              let originHtml = finalScoreSpan.innerHTML;
              
              // 移除舊版的星星 UI
              originHtml = originHtml.replace(/<div class="star-display-container"([\\s\\S]*?)<\\/div>\\s*<\\/div>/g, '');
              originHtml = originHtml.replace(/<br>⭐ 提示.*顆/g, '');
              
              // 修正折行問題，將各個統計項目包裝在 nowrap 中
              originHtml = originHtml.replace(/(⏱ 用時.*?秒)/g, '<span style="white-space:nowrap;">$1</span>');
              originHtml = originHtml.replace(/(❌ 錯誤.*?次)/g, '<span style="white-space:nowrap;">$1</span>');
              originHtml = originHtml.replace(/(🎯 正確率.*?%)/g, '<span style="white-space:nowrap;">$1</span>');
              originHtml = originHtml.replace(/　　/g, ' &nbsp;&nbsp; ');

              finalScoreSpan.innerHTML = originHtml + \`
                  <div class="star-display-container" style="margin-top: 20px; width: 100%; display: flex; flex-direction: column; align-items: center;">
                      <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 5px; flex-wrap: nowrap;">
                          \x24{Array(3).fill(0).map((_, i) => \`<span style="font-size: 3.5rem; filter: \x24{i < stars ? 'drop-shadow(0 0 12px rgba(251,191,36,0.8))' : 'grayscale(100%) opacity(20%)'}; transform: scale(\x24{i < stars ? 1.1 : 1}); transition: all 0.3s ease; line-height: 1;">⭐</span>\`).join('')}
                      </div>
                      <div style="font-size: 0.85rem; color: #94a3b8; text-align: center; margin-top: 10px;">
                          ( 使用提示：\x24{hintsCount} 次 )
                      </div>
                  </div>
              \`;
          }
          window.saveScore(${argsStr})`;
    });

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('UI Updated:', file);
    }
});
