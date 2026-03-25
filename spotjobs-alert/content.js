/**
 * SPOTJOBS 1km未満検知スクリプト (Ver 1.4.1: 安定版)
 */

const checkJobs = async () => {
    const data = await chrome.storage.local.get(['threshold']);
    const threshold = data.threshold || 1.0;

    console.log(`[SPOTJOBS Sniper] 監視中... ターゲット: ${threshold}km 未満`);

    let attempts = 0;
    const findElements = setInterval(() => {
        const cards = document.querySelectorAll('div[class*="JobListItem_container"]');
        attempts++;
        if (cards.length > 0) {
            clearInterval(findElements);
            processCards(cards, threshold);
        } else if (attempts > 20) {
            clearInterval(findElements);
        }
    }, 500);
};

const processCards = (cards, threshold) => {
    let count = 0;
    cards.forEach(card => {
        const infoEl = card.querySelector('div[class*="JobListItem_spotInfo"]');
        if (!infoEl) return;
        const text = infoEl.textContent;
        const match = text.match(/(\d+\.?\d*)(k?m)/);
        if (match) {
            let distance = parseFloat(match[1]);
            if (match[2] === "m") distance /= 1000;
            if (distance < threshold) {
                count++;
                card.style.border = "4px solid #ff4500";
                card.style.backgroundColor = "#fff0f0";
            }
        }
    });
    if (count > 0) sendNotification(count, threshold);
};

const sendNotification = (count, threshold) => {
    const audio = new Audio('https://media.geeksforgeeks.org/wp-content/uploads/20190531135120/beep.mp3');
    audio.play().catch(() => {});
    if (Notification.permission === "granted") {
        new Notification("【お宝発見！】", {
            body: `${threshold}km未満の案件が ${count} 件あります！`,
            icon: "https://app.spot.jobs/favicon.ico"
        });
    }
};

checkJobs();
setTimeout(() => { window.location.reload(); }, 300000);