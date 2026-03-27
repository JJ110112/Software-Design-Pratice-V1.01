import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, limit, doc, setDoc, getDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-functions.js";

// TODO: 請將以下 firebaseConfig 替換為您的 Firebase 專案金鑰
const firebaseConfig = {
    apiKey: "AIzaSyBrhpROyzAwz5FldPXGwFVyuJKFwIrNlqo",
    authDomain: "software-design-pratice.firebaseapp.com",
    projectId: "software-design-pratice",
    storageBucket: "software-design-pratice.firebasestorage.app",
    messagingSenderId: "911451146505",
    appId: "1:911451146505:web:a68442e94003714d016bd8",
    measurementId: "G-5MRVDNK2PQ"
};

let app, db, auth, functions, _saveScoreCallable;

// 檢查是否已填入有效金鑰
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    try {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        functions = getFunctions(app, "asia-east1");
        _saveScoreCallable = httpsCallable(functions, "saveScoreSecure");
        console.log("🔥 Firebase Firestore 連線成功");

        // 自動匿名登入（取得 UID，讓 Security Rules 能驗證身份）
        signInAnonymously(auth).then(() => {
            console.log("🔑 匿名登入成功，UID:", auth.currentUser?.uid);
        }).catch(e => {
            console.warn("⚠️ 匿名登入失敗（離線模式）:", e.code);
        });
    } catch (e) {
        console.error("Firebase 初始化失敗:", e);
    }
} else {
    console.warn("⚠️ 尚未設定 Firebase 金鑰，系統將以本機 LocalStorage 模擬儲存過關紀錄。");
}

// ── 快取工具函式 (改用 localStorage，F5 不會清掉) ──
// TTL 預設 30 分鐘 (1800000ms)
const CACHE_TTL = 7200000; // 2 小時

function cacheGet(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        if (Date.now() - obj.time > CACHE_TTL) {
            localStorage.removeItem(key);
            return null;
        }
        return obj.data;
    } catch (e) {
        return null;
    }
}

function cacheSet(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify({ time: Date.now(), data }));
    } catch (e) {
        // localStorage 滿了就跳過
    }
}

function cacheAppend(key, newRecord) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            // 快取不存在或已過期，建立新快取
            cacheSet(key, [newRecord]);
            return;
        }
        const obj = JSON.parse(raw);
        if (!Array.isArray(obj.data)) obj.data = [];
        obj.data.push(newRecord);
        obj.time = Date.now(); // 更新快取時間，避免過期
        localStorage.setItem(key, JSON.stringify(obj));
    } catch (e) {}
}

// ── 同步機制 ──

/**
 * 登入時：嘗試上傳離線成績（不清除快取）
 */
window.syncOnLogin = async function (userName) {
    if (!db || !userName) return;
    await window.syncOfflineScores(userName);
};

/**
 * 登出時：清除該使用者的快取
 */
window.syncOnLogout = function (userName) {
    if (userName) localStorage.removeItem(`fb_cache_${userName}`);
    localStorage.removeItem('fb_cache_overall_ranking');
    localStorage.removeItem('fb_cache_dashboard_teacher');
};

/**
 * 回到 map 頁面時：節流背景同步（每 10 分鐘最多一次）
 * 快取有效時直接用快取，不額外查 Firestore
 */
const SYNC_COOLDOWN = 600000; // 10 分鐘
window.syncOnMapLoad = async function (userName) {
    if (!db || !userName) return;
    // 先嘗試上傳離線成績
    await window.syncOfflineScores(userName);
    // 節流：2 分鐘內不重複查 Firestore
    const lastSyncKey = `last_sync_${userName}`;
    const lastSync = parseInt(localStorage.getItem(lastSyncKey) || '0');
    if (Date.now() - lastSync < 120000) return;
    localStorage.setItem(lastSyncKey, String(Date.now()));
    // 從 Firestore 撈取最新，直接覆蓋快取（確保一致性）
    try {
        const q = query(collection(db, "scores"), where("userName", "==", userName));
        const snapshot = await getDocs(q);
        const results = [];
        snapshot.forEach(d => {
            const data = d.data();
            data.id = d.id;
            data.gameMode = normalizeMode(data.gameMode);
            results.push(data);
        });
        const cacheKey = `fb_cache_${userName}`;
        cacheSet(cacheKey, results);
    } catch (e) {
        console.error("背景同步失敗:", e);
    }
};

