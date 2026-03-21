import re
import sys

# The exact content from step 701 with line prefixes like "1: <!DOCTYPE html>"
raw_data = r"""1: <!DOCTYPE html>
2: <html lang="zh-TW">
3: <head>
4: <meta charset="UTF-8">
5: <meta name="viewport" content="width=device-width, initial-scale=1.0">
6: <title>VB.NET 關鍵字記憶遊戲 ── Q1 迴文判斷</title>
7: <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
8: <style>
9:   :root {
10:     --bg:      #0d1117;
11:     --surface: #161b22;
12:     --border:  #30363d;
13:     --accent:  #58a6ff;
14:     --accent2: #f78166;
15:     --accent3: #56d364;
16:     --text:    #e6edf3;
17:     --muted:   #8b949e;
18:   }
19:   *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
20: 
21:   body {
22:     background: var(--bg); color: var(--text);
23:     font-family: 'Noto Sans TC', sans-serif;
24:     min-height: 100vh;
25:     display: flex; flex-direction: column; align-items: center;
26:     padding: 24px 16px 40px;
27:   }
28:   body::before {
29:     content: ''; position: fixed; inset: 0;
30:     background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.07) 2px,rgba(0,0,0,.07) 4px);
31:     pointer-events: none; z-index: 999;
32:   }
33: 
34:   /* header */
35:   header { text-align: center; margin-bottom: 24px; }
36:   .badge {
37:     display: inline-block; background: var(--accent2); color: #000;
38:     font-size: .72rem; font-weight: 900; letter-spacing: .12em;
39:     padding: 3px 10px; border-radius: 2px; margin-bottom: 8px; text-transform: uppercase;
40:   }
41:   h1 { font-size: clamp(1.4rem,4vw,2rem); font-weight: 900; line-height: 1.2; }
42:   h1 span { color: var(--accent); }
43:   .subtitle { color: var(--muted); font-size: .88rem; margin-top: 6px; }
44: 
45:   /* GAME HEADER */
46:   .game-header { width: 100%; max-width: 900px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; justify-content: center; }
47:   .back-btn { background: transparent; border: 1px solid var(--border); color: var(--muted); border-radius: 6px; padding: 6px 14px; font-size: .82rem; cursor: pointer; text-decoration: none; font-family: inherit; transition: all .2s; }
48:   .back-btn:hover { color: var(--text); border-color: var(--muted); }
49:   .mode-pill { font-size: .72rem; font-weight: 900; padding: 4px 12px; border-radius: 4px; text-transform: uppercase; letter-spacing: .08em; background: rgba(74, 222, 128, .15); color: var(--accent3, #56d364); border: 1px solid rgba(74, 222, 128, .3); }
50: 
51:   /* stats */
52:   .stats { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; justify-content: center; }
53:   .stat { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 8px 18px; text-align: center; }
54:   .stat-val { font-size: 1.3rem; font-weight: 900; color: var(--accent); font-family: 'Share Tech Mono', monospace; display: block; }
55:   .stat-lbl { font-size: .68rem; color: var(--muted); margin-top: 1px; display: block; }
56: 
57:   /* banner */
58:   #countdown-banner {
59:     background: rgba(251,191,36,.08); border: 1px solid rgba(251,191,36,.35);
60:     border-radius: 8px; padding: 10px 20px;
61:     font-size: .88rem; font-weight: 700; color: #fbbf24;
62:     margin-bottom: 20px; max-width: 900px; width: 100%; text-align: center;
63:   }
64:   #countdown-banner.hidden { display: none; }
65: 
66:   .instruction {
67:     background: rgba(88,166,255,.08); border: 1px solid rgba(88,166,255,.25);
68:     border-radius: 6px; padding: 10px 18px;
69:     font-size: .82rem; color: var(--accent);
70:     margin-bottom: 20px; max-width: 900px; width: 100%; text-align: center;
71:   }
72: 
73:   /* grid */
74:   #grid {
75:     display: grid; grid-template-columns: repeat(4, 1fr);
76:     gap: 12px; max-width: 900px; width: 100%; margin-bottom: 24px;
77:   }
78:   @media (max-width: 480px) { #grid { grid-template-columns: repeat(3, 1fr); gap: 8px; } }
79: 
80:   /* ── CARD (single face, no 3D transform) ── */
81:   .card {
82:     aspect-ratio: 1 / 0.65;
83:     border-radius: 8px;
84:     border: 2px solid var(--border);
85:     cursor: pointer;
86:     display: flex; flex-direction: column;
87:     align-items: center; justify-content: center;
88:     padding: 8px; text-align: center;
89:     user-select: none;
90:     -webkit-tap-highlight-color: transparent;
91:     transition: border-color .15s, background .15s, box-shadow .15s;
92:     position: relative; overflow: hidden;
93:   }
94: 
95:   /* ── BACK face (? mark) ── */
96:   .card.back {
97:     background: #1a2030;
98:     border-color: #374151;
99:   }
100:   .card.back .card-content { display: none; }
101:   .card.back::after {
102:     content: '?';
103:     font-size: 1.8rem; font-weight: 900;
104:     color: var(--muted); opacity: .45;
105:   }
106: 
107:   /* ── EN front ── */
108:   .card[data-type="en"]:not(.back) {
109:     background: #1a1f2e;
110:     border-color: #2a3550;
111:   }
112:   .card[data-type="en"]:not(.back) .card-word {
113:     font-family: 'Share Tech Mono', monospace;
114:     font-size: clamp(.7rem, 2.3vw, .92rem);
115:     font-weight: 700; color: var(--accent);
116:     word-break: normal; overflow-wrap: break-word; line-height: 1.35;
117:   }
118:   .card[data-type="en"]:not(.back) .card-tag {
119:     font-size: .58rem; color: var(--muted); margin-top: 5px;
120:     background: rgba(88,166,255,.1); padding: 1px 7px; border-radius: 99px;
121:   }
122: 
123:   /* ── ZH front ── */
124:   .card[data-type="zh"]:not(.back) {
125:     background: #1a1e2e;
126:     border-color: #2a3450;
127:   }
128:   .card[data-type="zh"]:not(.back) .card-word {
129:     font-size: clamp(.7rem, 2.3vw, .88rem);
130:     font-weight: 700; color: #e6c77a; line-height: 1.4;
131:   }
132:   .card[data-type="zh"]:not(.back) .card-tag {
133:     font-size: .58rem; color: var(--muted); margin-top: 5px;
134:     background: rgba(230,199,122,.1); padding: 1px 7px; border-radius: 99px;
135:   }
136: 
137:   /* ── selected ── */
138:   .card.selected {
139:     border-color: var(--accent) !important;
140:     box-shadow: 0 0 0 3px rgba(88,166,255,.22), 0 0 14px rgba(88,166,255,.28);
141:     transform: scale(1.05);
142:   }
143: 
144:   /* ── wrong ── */
145:   .card.wrong {
146:     border-color: #f87171 !important;
147:     background: rgba(248,113,113,.1) !important;
148:     animation: shake .35s ease;
149:   }
150:   @keyframes shake {
151:     0%,100%{ transform: translateX(0); }
152:     25%    { transform: translateX(-5px); }
153:     75%    { transform: translateX(5px); }
154:   }
155: 
156:   /* ── vanish ── */
157:   .card.vanish { animation: vanish .45s ease forwards; }
158:   @keyframes vanish {
159:     0%  { transform: scale(1);   opacity: 1; filter: brightness(1); }
160:     40% { transform: scale(1.1); opacity: 1; filter: brightness(2); }
161:     100%{ transform: scale(0);   opacity: 0; }
162:   }
163: 
164:   /* ── gone ── */
165:   .card.gone {
166:     visibility: hidden; pointer-events: none;
167:     border-color: transparent !important;
168:     background: transparent !important;
169:     box-shadow: none !important;
170:   }
171: 
172:   /* flip reveal */
173:   @keyframes flipIn {
174:     from { transform: scaleX(0.1); }
175:     to   { transform: scaleX(1); }
176:   }
177:   .card.flip-in { animation: flipIn .16s ease; }
178: 
179:   /* buttons */
180:   .btn-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
181:   button {
182:     font-family: 'Noto Sans TC', sans-serif; font-size: .9rem; font-weight: 700;
183:     padding: 10px 28px; border-radius: 6px; border: none; cursor: pointer; transition: all .2s;
184:   }
185:   #btn-restart { background: var(--accent); color: #000; }
186:   #btn-restart:hover { background: #79b8ff; transform: translateY(-2px); }
187: 
188:   /* overlay */
189:   #overlay {
190:     display: none; position: fixed; inset: 0;
191:     background: rgba(13,17,23,.92); backdrop-filter: blur(4px);
192:     z-index: 100; align-items: center; justify-content: center;
193:   }
194:   #overlay.show { display: flex; }
195:   .overlay-box {
196:     background: var(--surface); border: 1px solid var(--border);
197:     border-radius: 12px; padding: 40px 48px;
198:     text-align: center; max-width: 380px; width: 90%;
199:     animation: popIn .35s cubic-bezier(.4,0,.2,1);
200:   }
201:   @keyframes popIn {
202:     from{ transform: scale(.85); opacity: 0; }
203:     to  { transform: scale(1);   opacity: 1; }
204:   }
205:   .overlay-box .emoji { font-size: 3rem; margin-bottom: 12px; }
206:   .overlay-box h2 { font-size: 1.6rem; font-weight: 900; margin-bottom: 8px; }
207:   .overlay-box p  { color: var(--muted); font-size: .9rem; margin-bottom: 20px; }
208:   .overlay-box .score-line {
209:     font-family: 'Share Tech Mono', monospace; color: var(--accent3);
210:     font-size: 1rem; margin-bottom: 24px;
211:     background: rgba(86,211,100,.08); border: 1px solid rgba(86,211,100,.2);
212:     border-radius: 6px; padding: 10px;
213:   }
214: 
215:   /* legend */
216:   .legend { display: flex; gap: 20px; margin-top: 18px; flex-wrap: wrap; justify-content: center; }
217:   .leg { display: flex; align-items: center; gap: 6px; font-size: .78rem; color: var(--muted); }
218:   .leg-dot { width: 10px; height: 10px; border-radius: 2px; }
219: </style>
220: <link rel="stylesheet" href="../css/common.css">
221: </head>
222: <body>
223: 
224: <header>
225:   <div class="badge">軟體設計丙級 ✦ VB.NET</div>
226:   <h1>記憶翻牌遊戲<br><span id="header-title">Q1 迴文判斷</span></h1>
227:   <p class="subtitle">記住所有答案，找出每一行程式碼與對應中文意思的配對！</p>
228: </header>
229: 
230: <div class="game-header">
231:   <a href="#" class="back-btn" id="btn-back">← 返回</a>
232:   <div class="mode-pill lvl-easy" id="mode-pill">記憶翻牌遊戲</div>
233: </div>
234: 
235: <div class="stats">
236:   <div class="stat"><span class="stat-val" id="matched-count">0</span><span class="stat-lbl">已消除</span></div>
237:   <div class="stat"><span class="stat-val" id="total-count">0</span><span class="stat-lbl">總配對數</span></div>
238:   <div class="stat"><span class="stat-val" id="click-count">0</span><span class="stat-lbl">點擊次數</span></div>
239:   <div class="stat"><span class="stat-val" id="timer">0s</span><span class="stat-lbl">時間</span></div>
240: </div>
241: 
242: <div id="countdown-banner">👀 記住所有答案！<span id="countdown-num">5</span> 秒後開始遊戲…</div>
243: <div class="instruction" id="instruction" style="display:none;">💡 點選英文牌，再點選對應的中文牌，配對成功即消除！</div>
244: 
245: <div id="grid"></div>
246: 
247: <div class="btn-row">
248:   <button id="btn-restart">🔄 重新開始</button>
249: </div>
250: 
251: <div class="legend">
252:   <div class="leg"><div class="leg-dot" style="background:#58a6ff"></div>英文指令 / 語法</div>
253:   <div class="leg"><div class="leg-dot" style="background:#e6c77a"></div>中文說明</div>
254: </div>
255: 
256: <div id="overlay">
257:   <div class="overlay-box">
258:     <div class="emoji">🎉</div>
259:     <h2>全部配對完成！</h2>
260:     <p>你已經認識了 Q1 迴文判斷的所有關鍵字！</p>
261:     <div class="score-line" id="final-score"></div>
262:     <div style="display:flex; justify-content:center; gap:10px;">
263:         <button id="btn-again" style="background:#56d364;color:#000;font-weight:900;padding:12px 24px;border-radius:6px;border:none;cursor:pointer;font-size:1rem;">再玩一次</button>
264:         <button id="btn-next-level" style="background: linear-gradient(90deg, #38bdf8, #818cf8); color:#fff; font-weight:900; padding:12px 24px; border-radius:6px; border:none; cursor:pointer; font-size:1rem; display:none;">⏭️ 下一關</button>
265:     </div>
266:   </div>
267: </div>
268: 
269: <script src="../js/users.js"></script>
270: <script type="module" src="../js/api.js?v=6"></script>
271: <script src="../js/quiz_data.js"></script>
272: <script>
273: const urlParams = new URLSearchParams(window.location.search);
274: const qID = urlParams.get('q') || 'Q1';
275: const tID = urlParams.get('t') || 'T01';
276: 
277: // 設定標題與 UI
278: window.addEventListener('load', () => {
279:     if (QUIZ_DATA[qID]) {
280:         let labelText = `${qID} ${QUIZ_DATA[qID].title} (${tID})`;
281:         if (qID === 'SETUP') {
282:              document.getElementById('header-title').textContent = `Form1_Load 通用練習`;
283:              labelText = 'Form1_Load (通用考生資訊)';
284:         } else {
285:              document.getElementById('header-title').textContent = `${qID} ${QUIZ_DATA[qID].title} (${tID})`;
286:         }
287:         document.getElementById('mode-pill').textContent = labelText;
288:         if(document.getElementById('topic-badge')) document.getElementById('topic-badge').textContent = `${qID} · ${QUIZ_DATA[qID].title}`;
289:     }
290: });
291: 
292: // BACK BTN
293: document.getElementById('btn-back').addEventListener('click', (e) => {
294:     e.preventDefault();
295:     window.location.href = `../index.html?q=${qID}&t=${tID}`;
296: });
297: 
298: // ══ Audio 同連連看 ══
299: const AC = window.AudioContext || window.webkitAudioContext;
300: let audioCtx = null;
301: function getAC() {
302:   if (!audioCtx) audioCtx = new AC();
303:   if (audioCtx.state === 'suspended') audioCtx.resume();
304:   return audioCtx;
305: }
306: function playMatchSound() {
307:   try {
308:     const ctx = getAC();
309:     [[523.25,0],[783.99,0.13]].forEach(([freq,when]) => {
310:       const osc = ctx.createOscillator(), gain = ctx.createGain();
311:       osc.connect(gain); gain.connect(ctx.destination);
312:       osc.type = 'sine'; osc.frequency.value = freq;
313:       const t = ctx.currentTime + when;
314:       gain.gain.setValueAtTime(0, t);
315:       gain.gain.linearRampToValueAtTime(0.28, t+0.01);
316:       gain.gain.exponentialRampToValueAtTime(0.001, t+0.32);
317:       osc.start(t); osc.stop(t+0.33);
318:     });
319:   } catch(e){}
320: }
321: function playWrongSound() {
322:   try {
323:     const ctx = getAC();
324:     [[220,0],[180,0.1]].forEach(([freq,when]) => {
325:       const osc = ctx.createOscillator(), gain = ctx.createGain();
326:       osc.connect(gain); gain.connect(ctx.destination);
327:       osc.type = 'sawtooth'; osc.frequency.value = freq;
328:       const t = ctx.currentTime + when;
329:       gain.gain.setValueAtTime(0, t);
330:       gain.gain.linearRampToValueAtTime(0.18, t+0.01);
331:       gain.gain.exponentialRampToValueAtTime(0.001, t+0.22);
332:       osc.start(t); osc.stop(t+0.23);
333:     });
334:   } catch(e){}
335: }
336: function playWinSound() {
337:   try {
338:     const ctx = getAC();
339:     [[523.25,0],[659.25,0.15],[783.99,0.30],[1046.50,0.45]].forEach(([freq,when]) => {
340:       const osc = ctx.createOscillator(), gain = ctx.createGain();
341:       osc.connect(gain); gain.connect(ctx.destination);
342:       osc.type = 'sine'; osc.frequency.value = freq;
343:       const t = ctx.currentTime + when;
344:       gain.gain.setValueAtTime(0, t);
345:       gain.gain.linearRampToValueAtTime(0.30, t+0.02);
346:       gain.gain.exponentialRampToValueAtTime(0.001, t+0.45);
347:       osc.start(t); osc.stop(t+0.46);
348:     });
349:     const sh = ctx.createOscillator(), sg = ctx.createGain();
350:     sh.connect(sg); sg.connect(ctx.destination);
351:     sh.type = 'sine'; sh.frequency.value = 2093;
352:     const st = ctx.currentTime + 0.70;
353:     sg.gain.setValueAtTime(0, st);
354:     sg.gain.linearRampToValueAtTime(0.15, st+0.02);
355:     sg.gain.exponentialRampToValueAtTime(0.001, st+0.6);
356:     sh.start(st); sh.stop(st+0.61);
357:   } catch(e){}
358: }
359: 
360: // ══ Data ══
361: const allPairs = generateSteps(qID, tID).map(step => ({
362:   en: step.code,
363:   enTag: '程式碼',
364:   zh: step.zh,
365:   zhTag: '中文說明'
366: }));
367: 
368: // ══ State ══
369: let pairs=[], cards=[], selected=null;
370: let matchedCount=0, clickCount=0;
371: let locked=false, timerInterval=null, seconds=0;
372: const PREVIEW_SECS = 5;
373: 
374: function shuffle(arr) {
375:   const a=[...arr];
376:   for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
377:   return a;
378: }
379: 
380: // Build single-face card element
381: function makeCard(data) {
382:   const el = document.createElement('div');
383:   el.className = 'card';           // shows front content by default
384:   el.dataset.pairId = data.pairId;
385:   el.dataset.type   = data.type;
386:   el.innerHTML = `<div class="card-content">
387:     <div class="card-word">${data.word}</div>
388:     <div class="card-tag">${data.tag}</div>
389:   </div>`;
390:   el.addEventListener('click', () => onCardClick(el));
391:   return el;
392: }
393: 
394: function hideCard(el) {
395:   el.classList.add('back');
396: }
397: function revealCard(el) {
398:   el.classList.remove('back');
399:   el.classList.add('flip-in');
400:   el.addEventListener('animationend', () => el.classList.remove('flip-in'), { once: true });
401: }
402: 
403: // ══ Start game ══
404: function startGame() {
405:   clearInterval(timerInterval);
406:   seconds=0; clickCount=0; matchedCount=0; selected=null; locked=true;
407: 
408:   pairs = shuffle(allPairs).slice(0, 6);
409:   cards = [];
410:   pairs.forEach((p,idx)=>{
411:     cards.push({ pairId:idx, type:'en', word:p.en, tag:p.enTag });
412:     cards.push({ pairId:idx, type:'zh', word:p.zh, tag:p.zhTag });
413:   });
414:   cards = shuffle(cards);
415: 
416:   const grid = document.getElementById('grid');
417:   grid.innerHTML = '';
418:   document.getElementById('total-count').textContent = pairs.length;
419:   cards.forEach(c => grid.appendChild(makeCard(c)));
420: 
421:   document.getElementById('overlay').classList.remove('show');
422:   document.getElementById('instruction').style.display = 'none';
423:   updateStats();
424: 
425:   // Preview phase
426:   const banner = document.getElementById('countdown-banner');
427:   const numEl  = document.getElementById('countdown-num');
428:   banner.classList.remove('hidden');
429:   let rem = PREVIEW_SECS;
430:   numEl.textContent = rem;
431: 
432:   const cd = setInterval(() => {
433:     rem--;
434:     if (rem <= 0) {
435:       clearInterval(cd);
436:       document.querySelectorAll('#grid .card').forEach(hideCard);
437:       banner.classList.add('hidden');
438:       document.getElementById('instruction').style.display = 'block';
439:       locked = false;
440:       timerInterval = setInterval(() => {
441:         seconds++;
442:         document.getElementById('timer').textContent = seconds + 's';
443:       }, 1000);
444:     } else {
445:       numEl.textContent = rem;
446:     }
447:   }, 1000);
448: }
449: 
450: // ══ Click handler ══
451: function onCardClick(el) {
452:   if (locked) return;
453:   if (el.classList.contains('gone')) return;
454:   if (el.classList.contains('vanish')) return;
455:   if (!el.classList.contains('back')) return; // already revealed, ignore
456: 
457:   getAC(); // wake audio
458: 
459:   revealCard(el);
460:   el.classList.add('selected');
461:   clickCount++;
462:   updateStats();
463: 
464:   if (!selected) {
465:     selected = el;
466:     return;
467:   }
468: 
469:   const a = selected, b = el;
470:   a.classList.remove('selected');
471:   b.classList.remove('selected');
472:   selected = null;
473:   locked = true;
474: 
475:   const isMatch = a.dataset.pairId === b.dataset.pairId
476:                && a.dataset.type   !== b.dataset.type;
477: 
478:   if (isMatch) {
479:     playMatchSound();
480:     a.classList.add('vanish');
481:     b.classList.add('vanish');
482:     setTimeout(() => {
483:       a.classList.remove('vanish');
484:       b.classList.remove('vanish');
485:       a.classList.add('gone');
486:       b.classList.add('gone');
487:       matchedCount++;
488:       updateStats();
489:       locked = false;
490:       if (matchedCount === pairs.length) setTimeout(showWin, 300);
491:     }, 480);
492:   } else {
493:     playWrongSound();
494:     a.classList.add('wrong');
495:     b.classList.add('wrong');
496:     setTimeout(() => {
497:       a.classList.remove('wrong');
498:       b.classList.remove('wrong');
499:       hideCard(a);
500:       hideCard(b);
501:       locked = false;
502:     }, 750);
503:   }
504: }
505: 
506: function showWin() {
507:   clearInterval(timerInterval);
508:   playWinSound();
509:   const eff = Math.round(pairs.length / clickCount * 100);
510:   document.getElementById('final-score').innerHTML =
511:     `⏱ ${seconds} 秒　　🃏 點擊 ${clickCount} 次　　🎯 效率 ${eff}%`;
512:   document.getElementById('overlay').classList.add('show');
513: 
514:   // 將成績送往雲端 (若以登入且及格)
515:   if (typeof getCurrentUser === 'function') {
516:       const user = getCurrentUser();
517:       if (user && typeof window.saveScore === 'function') {
518:           
519:           let stars = 3;
520:           if (typeof totalHintsUsed !== 'undefined') {
521:               if (totalHintsUsed > 0 && totalHintsUsed <= 3) stars = 2;
522:               if (totalHintsUsed > 3) stars = 1;
523:           }
524:           let finalScoreSpan = document.getElementById('final-score');
525:           if (finalScoreSpan) {
526:               finalScoreSpan.style.width = "calc(100% + 40px)";
527:               finalScoreSpan.style.marginLeft = "-20px";
528:               finalScoreSpan.style.padding = "15px 10px";
529:               finalScoreSpan.style.boxSizing = "border-box";
530:               const hintsCount = typeof totalHintsUsed !== 'undefined' ? totalHintsUsed : 0;
531:               let originHtml = finalScoreSpan.innerHTML;
532:               
533:               // 移除舊版的星星 UI
534:               originHtml = originHtml.replace(/<div class="star-display-container"([\s\S]*?)<\/div>\s*<\/div>/g, '');
535:               originHtml = originHtml.replace(/<br>⭐ 提示.*顆/g, '');
536:               
537:               // 修正折行問題，將各個統計項目包裝在 nowrap 中
538:               originHtml = originHtml.replace(/(⏱ 用時.*?秒)/g, '<span style="white-space:nowrap;">$1</span>');
539:               originHtml = originHtml.replace(/(❌ 錯誤.*?次)/g, '<span style="white-space:nowrap;">$1</span>');
540:               originHtml = originHtml.replace(/(🎯 正確率.*?%)/g, '<span style="white-space:nowrap;">$1</span>');
541:               originHtml = originHtml.replace(/　　/g, ' &nbsp;&nbsp; ');
542: 
543:               finalScoreSpan.innerHTML = originHtml + `
544:                   <div class="star-display-container" style="margin-top: 20px; width: 100%; display: flex; flex-direction: column; align-items: center;">
545:                       <div style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-bottom: 5px; flex-wrap: nowrap;">
546:                           ${Array(3).fill(0).map((_, i) => `<span style="font-size: 3.5rem; filter: ${i < stars ? 'drop-shadow(0 0 12px rgba(251,191,36,0.8))' : 'grayscale(100%) opacity(20%)'}; transform: scale(${i < stars ? 1.1 : 1}); transition: all 0.3s ease; line-height: 1;">⭐</span>`).join('')}
547:                       </div>
548:                       <div style="font-size: 0.85rem; color: #94a3b8; text-align: center; margin-top: 10px;">
549:                           ( 使用提示：${hintsCount} 次 )
550:                       </div>
551:                   </div>
552:               `;
553:           }
554:           window.saveScore(user.className, user.name, qID + '_' + tID, "圖卡翻牌記憶", seconds, "PASS", stars)
555:             .then(res => console.log("翻牌成績上傳完成:", res));
556:       }
557:   }
558: }
559: 
560: function updateStats() {
561:   document.getElementById('matched-count').textContent = matchedCount;
562:   document.getElementById('click-count').textContent   = clickCount;
563: }
564: 
565: document.getElementById('btn-restart').addEventListener('click', startGame);
566: document.getElementById('btn-again').addEventListener('click', startGame);
567: 
568: startGame();
569: </script>
570: <script src="../js/game-toolbar.js"></script>
571: </body>
572: </html>"""

