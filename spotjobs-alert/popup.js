document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['threshold'], (data) => {
        if (data.threshold) document.getElementById('threshold').value = data.threshold;
    });
});

document.getElementById('saveBtn').addEventListener('click', async () => {
    const val = parseFloat(document.getElementById('threshold').value);
    await chrome.storage.local.set({ threshold: val });
    document.getElementById('status').textContent = "保存しました。";
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.reload(tabs[0].id);
    });
});