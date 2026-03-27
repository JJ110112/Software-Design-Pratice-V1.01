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