# We must rip out the line number prefixes (e.g., "1: ")
cleaned_lines = []
for line in raw_data.split('\n'):
    if re.match(r'^\d+:\s', line):
        cleaned_lines.append(line.split(': ', 1)[1])
    else:
        # For the few remaining un-numbered lines if any, or just keep
        cleaned_lines.append(line)

cleaned_data = '\n'.join(cleaned_lines)

# Apply our CSS changes
cleaned_data = cleaned_data.replace('.game-header { width: 100%; max-width: 700px;', '.game-header { width: 100%; max-width: 900px;')
cleaned_data = cleaned_data.replace('max-width: 700px; width: 100%; text-align: center;', 'max-width: 900px; width: 100%; text-align: center;')
cleaned_data = cleaned_data.replace('max-width: 700px; width: 100%; margin-bottom: 24px;', 'max-width: 900px; width: 100%; margin-bottom: 24px;')
cleaned_data = cleaned_data.replace('aspect-ratio: 1 / 0.72;', 'aspect-ratio: 1 / 0.65;')
cleaned_data = cleaned_data.replace('word-break: break-all;', 'word-break: normal; overflow-wrap: break-word;')

file_path = 'pages/記憶翻牌遊戲.html'
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(cleaned_data)
print('Successfully rewrote pages/記憶翻牌遊戲.html from memory and applied CSS fixes!')
