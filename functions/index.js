const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// 記憶體層級防連刷（不耗 DB 讀取，Cloud Function 實例回收時自動清除）
const _lastSaveByUid = {};

/**
 * 從全部 scores 計算排行榜
 */
function computeRanking(results) {
  const filtered = results.filter(
    (r) => r.status === "PASS" && r.className !== "測試用" && !(r.qID || "").startsWith("E2E_") && r.qID !== "TEST_E2E"
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
      bestLevelInfo: s.bestLevelInfo
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
  // 撈全部成績（一次讀取，供排行榜 + 儀表板共用）
  const allSnapshot = await db.collection("scores").get();
  const allResults = [];
  allSnapshot.forEach((doc) => allResults.push(doc.data()));

  const passResults = allResults.filter((r) => r.status === "PASS");
  const ranking = computeRanking(passResults);

  // 從全部紀錄（含 FAIL）統計每位學生的挑戰次數與最後活躍時間
  const activityMap = {};
  allResults.filter((r) => r.className !== "測試用" && !(r.qID || "").startsWith("E2E_") && r.qID !== "TEST_E2E").forEach((r) => {
    const key = `${r.className}_${r.userName}`;
    if (!activityMap[key]) {
      activityMap[key] = { totalAttempts: 0, lastActive: "" };
    }
    activityMap[key].totalAttempts++;
    if ((r.timestamp || "") > activityMap[key].lastActive) {
      activityMap[key].lastActive = r.timestamp || "";
    }
  });

  // 將挑戰次數與最後活躍時間合併到排行榜資料中
  ranking.forEach((r) => {
    const key = `${r.className}_${r.userName}`;
    const activity = activityMap[key];
    if (activity) {
      r.totalAttempts = activity.totalAttempts;
      r.lastActive = activity.lastActive;
    }
  });

  // 儀表板摘要：過濾測試帳號，只保留最近 500 筆
  const dashData = allResults
    .filter((r) => r.className !== "測試用" && !(r.qID || "").startsWith("E2E_") && r.qID !== "TEST_E2E")
    .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""))
    .slice(0, 500);

  // 批次寫入：先建立排行榜摘要 (濾除 bestLevelInfo 避免檔案過大)
  const leaderboardRanking = ranking.map(r => ({
    className: r.className,
    userName: r.userName,
    stars: r.stars,
    uniqueClears: r.uniqueClears,
    totalBestTime: r.totalBestTime,
    totalAttempts: r.totalAttempts || 0,
    lastActive: r.lastActive || ""
  }));

  // 批次寫入（每 batch 上限 500 操作，需分批）
  const allWrites = [];

  // 1. summaries
  allWrites.push({ ref: db.doc("summaries/leaderboard"), data: {
    ranking: leaderboardRanking,
    updatedAt: new Date().toISOString(),
    totalRecords: passResults.length,
  }});
  allWrites.push({ ref: db.doc("summaries/dashboard"), data: {
    records: dashData,
    updatedAt: new Date().toISOString(),
    totalRecords: dashData.length,
  }});

  // 2. 將所有學生的進度扁平化寫入 `user_progress` 集合
  ranking.forEach((r) => {
    const docId = `${r.className}__${r.userName}`;
    allWrites.push({ ref: db.doc(`user_progress/${docId}`), data: {
      className: r.className,
      userName: r.userName,
      stars: r.stars,
      uniqueClears: r.uniqueClears,
      totalBestTime: r.totalBestTime,
      totalAttempts: r.totalAttempts || 0,
      lastActive: r.lastActive || "",
      bestLevelInfo: r.bestLevelInfo || {}
    }, merge: true });
  });

  // 3. 對於只有失敗紀錄的學生，也要建立基本檔
  const rankingKeySet = new Set(ranking.map(r => `${r.className}_${r.userName}`));
  for (const key in activityMap) {
    if (!rankingKeySet.has(key)) {
      const activity = activityMap[key];
      const sample = allResults.find(r => `${r.className}_${r.userName}` === key);
      if (sample) {
        allWrites.push({ ref: db.doc(`user_progress/${sample.className}__${sample.userName}`), data: {
          className: sample.className,
          userName: sample.userName,
          stars: 0,
          uniqueClears: 0,
          totalBestTime: 0,
          totalAttempts: activity.totalAttempts,
          lastActive: activity.lastActive,
          bestLevelInfo: {}
        }, merge: true });
      }
    }
  }

  // 分批寫入（每批最多 500 操作）
  for (let i = 0; i < allWrites.length; i += 500) {
    const batch = db.batch();
    allWrites.slice(i, i + 500).forEach(w => {
      if (w.merge) {
        batch.set(w.ref, w.data, { merge: true });
      } else {
        batch.set(w.ref, w.data);
      }
    });
    await batch.commit();
  }

  return { studentCount: ranking.length, totalRecords: allResults.length, dashboardRecords: dashData.length };
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
 * Callable 端點：手動觸發結算（供儀表板刷新按鈕使用）
 * 已移除速率限制（資料庫扁平化後流量可控）
 */