/**
 * 離線成績重試：把 local_scores 中未上傳的補傳到 Firestore
 */
window.syncOfflineScores = async function (userName) {
    if (!_saveScoreCallable) return;
    let localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
    if (localScores.length === 0) return;
    const toUpload = userName ? localScores.filter(s => s.userName === userName) : localScores;
    const remaining = userName ? localScores.filter(s => s.userName !== userName) : [];
    let uploaded = 0;
    for (const record of toUpload) {
        try { await _saveScoreCallable(record); uploaded++; }
        catch (e) { remaining.push(record); }
    }
    localStorage.setItem('local_scores', JSON.stringify(remaining));
    if (uploaded > 0) console.log(`✅ 離線成績補傳（透過 Cloud Function）: ${uploaded} 筆`);
};

/**
 * 儲存使用者的過關成績到 Firestore
 * 策略：先寫入本地快取（樂觀更新），再嘗試寫 Firestore
 *        如果 Firestore 失敗，同時存入 local_scores 備份
 */
window.saveScore = async function (className, userName, qID, gameMode, timeSpent, status = "PASS", stars = 3) {
    const newRecord = {
        className: className || "未分班",
        userName: userName || "訪客",
        qID: qID || "Q1",
        gameMode: normalizeMode(gameMode || "未知模式"),
        timeSpent: Number(timeSpent) || 0,
        status: status || "PASS",
        stars: Number(stars) || 1,
        timestamp: new Date().toISOString()
    };

    const cacheKey = `fb_cache_${newRecord.userName}`;

    // 1. 透過 Cloud Function 寫入（後端驗證）
    if (!_saveScoreCallable) {
        console.warn("⚠️ saveScore: Cloud Function 未就緒，成績僅存本地", newRecord.qID, newRecord.gameMode);
        let localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
        localScores.push(newRecord);
        localStorage.setItem('local_scores', JSON.stringify(localScores));
        cacheAppend(cacheKey, newRecord);
        return { success: true, localOnly: true };
    }

    try {
        const result = await _saveScoreCallable(newRecord);
        // 2. 成功後才寫入快取（帶上 server 回傳的 id，避免 sync 時重複）
        newRecord.id = result.data.id;
        cacheAppend(cacheKey, newRecord);
        console.log("✅ Cloud Function 寫入成功:", newRecord.qID, newRecord.gameMode, "stars:", newRecord.stars);
        return { success: true, id: result.data.id };
    } catch (e) {
        console.error("❌ Cloud Function 寫入失敗:", e.code, e.message);
        // 失敗時存到 local_scores 備份，下次登入時重試
        let localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
        localScores.push(newRecord);
        localStorage.setItem('local_scores', JSON.stringify(localScores));
        cacheAppend(cacheKey, newRecord);
        return { success: false, error: e, backedUp: true };
    }
};

/**
 * 從 Firestore 取得各關卡排行榜
 */
window.getLeaderboard = async function (qID, gameMode) {
    if (!db) {
        return [
            { className: "資訊二", userName: "王小明", timeSpent: 35, timestamp: new Date().toISOString() },
            { className: "電子二", userName: "林小華", timeSpent: 42, timestamp: new Date().toISOString() }
        ];
    }

    try {
        const q = query(
            collection(db, "scores"),
            where("qID", "==", qID),
            where("gameMode", "==", gameMode),
            where("status", "==", "PASS"),
            orderBy("timeSpent", "asc"),
            limit(10)
        );
        const snapshot = await getDocs(q);
        const results = [];
        snapshot.forEach(doc => results.push(doc.data()));
        return results;
    } catch (e) {
        console.error("載入排行榜失敗:", e);
        return [];
    }
};

/**
 * 教師儀表板專用 API
 * ✅ 改動：limit 500 → 50，改用 localStorage 快取
 */
