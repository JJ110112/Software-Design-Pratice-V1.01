const MOTIVATIONAL_QUOTES = [
    "「每一次的除錯，都是邁向大師之路的基石。」",
    "「程式碼不會騙人，你的努力也是。」",
    "「今天不會沒關係，明天的你會比今天更強！」",
    "「不怕報錯，只怕不試。加油！」",
    "「邏輯就是超能力，而你正在鍛鍊它。」",
    "「再複雜的系統，也是一行行程式碼疊起來的。」",
    "「就算遇到 Endless Loop，也要自己 Break 出來！」",
    "「沒有跑不出的結果，只有沒想通的邏輯。」",
    "「保持耐心，Bug 就像捉迷藏，總會被你抓到。」",
    "「現在流的汗水，都是未來閃耀的星星。」",
    "「不怕學得慢，只怕站著看。動手敲鍵盤就對了！」",
    "「每一次紅字報錯，都是系統在給你進步的提示。」",
    "「天道酬勤，一分耕耘，一分收穫。」",
    "「千里之行，始於足下。」",
    "「不積跬步，無以至千里；不積小流，無以成江海。」",
    "「業精於勤荒於嬉，行成於思毀於隨。」",
    "「寶劍鋒從磨礪出，梅花香自苦寒來。」",
    "「學如逆水行舟，不進則退。」",
    "「吃得苦中苦，方為人上人。」",
    "「少壯不努力，老大徒傷悲。」",
    "「冰凍三尺，非一日之寒。」",
    "「只要功夫深，鐵杵磨成針。」"
];

function initMotivationalQuotes(containerId, intervalMs = 8000) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 添加基礎的 CSS transition
    container.style.transition = 'opacity 0.8s ease-in-out';
    
    function changeQuote() {
        // 先淡出
        container.style.opacity = '0';
        
        setTimeout(() => {
            // 更換文字 (確保抽到的金句不是剛好跟上一個重複，讓動畫看起來更自然)
            let q = container.textContent;
            while(q === container.textContent) {
                q = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
            }
            container.textContent = q;
            
            // 再淡入
            container.style.opacity = '1';
        }, 800); // 等待淡出動畫完畢 (0.8s) 後切換文字並淡入
    }
    
    // 初次載入先給個隨機文字，並設定為透明
    container.textContent = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    container.style.opacity = '0';
    
    // 給瀏覽器一點時間重繪後啟動第一次淡入
    setTimeout(() => {
        container.style.opacity = '1';
    }, 150);

    // 開始定時輪播
    setInterval(changeQuote, intervalMs);
}

document.addEventListener('DOMContentLoaded', () => {
    initMotivationalQuotes('motivational-quote', 8000); // 每 8 秒變換一次金句
});
