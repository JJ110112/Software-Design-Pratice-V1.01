import re

# Correct code block to insert
correct_code = """  rightOrder.forEach(idx => {
    const p = pairs[idx];
    const rEl = document.createElement('div');
    rEl.className = 'item';
    rEl.dataset.idx = idx;
    rEl.dataset.side = 'right';
    rEl.innerHTML = `
      <div class="item-result">${escHtml(p.result)}</div>
      <div class="dot-port"></div>`;
    rEl.addEventListener('click', () => onItemClick(rEl));
    colR.appendChild(rEl);
  });
}

function onItemClick(el) {
  if (el.classList.contains('matched') || el.classList.contains('preview-mode')) return;
  const side = el.dataset.side;

  if (side === 'left') {
    if (selectedLeft) selectedLeft.classList.remove('selected');
    if (selectedLeft === el) { selectedLeft = null; return; }
    selectedLeft = el;
    el.classList.add('selected');
  } else {
    if (selectedRight) selectedRight.classList.remove('selected');
    if (selectedRight === el) { selectedRight = null; return; }
    selectedRight = el;
    el.classList.add('selected');
  }

  if (selectedLeft && selectedRight) checkMatch();
}

function checkMatch() {
  const lIdx = parseInt(selectedLeft.dataset.idx);
  const rIdx = parseInt(selectedRight.dataset.idx);

  if (pairs[lIdx].result === pairs[rIdx].result) {
    selectedLeft.classList.remove('selected');
    selectedRight.classList.remove('selected');
    selectedLeft.classList.add('matched');
    selectedRight.classList.add('matched');

    drawLine(selectedLeft, selectedRight, 'matched');
    matchedCount++;
    document.getElementById('stat-matched').textContent = matchedCount;
    selectedLeft = null; selectedRight = null;

    if (matchedCount === pairs.length) {
      clearInterval(timerID);
      setTimeout(showWin, 600);
    }
  } else {
    const lRef = selectedLeft, rRef = selectedRight;
    lRef.classList.add('wrong-flash');
    rRef.classList.add('wrong-flash');
    const tmpLine = drawLine(lRef, rRef, 'wrong');
    wrongCount++;
    document.getElementById('stat-wrong').textContent = wrongCount;

    setTimeout(() => {
      lRef.classList.remove('selected','wrong-flash');
      rRef.classList.remove('selected','wrong-flash');
      if (tmpLine && tmpLine.parentNode) tmpLine.parentNode.removeChild(tmpLine);
    }, 700);
    selectedLeft = null; selectedRight = null;
  }
}"""

with open('pages/程式與結果配對.html', 'r', encoding='utf-8') as f:
    c = f.read()

# The file currently has a mangled section between:
# `  rightOrder.forEach(idx => {`
# and
# `    setTimeout(() => {` (inside checkMatch's else block)

# Let's find exactly where it starts being correct again. We know the mangling started right at:
# `  rightOrder.forEach(idx => {`
# And ends before:
# `    setTimeout(() => {\n      lRef.classList.remove('selected','wrong-flash');`
# Actually, the mangled file looks like:
# ```
#   rightOrder.forEach(idx => {
# 
#     setTimeout(() => {
#       lRef.classList.remove('selected','wrong-flash');
# ```
# So we can replace from `  rightOrder.forEach(idx => {` down to `    setTimeout(() => {` with the full `correct_code` MINUS the `setTimeout` part since it's already there? No, it's easier to replace everything down to `function showWin() {` because `function showWin() {` is intact!

# Find the start index
start_idx = c.find('  rightOrder.forEach(idx => {')
end_idx = c.find('function showWin() {')

if start_idx != -1 and end_idx != -1:
    new_c = c[:start_idx] + correct_code + '\n\n' + c[end_idx:]
    with open('pages/程式與結果配對.html', 'w', encoding='utf-8') as f:
        f.write(new_c)
    print("SUCCESS")
else:
    print("FAILED TO FIND INDICES")