window.getAllScoresForDashboard = async function () {
    if (!db) {
        return JSON.parse(localStorage.getItem('local_scores') || '[]');
    }

    const sysCacheKey = 'fb_cache_dashboard_teacher';
    const DASH_TTL = 300000; // 5 分鐘
    try {
        const raw = localStorage.getItem(sysCacheKey);
        if (raw) { const obj = JSON.parse(raw); if (Date.now() - obj.time < DASH_TTL) return obj.data; }
    } catch(e) {}

    try {
        // 撈最近 500 筆供統計（快取 4 小時）
        const q = query(
            collection(db, "scores"),
            orderBy("timestamp", "desc"),
            limit(500)
        );
        const snapshot = await getDocs(q);
        const results = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            results.push(data);
        });

        const filtered = results.filter(r => r.className !== '測試用');
        cacheSet(sysCacheKey, filtered);
        return filtered;
    } catch (e) {
        console.error("載入儀表板資料失敗:", e.code, e.message, e);
        return [];
    }
};

/**
 * 資料庫模式名稱對應到 HTML 檔名
 */
const DB_TO_PAGE_MODE = {
    "英中單字配對": "連連看",
    "圖卡翻牌記憶": "記憶翻牌遊戲",
    "全程式撰寫": "獨立全程式撰寫"
};
function normalizeMode(mode) {
    return DB_TO_PAGE_MODE[mode] || mode;
}

/**
 * 取得特定使用者的所有紀錄
 * ✅ 改動：改用 localStorage 快取，TTL 30 分鐘
 */
window.getScoresForUser = async function (userName) {
    // 合併 local_scores 中尚未上傳的紀錄
    function mergeLocalScores(results, userName) {
        const localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
        const pending = localScores.filter(s => s.userName === userName);
        if (pending.length > 0) {
            const existingKeys = new Set(results.map(r => `${r.qID}_${r.gameMode}_${r.timestamp}`));
            pending.forEach(s => {
                s.gameMode = normalizeMode(s.gameMode);
                const key = `${s.qID}_${s.gameMode}_${s.timestamp}`;
                if (!existingKeys.has(key)) results.push(s);
            });
        }
        return results;
    }

    if (!db) {
        let localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
        return localScores.filter(s => s.userName === userName).map(s => {
            s.gameMode = normalizeMode(s.gameMode);
            return s;
        });
    }

    const cacheKey = `fb_cache_${userName}`;
    const cached = cacheGet(cacheKey);
    if (cached && cached.length > 0) return mergeLocalScores(cached, userName);

    try {
        const q = query(
            collection(db, "scores"),
            where("userName", "==", userName)
        );
        const snapshot = await getDocs(q);
        const results = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.gameMode = normalizeMode(data.gameMode);
            results.push(data);
        });

        cacheSet(cacheKey, results);
        return mergeLocalScores(results, userName);
    } catch (e) {
        console.error("載入個人紀錄失敗:", e);
        // 即使 Firestore 失敗，也返回快取 + local_scores
        const fallback = cacheGet(cacheKey) || [];
        return mergeLocalScores(fallback, userName);
    }
};

/**
 * 取得綜合排行榜
 * ✅ 改動：改用 localStorage 快取，TTL 30 分鐘
 */
/**
 * 讀取排行榜（從預先結算的 leaderboard_summary 單一 Document）
 * 每位學生只消耗 1 次讀取，不再撈全量 scores
 */
window.getOverallRanking = async function (classFilter = "ALL") {
    try {
        // 本地快取（10 分鐘 TTL，減少重複讀取同一份 summary）
        const sysCacheKey = 'fb_cache_overall_ranking_v2';
        const CACHE_TTL_RANK = 600000; // 10 分鐘
        try {
            const raw = localStorage.getItem(sysCacheKey);
            if (raw) {
                const obj = JSON.parse(raw);
                if (Date.now() - obj.time < CACHE_TTL_RANK) {
                    return _filterRanking(obj.data, classFilter);
                }
            }
        } catch(e) {}

        if (!db) {
            // 離線：用 local_scores 即時計算
            const localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
            const ranking = _computeRanking(localScores);
            return _filterRanking(ranking, classFilter);
        }

        // 讀取單一 summary document（1 次讀取）
        const summaryRef = doc(db, "summaries", "leaderboard");
        const summarySnap = await getDoc(summaryRef);

        if (summarySnap.exists()) {
            const data = summarySnap.data();
            const ranking = data.ranking || [];
            try { localStorage.setItem(sysCacheKey, JSON.stringify({ time: Date.now(), data: ranking })); } catch(e) {}
            return _filterRanking(ranking, classFilter);
        }

        // summary 不存在（尚未結算過）：回退到即時計算
        console.warn("⚠️ leaderboard_summary 尚未建立，使用即時計算");
        return await _fallbackLiveRanking(classFilter);
    } catch (e) {
        console.error("載入綜合排行榜失敗:", e);
        return [];
    }
};

