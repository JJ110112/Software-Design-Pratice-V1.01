/* game-toolbar.js — 自動注入遊戲右上角工具列 (Home, Map, Sound, Restart) */
(function() {
    // Determine which game mode this page is (from filename + sub param)
    const path = window.location.pathname;
    const filename = decodeURIComponent(path.split('/').pop().replace('.html', ''));

    // Read q and t from URL params
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const t = params.get('t') || '';
    const sub = params.get('sub') || '';

    // 打字練習子模式對應正確的 map mode 名稱
    let mapMode = filename;
    if (filename === '打字練習' && sub) {
        const SUB_MAP = { keyword: '打字-關鍵字', line: '打字-單行', full: '打字-完整' };
        mapMode = SUB_MAP[sub] || filename;
    }

    // Build toolbar HTML
    const toolbar = document.createElement('div');
    toolbar.className = 'game-toolbar';
    toolbar.innerHTML = `
        <a href="../index.html" class="toolbar-btn" title="回首頁">🏠</a>
        <a href="map.html?mode=${encodeURIComponent(mapMode)}&tab=map" class="toolbar-btn" title="訓練進程與模式">🗺️</a>
        <button class="toolbar-btn" id="toolbar-sound" title="音效開關">🔊</button>
        <button class="toolbar-btn" id="toolbar-restart" title="重新開始">🔄</button>
    `;

    // Insert at start of body
    document.body.insertBefore(toolbar, document.body.firstChild);

    // Sound toggle
    const savedSound = localStorage.getItem('gameSoundEnabled');
    let soundOn = savedSound !== null ? (savedSound === 'true') : true;

    const soundBtn = document.getElementById('toolbar-sound');
    
    // 初始化 UI 與音效狀態
    soundBtn.textContent = soundOn ? '🔊' : '🔇';
    soundBtn.classList.toggle('muted', !soundOn);
    window.gameSoundEnabled = soundOn;

    soundBtn.addEventListener('click', () => {
        soundOn = !soundOn;
        soundBtn.textContent = soundOn ? '🔊' : '🔇';
        soundBtn.classList.toggle('muted', !soundOn);
        window.gameSoundEnabled = soundOn;
        
        // 儲存設定到 localStorage
        localStorage.setItem('gameSoundEnabled', soundOn);
        
        // 如果關閉音效，停止目前正在播放的語音
        if (!soundOn && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    });

    // --- 攔截音效播放，讓所有使用此 API 的遊戲都能受到 toolbar 控制 ---
    // 1. 攔截 Web Speech API
    if (window.speechSynthesis) {
        const origSpeak = window.speechSynthesis.speak;
        window.speechSynthesis.speak = function(utterance) {
            if (!window.gameSoundEnabled) return;
            origSpeak.call(this, utterance);
        };
    }

    // 2. 攔截 Web Audio API (OscillatorNode)
    const ACProto = window.AudioContext ? window.AudioContext.prototype : (window.webkitAudioContext ? window.webkitAudioContext.prototype : null);
    if (ACProto && ACProto.createOscillator) {
        const origCreateOscillator = ACProto.createOscillator;
        ACProto.createOscillator = function() {
            const osc = origCreateOscillator.call(this);
            const origStart = osc.start;
            const origStop = osc.stop;
            osc.start = function() {
                if (!window.gameSoundEnabled) return;
                origStart.apply(this, arguments);
            };
            osc.stop = function() {
                if (!window.gameSoundEnabled) return;
                try {
                    origStop.apply(this, arguments);
                } catch(e) {}
            };
            return osc;
        };
    }

    // Restart button
    document.getElementById('toolbar-restart').addEventListener('click', () => {
        // Try to call page-specific restart functions
        if (typeof setupGame === 'function') {
            setupGame();
        } else if (typeof doRestart === 'function') {
            doRestart();
        } else if (typeof startGame === 'function') {
            startGame();
        } else {
            // Fallback: reload page
            window.location.reload();
        }
    });
})();