exports.rebuildLeaderboard = onCall(
  { region: "asia-east1", cors: true },
  async (request) => {
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
  { region: "asia-east1", cors: true },
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

    // 4. 防範非人為的破關時間（低於 3 秒為異常）
    if (status === "PASS" && timeSpent < 3) {
      throw new HttpsError("invalid-argument", "破關時間異常");
    }

    // 5. UID 防連刷（記憶體層級，不耗 DB 讀取）
    const uid = request.auth.uid;
    const now = Date.now();
    if (_lastSaveByUid[uid] && now - _lastSaveByUid[uid] < 5000) {
      throw new HttpsError("resource-exhausted", "提交過於頻繁，請稍候再試");
    }
    _lastSaveByUid[uid] = now;

    // 6. 寫入 Firestore（使用 admin SDK，不受 Security Rules 限制）
    const record = {
      className,
      userName,
      qID,
      gameMode,
      timeSpent,
      status,
      stars,
      timestamp: data.timestamp || new Date().toISOString(),
      uid,
    };

    try {
      if (className === "測試用") {
        const docRef = await db.collection("scores").add(record);
        return { success: true, id: docRef.id };
      }

      let newDocId = null;
      await db.runTransaction(async (t) => {
        // 先取出該學生的專屬 user_progress 文件 (包含防刷保護)
        const userProgressRef = db.doc(`user_progress/${className}__${userName}`);
        const userProgressDoc = await t.get(userProgressRef);

        // 防連刷核心：跨冷啟動的持久化保護
        if (userProgressDoc.exists) {
          const prevData = userProgressDoc.data();
          if (prevData.lastActive) {
            const lastTime = new Date(prevData.lastActive).getTime();
            const nowTime = new Date(record.timestamp).getTime();
            if (nowTime - lastTime < 3000) {
              throw new HttpsError("resource-exhausted", "送出太頻繁 (低於 3 秒)，判定為惡意連刷");
            }
          }
        }

        const dashRef = db.doc("summaries/dashboard");
        const lbRef = db.doc("summaries/leaderboard");
        
        const [dashDoc, lbDoc] = await Promise.all([
          t.get(dashRef),
          t.get(lbRef)
        ]);

        // 1. 將成績寫入 scores 集合 (納入 Transaction 確保防刷時不會製造垃圾)
        const newScoreRef = db.collection("scores").doc();
        t.set(newScoreRef, record);
        newDocId = newScoreRef.id;

        // 2. 更新 Dashboard (保留最新 500 筆)
        if (dashDoc.exists) {
          const dashData = dashDoc.data();
          let records = dashData.records || [];
          records.unshift(record); // 插到最前面
          if (records.length > 500) records = records.slice(0, 500);
          t.update(dashRef, {
            records,
            updatedAt: new Date().toISOString(),
            totalRecords: (dashData.totalRecords || 0) + 1
          });
        }

        // 3. 更新 Leaderboard 與 UserProgress (極致效能，不再遍歷 scores)
        if (lbDoc.exists) {
          const lbData = lbDoc.data();
          let ranking = lbData.ranking || [];

          let userRankingInfo = {
            className,
            userName,
            stars: 0,
            uniqueClears: 0,
            totalBestTime: 0,
            totalAttempts: 0,
            lastActive: record.timestamp,
            bestLevelInfo: {}
          };

          if (userProgressDoc.exists) {
            userRankingInfo = { ...userRankingInfo, ...userProgressDoc.data() };
          }

          userRankingInfo.totalAttempts++;
          if ((record.timestamp || "") > userRankingInfo.lastActive) {
            userRankingInfo.lastActive = record.timestamp;
          }

          if (status === "PASS") {
            const levelKey = `${qID}_${gameMode}`;
            const currentStars = record.stars;
            const currentTime = record.timeSpent;
            const best = userRankingInfo.bestLevelInfo[levelKey];

            if (!best || currentStars > best.stars || (currentStars === best.stars && currentTime < best.timeSpent)) {
              userRankingInfo.bestLevelInfo[levelKey] = { stars: currentStars, timeSpent: currentTime };
            }

            // 重新結算總星數等
            let totalStars = 0, totalBestTime = 0, uniqueClears = 0;
            for (const k in userRankingInfo.bestLevelInfo) {
              totalStars += userRankingInfo.bestLevelInfo[k].stars;
              totalBestTime += userRankingInfo.bestLevelInfo[k].timeSpent;
              uniqueClears++;
            }
            userRankingInfo.stars = totalStars;
            userRankingInfo.uniqueClears = uniqueClears;
            userRankingInfo.totalBestTime = totalBestTime;
          }

          // 寫回 user_progress (極速 O(1) 更新)
          t.set(userProgressRef, userRankingInfo);

          // 找到該學生在排行榜中的位置並更新
          const studentIdx = ranking.findIndex(r => r.className === className && r.userName === userName);

          const strippedRankInfo = {
            className: userRankingInfo.className,
            userName: userRankingInfo.userName,
            stars: userRankingInfo.stars,
            uniqueClears: userRankingInfo.uniqueClears,
            totalBestTime: userRankingInfo.totalBestTime,
            totalAttempts: userRankingInfo.totalAttempts,
            lastActive: userRankingInfo.lastActive
          };

          if (studentIdx >= 0) {
            ranking[studentIdx] = strippedRankInfo;
          } else {
            ranking.push(strippedRankInfo);
          }

          // 重新排序整個排行榜
          ranking.sort((a, b) => {
            if (b.stars !== a.stars) return b.stars - a.stars;
            if (a.totalBestTime !== b.totalBestTime) return a.totalBestTime - b.totalBestTime;
            return b.uniqueClears - a.uniqueClears;
          });

          t.update(lbRef, {
            ranking,
            updatedAt: new Date().toISOString(),
            totalRecords: (lbData.totalRecords || 0) + 1
          });
        }
      });
      return { success: true, id: newDocId };
    } catch (e) {
      // 防連刷等 HttpsError 直接向前端拋出原始訊息
      if (e instanceof HttpsError) throw e;
      console.error("寫入成績失敗:", e);
      throw new HttpsError("internal", "寫入失敗");
    }
  }
);