/** 排行榜班級篩選 */
function _filterRanking(ranking, classFilter) {
    if (classFilter === "ALL") return ranking;
    return ranking.filter(r => r.className === classFilter);
}

/** 從原始 scores 計算排名（結算 & 回退共用） */
function _computeRanking(results) {
    const filtered = results.filter(r => r.status === "PASS" && r.className !== '測試用');
    const studentMap = {};
    filtered.forEach(r => {
        const key = `${r.className}_${r.userName}`;
        if (!studentMap[key]) {
            studentMap[key] = { className: r.className, userName: r.userName, bestLevelInfo: {} };
        }
        const s = studentMap[key];
        const levelKey = `${r.qID}_${r.gameMode}`;
        const currentStars = r.stars !== undefined ? r.stars : 1;
        const currentTime = parseInt(r.timeSpent) || 0;
        if (!s.bestLevelInfo[levelKey]) {
            s.bestLevelInfo[levelKey] = { stars: currentStars, timeSpent: currentTime };
        } else {
            const best = s.bestLevelInfo[levelKey];
            if (currentStars > best.stars || (currentStars === best.stars && currentTime < best.timeSpent)) {
                s.bestLevelInfo[levelKey] = { stars: currentStars, timeSpent: currentTime };
            }
        }
    });

    const rankingList = Object.values(studentMap).map(s => {
        let totalStars = 0, totalBestTime = 0, uniqueClears = 0;
        for (let k in s.bestLevelInfo) {
            totalStars += s.bestLevelInfo[k].stars;
            totalBestTime += s.bestLevelInfo[k].timeSpent;
            uniqueClears++;
        }
        return { className: s.className, userName: s.userName, stars: totalStars, uniqueClears, totalBestTime };
    });

    rankingList.sort((a, b) => {
        if (b.stars !== a.stars) return b.stars - a.stars;
        if (a.totalBestTime !== b.totalBestTime) return a.totalBestTime - b.totalBestTime;
        return b.uniqueClears - a.uniqueClears;
    });
    return rankingList;
}

/** 回退：summary 不存在時即時撈全量（僅首次，之後由結算產生 summary） */
async function _fallbackLiveRanking(classFilter) {
    const q = query(collection(db, "scores"), where("status", "==", "PASS"));
    const snapshot = await getDocs(q);
    const results = [];
    snapshot.forEach(d => { const data = d.data(); data.id = d.id; results.push(data); });
    const ranking = _computeRanking(results);
    try { localStorage.setItem('fb_cache_overall_ranking_v2', JSON.stringify({ time: Date.now(), data: ranking })); } catch(e) {}
    return _filterRanking(ranking, classFilter);
}

/**
 * 教師一鍵結算：讀取全量 scores → 計算排名 → 寫入 summaries/leaderboard
 * 全站只需這一次大量讀取，之後所有人都讀 1 個 document
 */
// ── Global dynamic styling for Stages ──
const MODE_TO_STAGE = {
    '連連看': 1, '記憶翻牌遊戲': 1, '中英選擇題': 1,
    '一行程式碼翻譯': 2, '錯誤找找看': 2, '程式碼朗讀練習': 2,
    '程式碼排列重組': 3, '程式與結果配對': 3, '逐行中文注解填空': 3,
    '打字-關鍵字': 4, '打字-單行': 4, '看中文寫程式': 4, '打字-完整': 4, '打字練習': 4,
    '程式填空': 5, '獨立全程式撰寫': 5, '錯誤程式除錯': 5, '模擬考': 5
};

