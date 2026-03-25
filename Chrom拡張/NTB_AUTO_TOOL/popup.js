document.addEventListener('DOMContentLoaded', () => {
    // 保存された設定を読み込む
    chrome.storage.local.get(['baseList', 'interval', 'targetBtn'], (data) => {
        if(data.baseList) document.getElementById('baseList').value = data.baseList;
        if(data.interval) document.getElementById('interval').value = data.interval;
        if(data.targetBtn) {
            document.querySelector(`input[name="targetBtn"][value="${data.targetBtn}"]`).checked = true;
        }
    });
});

document.getElementById('startBtn').addEventListener('click', () => {
    const baseList = document.getElementById('baseList').value;
    const interval = document.getElementById('interval').value;
    const targetBtn = document.querySelector('input[name="targetBtn"]:checked').value;

    // 設定を保存
    chrome.storage.local.set({ baseList, interval, targetBtn });

    // コンテンツスクリプトに指令を送る
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "start",
            baseList: baseList,
            interval: interval,
            targetBtn: targetBtn
        });
    });
    
    document.getElementById('status').textContent = "実行指示を送りました...";
});