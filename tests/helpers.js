/**
 * 模擬登入 — 必須與真實 app 的 storage 策略一致：
 *   - persist=false（預設）：只寫 sessionStorage（關瀏覽器自動登出）
 *   - persist=true：寫 localStorage + sw_quiz_persist flag
 *
 * ⚠️ 不要同時寫 localStorage 和 sessionStorage，否則會掩蓋
 *    只查 localStorage 的 bug（例如 getScoresForUser className=null）
 */
async function mockLogin(page, baseURL, { className, no, name, persist } = {}) {
  await page.goto(baseURL || '/');
  await page.evaluate(({ className, no, name, persist }) => {
    const userData = {
      className: className || '測試班',
      no: no || 1,
      name: name || '測試學生',
      loginTime: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };
    if (persist) {
      localStorage.setItem('sw_quiz_persist', 'true');
      localStorage.setItem('sw_quiz_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('sw_quiz_persist');
      localStorage.removeItem('sw_quiz_user');
      sessionStorage.setItem('sw_quiz_user', JSON.stringify(userData));
    }
  }, { className, no, name, persist });
}

/** 收集頁面錯誤 */
function collectErrors(page) {
  const errors = [];
  page.on('pageerror', err => errors.push(`[JS Error] ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[Console Error] ${msg.text()}`);
  });
  return errors;
}

/** 驗證無致命錯誤 */
function assertNoFatalErrors(errors, context) {
  const fatal = errors.filter(e =>
    !e.includes('ERR_BLOCKED_BY_CLIENT') &&
    !e.includes('favicon') &&
    !e.includes('net::ERR_') &&
    !e.includes('firestore.googleapis.com') &&
    !e.includes('Maximum call stack')
  );
  const stackOverflow = errors.filter(e => e.includes('Maximum call stack'));
  if (stackOverflow.length > 0) {
    throw new Error(`[${context}] stack overflow 遞迴錯誤`);
  }
  return fatal;
}

module.exports = { mockLogin, collectErrors, assertNoFatalErrors };