/**
 * 取得特定使用者的星數統計
 */
window.getUserStarStats = async function (userName) {
    const scores = await window.getScoresForUser(userName);
    const passScores = scores.filter(s => s.status === 'PASS');

    const levelStars = {};
    passScores.forEach(r => {
        const key = `${r.qID}_${r.gameMode}`;
        const stars = r.stars !== undefined ? r.stars : 1;
        if (!levelStars[key] || stars > levelStars[key].stars) {
            levelStars[key] = { stars, mode: r.gameMode };
        }
    });

    let currentStars = 0;
    const stageStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const modeStars = {};

    for (let k in levelStars) {
        const entry = levelStars[k];
        currentStars += entry.stars;
        const stage = MODE_TO_STAGE[entry.mode] || 1;
        stageStars[stage] += entry.stars;
        modeStars[entry.mode] = (modeStars[entry.mode] || 0) + entry.stars;
    }

    // 每個模式最多 19 關 × 3 星 = 57 星，防止超額
    for (let m in modeStars) {
        if (modeStars[m] > 57) modeStars[m] = 57;
    }
    // 重新計算總星星（以 capped modeStars 為準）
    currentStars = Object.values(modeStars).reduce((a, b) => a + b, 0);
    for (let s = 1; s <= 5; s++) stageStars[s] = 0;
    for (let k in levelStars) {
        const entry = levelStars[k];
        const stage = MODE_TO_STAGE[entry.mode] || 1;
        stageStars[stage] += entry.stars;
    }
    // 每階段也設上限
    const STAGE_MAX = { 1: 171, 2: 171, 3: 171, 4: 228, 5: 171 };
    for (let s = 1; s <= 5; s++) {
        if (stageStars[s] > STAGE_MAX[s]) stageStars[s] = STAGE_MAX[s];
    }
    currentStars = Math.min(currentStars, 912);

    return {
        currentStars,
        totalPossibleStars: 912,
        stageStars,
        modeStars
    };
};

// ── 班級學生名冊管理 ──

/**
 * 從 Firestore 載入名冊（config/roster），並更新全域 CLASS_ROSTER
 * 本地快取 1 小時
 */
window.loadClassRoster = async function () {
    const CACHE_KEY = 'fb_cache_roster';
    const ROSTER_TTL = 3600000; // 1 小時
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
            const obj = JSON.parse(raw);
            if (Date.now() - obj.time < ROSTER_TTL) {
                if (typeof CLASS_ROSTER !== 'undefined') Object.assign(CLASS_ROSTER, obj.data);
                return obj.data;
            }
        }
    } catch(e) {}

    if (!db) return typeof CLASS_ROSTER !== 'undefined' ? CLASS_ROSTER : {};

    try {
        const snap = await getDoc(doc(db, "config", "roster"));
        if (snap.exists()) {
            const roster = snap.data().classes || {};
            try { localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data: roster })); } catch(e) {}
            if (typeof CLASS_ROSTER !== 'undefined') {
                // 清空再合併，確保刪除的班級也能反映
                Object.keys(CLASS_ROSTER).forEach(k => delete CLASS_ROSTER[k]);
                Object.assign(CLASS_ROSTER, roster);
            }
            return roster;
        }
    } catch(e) {
        console.error("載入名冊失敗:", e);
    }
    return typeof CLASS_ROSTER !== 'undefined' ? CLASS_ROSTER : {};
};

/**
 * 儲存整份名冊（透過 Cloud Function + 教師密碼驗證）
 */
window.saveClassRoster = async function (roster, teacherPassword) {
    if (!functions) throw new Error("Firebase 未連線");
    const callable = httpsCallable(functions, "saveRosterSecure");
    await callable({ classes: roster, teacherPassword });
    // 更新本地快取
    try { localStorage.setItem('fb_cache_roster', JSON.stringify({ time: Date.now(), data: roster })); } catch(e) {}
    // 同步全域變數
    if (typeof CLASS_ROSTER !== 'undefined') {
        Object.keys(CLASS_ROSTER).forEach(k => delete CLASS_ROSTER[k]);
        Object.assign(CLASS_ROSTER, roster);
    }
};