/**
 * 教師名冊安全寫入：需要教師密碼
 */
const { defineSecret } = require("firebase-functions/params");
const teacherPasswordSecret = defineSecret("TEACHER_PASSWORD");

// 讀取教師密碼：優先用 Secret Manager，回退到環境變數
function getTeacherPassword() {
  try {
    const val = teacherPasswordSecret.value();
    if (val) return val;
  } catch (_) {}
  return process.env.TEACHER_PASSWORD || "";
}

exports.saveRosterSecure = onCall(
  { region: "asia-east1", cors: true, secrets: [teacherPasswordSecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "必須登入");
    }

    const { teacherPassword, classes } = request.data;

    if (teacherPassword !== getTeacherPassword()) {
      throw new HttpsError("permission-denied", "教師密碼錯誤");
    }

    if (!classes || typeof classes !== "object") {
      throw new HttpsError("invalid-argument", "名冊資料格式錯誤");
    }

    await db.doc("config/roster").set({
      classes,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  }
);

/**
 * 刪除學生成績：單一學生或全部
 * data.teacherPassword: 教師密碼
 * data.mode: "single" | "all"
 * data.userName: (mode=single 時) 要刪除的學生姓名
 * data.className: (mode=single 時，選填) 指定班級
 */
exports.deleteScoresSecure = onCall(
  { region: "asia-east1", cors: true, secrets: [teacherPasswordSecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "必須登入");
    }
    const { teacherPassword, mode, userName, className } = request.data;
    if (teacherPassword !== getTeacherPassword()) {
      throw new HttpsError("permission-denied", "教師密碼錯誤");
    }

    let q;
    if (mode === "all") {
      // 刪除全部學生成績（保留測試教師）
      q = db.collection("scores");
    } else if (mode === "single" && userName) {
      q = db.collection("scores").where("userName", "==", userName);
      if (className) {
        q = q.where("className", "==", className);
      }
    } else {
      throw new HttpsError("invalid-argument", "請指定 mode 和 userName");
    }

    const snapshot = await q.get();
    if (snapshot.empty) return { success: true, deleted: 0 };

    // 過濾：mode=all 時保留測試教師資料
    let docs = snapshot.docs;
    if (mode === "all") {
      docs = docs.filter((d) => d.data().className !== "測試用");
    }
    if (docs.length === 0) return { success: true, deleted: 0 };

    // 收集被刪除學生的 user_progress doc IDs
    const affectedStudents = new Set();
    docs.forEach((d) => {
      const data = d.data();
      if (data.className && data.userName) {
        affectedStudents.add(`${data.className}__${data.userName}`);
      }
    });

    // Batch delete scores (max 500 per batch)
    let deleted = 0;
    for (let i = 0; i < docs.length; i += 500) {
      const batch = db.batch();
      docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deleted += Math.min(500, docs.length - i);
    }

    // 刪除對應的 user_progress 文件
    if (affectedStudents.size > 0) {
      const progressDocs = [...affectedStudents];
      for (let i = 0; i < progressDocs.length; i += 500) {
        const batch = db.batch();
        progressDocs.slice(i, i + 500).forEach((id) => {
          batch.delete(db.doc(`user_progress/${id}`));
        });
        await batch.commit();
      }
    }

    // 更新所有的排行榜摘要以立刻反映刪除結果
    try {
        await rebuildLeaderboard();
    } catch(e) {
        console.error("重新結算失敗:", e);
    }

    return { success: true, deleted };
  }
);

