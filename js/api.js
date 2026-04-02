import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, orderBy, getDocs, limit, doc, setDoc, getDoc, getDocFromServer, deleteField, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
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

        // 啟用離線持久化
        enableIndexedDbPersistence(db).catch((err) => {
            if (err.code == 'failed-precondition') {
                console.warn("⚠️ 多個分頁開啟，離線持久化只能在一個分頁運作");
            } else if (err.code == 'unimplemented') {
                console.warn("⚠️ 此瀏覽器不支援離線持久化");
            }
        });

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
        // 用 cacheGet 檢查 TTL，過期的快取自動丟棄
        let data = cacheGet(key);
        if (!data) {
            cacheSet(key, [newRecord]);
        } else {
            data.push(newRecord);
            cacheSet(key, data);
        }
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
 * ⚠️ 排行榜快取 fb_cache_overall_ranking_v2 不可清除（全站共用，費時重建）
 */
window.syncOnLogout = function (userName) {
    if (userName) localStorage.removeItem(`fb_cache_${userName}`);
    // 儀表板快取屬於教師工作階段，登出時清除
    localStorage.removeItem('fb_cache_dashboard_teacher');
    // ⚠️ 不清除 fb_cache_overall_ranking_v2（排行榜快取不可清除）
};

// 跨分頁資料更新偵測：dashboard 回復/刪除/結算後，其他分頁自動 forceRefresh
window.addEventListener('storage', (e) => {
    if (e.key === 'fb_data_updated' && e.newValue) {
        console.log("📡 偵測到其他分頁資料更新，清除本地快取");
        Object.keys(localStorage).filter(k => k.startsWith('fb_cache_')).forEach(k => localStorage.removeItem(k));
    }
});

/**
 * 回到 map 頁面時：節流背景同步（每 10 分鐘最多一次）
 * 快取有效時直接用快取，不額外查 Firestore
 * ✅ 改用 user_progress (O(1))，不再全撈 scores 集合
 */
window.syncOnMapLoad = async function (userName) {
    if (!db || !userName) return;
    // 先嘗試上傳離線成績
    await window.syncOfflineScores(userName);

    // 若已有未過期的快取，信任本地資料，不查 Firestore
    const cacheKey = `fb_cache_${userName}`;
    if (cacheGet(cacheKey)) return;

    // 快取不存在或已過期，讀 user_progress（O(1)，不讀 scores 集合）
    try {
        let currentClass = null;
        try {
            let raw = sessionStorage.getItem('sw_quiz_user');
            if (!raw) raw = localStorage.getItem('sw_quiz_user');
            const userObj = raw ? JSON.parse(raw) : null;
            currentClass = userObj ? userObj.className : null;
        } catch(_) {}

        if (!currentClass) return; // 無班級資訊，跳過

        const docSnap = await getDoc(doc(db, "user_progress", `${currentClass}__${userName}`));
        const results = [];
        if (docSnap.exists()) {
            const progress = docSnap.data();
            for (const key in progress.bestLevelInfo) {
                const sepIdx = key.lastIndexOf('_');
                const qID = key.substring(0, sepIdx);
                const gameMode = key.substring(sepIdx + 1);
                const info = progress.bestLevelInfo[key];
                results.push({ qID, gameMode: normalizeMode(gameMode), stars: info.stars, timeSpent: info.timeSpent, status: 'PASS' });
            }
        }
        cacheSet(cacheKey, results);
    } catch (e) {
        console.error("背景同步失敗:", e);
    }
};

/**
 * 離線成績重試：把 local_scores 中未上傳的補傳到 Firestore
 * Guard：需要 _saveScoreCallable（Cloud Function）且 Firebase 已連線
 */