/**
 * 刪除學生成績（需教師密碼）
 * @param {string} teacherPassword
 * @param {"single"|"all"} mode
 * @param {string} [userName] - mode=single 時必填
 * @param {string} [className] - 選填
 */
window.deleteScores = async function (teacherPassword, mode, userName, className) {
    if (!functions) throw new Error("Firebase 未連線");
    const callable = httpsCallable(functions, "deleteScoresSecure");
    const result = await callable({ teacherPassword, mode, userName, className });
    return result.data;
};

/**
 * 回復測試教師資料（需教師密碼）
 * @param {string} teacherPassword
 * @param {string} [teacherName] - 預設 "測試老師"
 */
window.seedTestTeacher = async function (teacherPassword, teacherName) {
    if (!functions) throw new Error("Firebase 未連線");
    const callable = httpsCallable(functions, "seedTestTeacher");
    const result = await callable({ teacherPassword, teacherName });
    return result.data;
};

window.addEventListener('DOMContentLoaded', () => {
    const p = window.location.pathname;
    const isMap = p.includes('map.html');
    const isLevel = p.includes('/pages/') && !isMap;

    function applyStageBg(mode) {
        if (!mode) return 1;
        const stage = MODE_TO_STAGE[mode] || 1;
        document.body.className = document.body.className.replace(/stage-bg-\d/g, '').trim();
        document.body.classList.add('stage-bg-' + stage);
        return stage;
    }

    if (isMap) {
        const urlParams = new URLSearchParams(window.location.search);
        let currentMode = urlParams.get('mode');
        if (!currentMode) {
            const activeChip = document.querySelector('.mode-chip.active');
            if (activeChip) currentMode = activeChip.textContent.trim();
        }
        applyStageBg(currentMode || '連連看');

        document.querySelectorAll('.mode-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                applyStageBg(btn.textContent.trim());
            });
        });
    }

    if (isLevel) {
        let modeName = decodeURIComponent(p.split('/').pop().replace('.html', ''));
        const stage = applyStageBg(modeName);

        const urlParams = new URLSearchParams(window.location.search);
        const qID = urlParams.get('q') || 'Q1';

        let qTitle = '';
        if (typeof QUIZ_DATA !== 'undefined' && QUIZ_DATA[qID]) {
            qTitle = QUIZ_DATA[qID].title;
        } else {
            const h1 = document.querySelector('h1');
            if (h1) qTitle = h1.textContent.replace(modeName, '').trim();
        }

        const tID = urlParams.get('t') || '';
        const topBar = document.createElement('div');
        topBar.className = 'level-top-bar stage-bar-' + stage;
        let tStr = qID === 'SETUP' ? 'Form1_Load(表單載入)' : (qID + ' ' + qTitle + (tID ? '(' + tID + ')' : ''));
        topBar.innerHTML = '<span class="level-top-bar-title">' + tStr + ' ' + modeName + '</span>';

        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (user && typeof window.getUserStarStats === 'function') {
            window.getUserStarStats(user.name).then(stats => {
                const starBadge = document.createElement('div');
                starBadge.style.cssText = 'background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.85rem; color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); z-index: 8500; white-space: nowrap; margin-left: auto; margin-right: clamp(170px, 15vw, 210px); flex-shrink: 0;';
                const esc = window.escapeHTML || (s => s);
                const userInfoSpan = `<span style="color: #e2e8f0; font-weight: normal; margin-right: 10px;">${esc(user.className) || ''} <span style="font-weight: 800; color: #fff;">${esc(user.name)}</span></span>`;
                starBadge.innerHTML = `${userInfoSpan}⭐ ${stats.currentStars} / ${stats.totalPossibleStars}`;
                topBar.appendChild(starBadge);
            });
        }

        document.body.prepend(topBar);

        const toolbar = document.querySelector('.game-toolbar');
        if (toolbar) toolbar.style.top = '10px';

        const gameSec = document.querySelector('.game-section');
        if (gameSec) {
            gameSec.style.marginTop = '85px';
        } else {
            document.body.style.paddingTop = '95px';
        }
    }
});