/**
 * 回復測試教師資料（產生全星滿的成績）
 */
exports.seedTestTeacher = onCall(
  { region: "asia-east1", cors: true, secrets: [teacherPasswordSecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "必須登入");
    }
    const { teacherPassword, teacherName } = request.data;
    if (teacherPassword !== getTeacherPassword()) {
      throw new HttpsError("permission-denied", "教師密碼錯誤");
    }

    const name = teacherName || "測試老師";
    const gameModes = [
      "連連看", "記憶翻牌遊戲", "中英選擇題",
      "程式碼朗讀練習", "一行程式碼翻譯", "錯誤找找看",
      "程式碼排列重組", "程式與結果配對", "逐行中文注解填空",
      "打字-關鍵字", "打字-單行", "打字-完整", "看中文寫程式",
      "程式填空", "獨立全程式撰寫", "錯誤程式除錯"
    ];
    const qIDs = ["SETUP", "Q1", "Q2", "Q3", "Q4", "Q5",
      "1060306", "1060307", "1060308",
      "Q1_T01", "Q1_T02", "Q1_T03",
      "Q2_T01", "Q2_T02", "Q2_T03",
      "Q3_T01", "Q3_T02", "Q3_T03",
      "Q4_T01"
    ];

    const batch500 = [];
    let currentBatch = db.batch();
    let count = 0;

    for (const mode of gameModes) {
      for (const qID of qIDs) {
        const ref = db.collection("scores").doc();
        currentBatch.set(ref, {
          className: "測試用",
          userName: name,
          qID,
          gameMode: mode,
          timeSpent: Math.floor(Math.random() * 60) + 10,
          status: "PASS",
          stars: 3,
          timestamp: new Date().toISOString(),
          uid: request.auth.uid,
        });
        count++;
        if (count % 500 === 0) {
          batch500.push(currentBatch);
          currentBatch = db.batch();
        }
      }
    }
    batch500.push(currentBatch);

    for (const b of batch500) {
      await b.commit();
    }

    // 自動結算排行榜
    await rebuildLeaderboard();

    return { success: true, records: count, teacherName: name };
  }
);