window.syncOfflineScores = async function (userName) {
    if (!_saveScoreCallable || !db) return; // 離線時直接跳過
    let localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
    if (localScores.length === 0) return;
    const toUpload = userName ? localScores.filter(s => s.userName === userName) : localScores;
    let uploaded = 0;
    for (const record of toUpload) {
        try {
            const result = await _saveScoreCallable(record);
            uploaded++;
            // 補上 server id：更新快取中對應的暫時紀錄（用 timestamp 比對）
            if (result?.data?.id && record.userName) {
                try {
                    const cacheKey = `fb_cache_${record.userName}`;
                    const raw = localStorage.getItem(cacheKey);
                    if (raw) {
                        const obj = JSON.parse(raw);
                        if (Array.isArray(obj.data)) {
                            const entry = obj.data.find(r =>
                                r.timestamp === record.timestamp && r.qID === record.qID && !r.id
                            );
                            if (entry) entry.id = result.data.id;
                            localStorage.setItem(cacheKey, JSON.stringify(obj));
                        }
                    }
                } catch (_) {}
            }
            // 從包含最新異動的 local_scores 移除該筆 (避免覆蓋其他非同步寫入)
            try {
                let currentLocal = JSON.parse(localStorage.getItem('local_scores') || '[]');
                const idx = currentLocal.findIndex(r => 
                    r.userName === record.userName && 
                    r.qID === record.qID && 
                    r.timestamp === record.timestamp
                );
                if (idx !== -1) {
                    currentLocal.splice(idx, 1);
                    localStorage.setItem('local_scores', JSON.stringify(currentLocal));
                }
            } catch (_) {}
        }
        catch (e) {
            console.error("離線成績上傳失敗:", e);
        }
    }
    if (uploaded > 0) {
        console.log(`✅ 離線成績補傳（透過 Cloud Function）: ${uploaded} 筆`);
    }
};

/**
 * 儲存使用者的過關成績到 Firestore
 * 策略（樂觀更新）：
 *   1. 立即寫入本地快取（不含 id，確保用戶不需等待 CF 就能看到進度）
 *   2. 同時寫入 local_scores 備份（離線保底）
 *   3. 非同步呼叫 Cloud Function（後端驗證）
 *   4. CF 成功後：補上 server id 到快取，並從 local_scores 移除
 *   5. CF 失敗後：local_scores 備份保留，等下次登入重試
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

    // ── Step 1: 樂觀更新 ── 立即寫入本地快取（不等 CF）
    cacheAppend(cacheKey, newRecord);

    // ── Step 1b: 即時刷新 top bar 星星（樂觀更新後立即反映）
    if (typeof window.refreshStarBadge === 'function') window.refreshStarBadge();

    // ── Step 2: 寫入 local_scores 備份（CF 失敗時保底）
    try {
        let localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
        localScores.push({ ...newRecord });
        localStorage.setItem('local_scores', JSON.stringify(localScores));
    } catch (_) {}

    // ── Step 3: Cloud Function 未就緒（離線模式）直接返回 ──
    if (!_saveScoreCallable) {
        console.warn("⚠️ saveScore: Cloud Function 未就緒，成績已存本地快取", newRecord.qID, newRecord.gameMode);
        return { success: true, localOnly: true };
    }

    // ── Step 4: 非同步呼叫 Cloud Function ──
    try {
        const result = await _saveScoreCallable(newRecord);
        const serverId = result?.data?.id;

        // Step 4a: 從 local_scores 移除已成功上傳的那一筆（用 timestamp 比對）
        try {
            let localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
            const idx = localScores.findIndex(
                r => r.userName === newRecord.userName &&
                     r.qID === newRecord.qID &&
                     r.timestamp === newRecord.timestamp
            );
            if (idx !== -1) {
                localScores.splice(idx, 1);
                localStorage.setItem('local_scores', JSON.stringify(localScores));
            }
        } catch (_) {}

        // Step 4b: 補上 server id 到快取中的暫時紀錄
        if (serverId) {
            try {
                const raw = localStorage.getItem(cacheKey);
                if (raw) {
                    const obj = JSON.parse(raw);
                    if (Array.isArray(obj.data)) {
                        const entry = obj.data.find(r =>
                            r.timestamp === newRecord.timestamp &&
                            r.qID === newRecord.qID &&
                            !r.id
                        );
                        if (entry) entry.id = serverId;
                        localStorage.setItem(cacheKey, JSON.stringify(obj));
                    }
                }
            } catch (_) {}
        }

        console.log("✅ Cloud Function 寫入成功:", newRecord.qID, newRecord.gameMode, "stars:", newRecord.stars);
        return { success: true, id: serverId };
    } catch (e) {
        // Step 5: CF 失敗 → local_scores 已有備份，等下次登入 syncOfflineScores 重試
        console.error("❌ Cloud Function 寫入失敗（已備份到 local_scores）:", e.code, e.message);
        return { success: false, error: e, backedUp: true };
    }
};

/**
 * 從 Firestore 取得各關卡排行榜（5 分鐘快取）
 */
