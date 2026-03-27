const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * 從全部 scores 計算排行榜
 */
function computeRanking(results) {
  const filtered = results.filter(
    (r) => r.status === "PASS" && r.className !== "測試用"
  );

  const studentMap = {};
  filtered.forEach((r) => {
    const key = `${r.className}_${r.userName}`;
    if (!studentMap[key]) {
      studentMap[key] = {
        className: r.className,
        userName: r.userName,
        bestLevelInfo: {},
      };
    }
    const s = studentMap[key];
    const levelKey = `${r.qID}_${r.gameMode}`;
    const currentStars = r.stars !== undefined ? r.stars : 1;
    const currentTime = parseInt(r.timeSpent) || 0;

    if (!s.bestLevelInfo[levelKey]) {
      s.bestLevelInfo[levelKey] = { stars: currentStars, timeSpent: currentTime };
    } else {
      const best = s.bestLevelInfo[levelKey];
      if (
        currentStars > best.stars ||
        (currentStars === best.stars && currentTime < best.timeSpent)
      ) {
        s.bestLevelInfo[levelKey] = { stars: currentStars, timeSpent: currentTime };
      }
    }
  });

  const rankingList = Object.values(studentMap).map((s) => {
    let totalStars = 0,
      totalBestTime = 0,
      uniqueClears = 0;
    for (const k in s.bestLevelInfo) {
      totalStars += s.bestLevelInfo[k].stars;
      totalBestTime += s.bestLevelInfo[k].timeSpent;
      uniqueClears++;
    }
    return {
      className: s.className,
      userName: s.userName,
      stars: totalStars,
      uniqueClears,
      totalBestTime,
    };
  });

  rankingList.sort((a, b) => {
    if (b.stars !== a.stars) return b.stars - a.stars;
    if (a.totalBestTime !== b.totalBestTime) return a.totalBestTime - b.totalBestTime;
    return b.uniqueClears - a.uniqueClears;
  });

  return rankingList;
}

/**
 * 執行結算：讀取 scores → 計算 → 寫入 summaries/leaderboard
 */
async function rebuildLeaderboard() {
  const snapshot = await db
    .collection("scores")
    .where("status", "==", "PASS")
    .get();

  const results = [];
  snapshot.forEach((doc) => results.push(doc.data()));

  const ranking = computeRanking(results);

  await db.doc("summaries/leaderboard").set({
    ranking,
    updatedAt: new Date().toISOString(),
    totalRecords: results.length,
  });

  return { studentCount: ranking.length, totalRecords: results.length };
}

/**
 * 每日排程結算（台灣時間每天凌晨 2:00）
 * Cron: 每天 UTC 18:00 = 台灣時間 02:00
 */
exports.dailyLeaderboardRebuild = onSchedule(
  {
    schedule: "0 18 * * *",
    timeZone: "Asia/Taipei",
    region: "asia-east1",
  },
  async () => {
    const result = await rebuildLeaderboard();
    console.log(
      `✅ 每日排行榜結算完成：${result.studentCount} 位學生，${result.totalRecords} 筆紀錄`
    );
  }
);

/**
 * Callable 端點：手動觸發結算（供儀表板按鈕使用）
 * 速率限制：5 分鐘內不可重複呼叫
 */
exports.rebuildLeaderboard = onCall(
  { region: "asia-east1" },
  async (request) => {
    // Rate limit: 5 分鐘內不可重複結算
    const RATE_LIMIT_MS = 5 * 60 * 1000;
    const leaderboardDoc = await db.doc("summaries/leaderboard").get();

    if (leaderboardDoc.exists) {
      const data = leaderboardDoc.data();
      if (data.updatedAt) {
        const lastUpdated = new Date(data.updatedAt).getTime();
        const elapsed = Date.now() - lastUpdated;
        if (elapsed < RATE_LIMIT_MS) {
          const remainingSec = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
          throw new HttpsError(
            "resource-exhausted",
            `請稍候再試，距離上次結算不足 5 分鐘（剩餘 ${remainingSec} 秒）`
          );
        }
      }
    }

    try {
      const result = await rebuildLeaderboard();
      return {
        success: true,
        message: "排行榜結算完成",
        ...result,
      };
    } catch (e) {
      console.error("結算失敗:", e);
      throw new HttpsError("internal", e.message);
    }
  }
);

/**
 * 安全成績寫入：前端透過 onCall 呼叫，後端驗證後寫入 Firestore
 * - 必須有 Firebase Auth（匿名登入即可）
 * - 驗證欄位型態與範圍
 */
exports.saveScoreSecure = onCall(
  { region: "asia-east1" },
  async (request) => {
    // 1. 驗證身份（必須已登入，匿名也算）
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "必須登入才能儲存成績");
    }

    const data = request.data;

    // 2. 驗證必要欄位存在
    const required = ["className", "userName", "qID", "gameMode", "timeSpent", "status", "stars"];
    for (const field of required) {
      if (data[field] === undefined || data[field] === null) {
        throw new HttpsError("invalid-argument", `缺少必要欄位: ${field}`);
      }
    }

    // 3. 驗證型態與範圍
    const className = String(data.className).slice(0, 20);
    const userName = String(data.userName).slice(0, 20);
    const qID = String(data.qID).slice(0, 30);
    const gameMode = String(data.gameMode).slice(0, 30);
    const timeSpent = Number(data.timeSpent) || 0;
    const status = String(data.status);
    const stars = Number(data.stars) || 0;

    if (!["PASS", "FAIL"].includes(status)) {
      throw new HttpsError("invalid-argument", "status 必須是 PASS 或 FAIL");
    }
    if (stars < 0 || stars > 3) {
      throw new HttpsError("invalid-argument", "stars 必須介於 0-3");
    }
    if (timeSpent < 0 || timeSpent > 36000) {
      throw new HttpsError("invalid-argument", "timeSpent 超出合理範圍");
    }

    // 4. 寫入 Firestore（使用 admin SDK，不受 Security Rules 限制）
    const record = {
      className,
      userName,
      qID,
      gameMode,
      timeSpent,
      status,
      stars,
      timestamp: new Date().toISOString(),
      uid: request.auth.uid,
    };

    try {
      const docRef = await db.collection("scores").add(record);
      return { success: true, id: docRef.id };
    } catch (e) {
      console.error("寫入成績失敗:", e);
      throw new HttpsError("internal", "寫入失敗");
    }
  }
);