window.getLeaderboard = async function (qID, gameMode) {
    if (!db) {
        return [];
    }

    // 快取 5 分鐘
    const lbCacheKey = `fb_cache_lb_${qID}_${gameMode}`;
    const LB_TTL = 300000;
    try {
        const raw = localStorage.getItem(lbCacheKey);
        if (raw) { const obj = JSON.parse(raw); if (Date.now() - obj.time < LB_TTL) return obj.data; }
    } catch(e) {}

    try {
        const q = query(
            collection(db, "scores"),
            where("qID", "==", qID),
            where("gameMode", "==", gameMode),
            where("status", "==", "PASS"),
            limit(50)
        );
        const snapshot = await getDocs(q);
        const results = [];
        snapshot.forEach(d => results.push(d.data()));
        // 前端排序（避免複合索引需求）
        results.sort((a, b) => (a.timeSpent || 0) - (b.timeSpent || 0));
        const top10 = results.slice(0, 10);
        try { localStorage.setItem(lbCacheKey, JSON.stringify({ time: Date.now(), data: top10 })); } catch(e) {}
        return top10;
    } catch (e) {
        console.error("載入排行榜失敗:", e);
        return [];
    }
};

/**
 * 教師儀表板專用 API
 * 讀取預結算的 summaries/dashboard（1 次讀取），回退到限量查詢
 */
window.getAllScoresForDashboard = async function (forceRefresh = false) {
    if (!db) {
        return JSON.parse(localStorage.getItem('local_scores') || '[]');
    }

    const sysCacheKey = 'fb_cache_dashboard_teacher';
    const DASH_TTL = 300000; // 5 分鐘
    if (!forceRefresh) {
        try {
            const raw = localStorage.getItem(sysCacheKey);
            if (raw) { const obj = JSON.parse(raw); if (Date.now() - obj.time < DASH_TTL) return obj.data; }
        } catch(e) {}
    }

    try {
        if (forceRefresh) {
            // 教師刷新：直接查詢 scores（source of truth），確保最新
            console.log("🔄 教師刷新：即時查詢 Firestore scores...");
            const q = query(collection(db, "scores"), limit(500));
            const snapshot = await getDocs(q);
            const results = [];
            snapshot.forEach(d => { const data = d.data(); data.id = d.id; results.push(data); });
            const filtered = results.filter(r => r.className !== '測試用' && !r.className.startsWith('測試'));
            filtered.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
            cacheSet(sysCacheKey, filtered);
            console.log("儀表板即時載入完成:", filtered.length, "筆");
            return filtered;
        }

        // [Plan B] 優先：dashboard_records 集合（每筆獨立文件，orderBy createdAt）
        try {
            const dashSnap = await getDocs(
                query(collection(db, "dashboard_records"), orderBy("createdAt", "desc"), limit(500))
            );
            if (!dashSnap.empty) {
                const results = [];
                dashSnap.forEach(d => {
                    const data = d.data();
                    data.id = d.id;
                    delete data.createdAt; // 移除 Timestamp 物件，避免 JSON.stringify 失敗
                    results.push(data);
                });
                const filtered = results.filter(r => !r.className.startsWith('測試'));
                cacheSet(sysCacheKey, filtered);
                console.log("儀表板載入完成（dashboard_records）:", filtered.length, "筆");
                return filtered;
            }
        } catch(e) {
            console.warn("⚠️ dashboard_records 讀取失敗，回退 summaries/dashboard:", e.message);
        }

        // Fallback：summaries/dashboard（舊格式，rebuildLeaderboard 前或降級用）
        const summarySnap = await getDoc(doc(db, "summaries", "dashboard"));
        if (summarySnap.exists()) {
            const data = (summarySnap.data().records || []).filter(r => !r.className.startsWith('測試'));
            cacheSet(sysCacheKey, data);
            console.log("儀表板載入完成（summaries/dashboard fallback）:", data.length, "筆");
            return data;
        }

        // 最終回退：限量讀取 scores（避免全表掃描）
        console.warn("⚠️ summaries/dashboard 不存在，回退到限量查詢");
        const q = query(collection(db, "scores"), limit(200));
        const snapshot = await getDocs(q);
        const results = [];
        snapshot.forEach(d => { const data = d.data(); data.id = d.id; results.push(data); });
        const filtered = results.filter(r => r.className !== '測試用');
        filtered.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        cacheSet(sysCacheKey, filtered);
        console.log("儀表板載入完成（最終回退）:", filtered.length, "筆");
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
window.getScoresForUser = async function (userName, forceRefresh = false) {
    // 取得當前班級，用組出文檔 ID
    let currentClass = document.getElementById('login-class')?.value;
    if (!currentClass) {
        try {
            // 須同時檢查 sessionStorage（非永久登入）與 localStorage（永久登入）
            let raw = sessionStorage.getItem('sw_quiz_user');
            if (!raw) raw = localStorage.getItem('sw_quiz_user');
            const userObj = raw ? JSON.parse(raw) : null;
            currentClass = userObj ? userObj.className : null;
        } catch(e) {}
    }
    const className = currentClass;

    // 合併 local_scores 中尚未上傳的紀錄
    function mergeLocalScores(results, userName) {
        const localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
        const pending = localScores.filter(s => s.userName === userName);
        if (pending.length > 0) {
            const existingKeys = new Set(results.map(r => `${r.qID}_${r.gameMode}`));
            pending.forEach(s => {
                s.gameMode = normalizeMode(s.gameMode);
                const key = `${s.qID}_${s.gameMode}`;
                if (!existingKeys.has(key) || (existingKeys.has(key) && s.stars > (results.find(r=>r.qID===s.qID && r.gameMode===s.gameMode)?.stars || 0))) {
                    results = results.filter(r => !(r.qID === s.qID && r.gameMode === s.gameMode));
                    results.push(s);
                }
            });
        }
        return results;
    }

    if (!db || !className) {
        let localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
        return localScores.filter(s => s.userName === userName).map(s => {
            s.gameMode = normalizeMode(s.gameMode);
            return s;
        });
    }

    const cacheKey = `fb_cache_${userName}`;

    // forceRefresh：清除本地快取，強制從 server 讀取（用於 seedTestTeacher 後）
    if (forceRefresh) {
        localStorage.removeItem(cacheKey);
    }

    const cached = cacheGet(cacheKey);

    // 💡 背景同步：從 user_progress 更新快取，但保留本地尚未上傳的紀錄
    if (db && !cached) {
        // 只在沒有快取時才背景同步，避免覆蓋剛存的樂觀更新
        setTimeout(async () => {
            if (window.location.search.includes('dev=1')) return;
            try {
                const docSnap = await getDoc(doc(db, "user_progress", `${className}__${userName}`));
                let results = [];
                if (docSnap.exists()) {
                    const progress = docSnap.data();
                    for (const key in progress.bestLevelInfo) {
                        const sepIdx = key.lastIndexOf('_');
                        const qID = key.substring(0, sepIdx);
                        const gameMode = key.substring(sepIdx + 1);
                        const info = progress.bestLevelInfo[key];
                        results.push({ qID, gameMode: normalizeMode(gameMode), stars: info.stars, timeSpent: info.timeSpent, status: 'PASS' });
                    }
                }
                // merge local_scores 以保留尚未上傳的紀錄
                results = mergeLocalScores(results, userName);
                cacheSet(cacheKey, results);
            } catch(e) { console.warn("背景同步更新 Firebase 失敗:", e.message); }
        }, 50);
    }

    if (cached && cached.length > 0) return mergeLocalScores(cached, userName);

    try {
        // forceRefresh 時用 getDocFromServer 繞過 IndexedDB 離線快取
        const readFn = forceRefresh ? getDocFromServer : getDoc;
        const docSnap = await readFn(doc(db, "user_progress", `${className}__${userName}`));
        let results = [];
        if (docSnap.exists()) {
            const progress = docSnap.data();
            for (const key in progress.bestLevelInfo) {
                const sepIdx = key.lastIndexOf('_');
                const qID = key.substring(0, sepIdx);
                const gameMode = key.substring(sepIdx + 1);
                const info = progress.bestLevelInfo[key];
                results.push({ qID, gameMode: normalizeMode(gameMode), stars: info.stars, timeSpent: info.timeSpent, status: 'PASS' });
            }
        }
        cacheSet(cacheKey, results);
        return mergeLocalScores(results, userName);
    } catch (e) {
        console.warn("user_progress 讀取失敗，改從 scores 集合撈取:", e.message);
        // 防禦性回退：user_progress 無權限或異常時，改讀 scores 集合（有 read 權限）
        try {
            const q = query(collection(db, "scores"), where("userName", "==", userName), where("status", "==", "PASS"));
            const snapshot = await getDocs(q);
            let results = [];
            snapshot.forEach(d => {
                const data = d.data();
                data.id = d.id;
                data.gameMode = normalizeMode(data.gameMode);
                results.push(data);
            });
            cacheSet(cacheKey, results);
            return mergeLocalScores(results, userName);
        } catch (e2) {
            console.error("scores 集合也讀取失敗:", e2.message);
            return mergeLocalScores(cached || [], userName);
        }
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
window.getOverallRanking = async function (classFilter = "ALL", forceRefresh = false) {
    try {
        // 本地快取（10 分鐘 TTL，減少重複讀取同一份 summary）
        const sysCacheKey = 'fb_cache_overall_ranking_v2';
        const CACHE_TTL_RANK = 600000; // 10 分鐘
        if (!forceRefresh) {
            try {
                const raw = localStorage.getItem(sysCacheKey);
                if (raw) {
                    const obj = JSON.parse(raw);
                    if (Date.now() - obj.time < CACHE_TTL_RANK) {
                        return _filterRanking(obj.data, classFilter);
                    }
                }
            } catch(e) {}
        }

        if (!db) {
            // 離線：用 local_scores 即時計算
            const localScores = JSON.parse(localStorage.getItem('local_scores') || '[]');
            const ranking = _computeRanking(localScores);
            return _filterRanking(ranking, classFilter);
        }

        // [Plan A] 優先：leaderboard_entries 集合（每學生獨立文件，無寫入競爭）
        try {
            const entriesSnap = await getDocs(
                query(collection(db, "leaderboard_entries"), orderBy("stars", "desc"), limit(300))
            );
            if (!entriesSnap.empty) {
                const ranking = [];
                entriesSnap.forEach(d => ranking.push(d.data()));
                try { localStorage.setItem(sysCacheKey, JSON.stringify({ time: Date.now(), data: ranking })); } catch(e) {}
                return _filterRanking(ranking, classFilter);
            }
        } catch(e) {
            console.warn("⚠️ leaderboard_entries 讀取失敗，回退 summaries/leaderboard:", e.message);
        }

        // Fallback：summaries/leaderboard（舊格式，rebuildLeaderboard 前或降級用）
        const summaryRef = doc(db, "summaries", "leaderboard");
        const summarySnap = await getDoc(summaryRef);

        if (summarySnap.exists()) {
            const data = summarySnap.data();
            const ranking = data.ranking || [];
            try { localStorage.setItem(sysCacheKey, JSON.stringify({ time: Date.now(), data: ranking })); } catch(e) {}
            return _filterRanking(ranking, classFilter);
        }

        // summary 也不存在（尚未結算過）：回退到即時計算
        console.warn("⚠️ leaderboard_summary 尚未建立，使用即時計算");
        return await _fallbackLiveRanking(classFilter);
    } catch (e) {
        console.error("載入綜合排行榜失敗:", e);
        return [];
    }
};

/** 排行榜班級篩選（永遠排除測試班級） */
function _filterRanking(ranking, classFilter) {
    const filtered = ranking.filter(r => !r.className.startsWith('測試'));
    if (classFilter === "ALL") return filtered;
    return filtered.filter(r => r.className === classFilter);
}

/** 從原始 scores 計算排名（結算 & 回退共用） */
function _computeRanking(results) {
    const filtered = results.filter(r => r.status === "PASS" && !r.className.startsWith('測試'));
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

/** 回退：summary 不存在時限量撈取（避免全表掃描） */
async function _fallbackLiveRanking(classFilter) {
    const q = query(collection(db, "scores"), where("status", "==", "PASS"), limit(500));
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

        // 標題（次要）：彈性填滿，超出時跑馬燈
        const titleSpan = document.createElement('span');
        titleSpan.className = 'level-top-bar-title';
        const titleText = qID === 'SETUP' ? 'Form1_Load(表單載入)' : (qID + ' ' + qTitle + (tID ? '(' + tID + ')' : ''));
        titleSpan.textContent = titleText + ' ' + modeName;
        topBar.appendChild(titleSpan);

        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;

        // 星星徽章（最重要）：永遠在 top bar 右側，flex-shrink:0 不被壓縮
        let starBadge = null;
        if (user && typeof window.getUserStarStats === 'function') {
            starBadge = document.createElement('div');
            starBadge.id = 'top-bar-star-badge';
            topBar.appendChild(starBadge);

            function renderBadge(stats) {
                starBadge.textContent = `⭐${stats.currentStars}/${stats.totalPossibleStars}`;
            }
            window.getUserStarStats(user.name).then(renderBadge);

            window.refreshStarBadge = function () {
                if (typeof window.getUserStarStats === 'function' && user) {
                    window.getUserStarStats(user.name).then(renderBadge);
                }
            };
        }

        document.body.prepend(topBar);

        // 跑馬燈：標題超出可用寬度時啟動
        requestAnimationFrame(() => {
            if (titleSpan.scrollWidth > titleSpan.clientWidth + 2) {
                const txt = titleSpan.textContent;
                // 複製一份文字，讓動畫無縫循環
                titleSpan.innerHTML =
                    `<span class="marquee-inner">${txt}&nbsp;&nbsp;&nbsp;&nbsp;${txt}</span>`;
                // 速度：以 scrollWidth 為基準，約 80px/s
                const dur = Math.max(6, Math.round(titleSpan.scrollWidth / 80));
                titleSpan.style.setProperty('--marquee-dur', dur + 's');
                titleSpan.classList.add('marquee-active');
            }
        });

        // 工具列位置由 CSS 控制，不用 inline style 覆蓋
    }
});
