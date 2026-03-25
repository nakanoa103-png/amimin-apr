/**
 * MAPS X 自動出力ロボ (Ver 2.1.0: 即時起動 & ゾンビ版)
 * 読み込み完了を待たずに、即座に状況を確認して動きます。
 */

// ■■■ メイン処理関数 ■■■
const main = async () => {
    console.log("[MAPS Zombie] ロボット配置完了。記憶を確認します...");

    // 記憶領域から「今やるべき仕事」を取り出す
    const data = await chrome.storage.local.get(['taskStatus', 'taskList', 'taskIndex', 'targetBtn']);

    // 仕事中でなければ何もしない
    if (data.taskStatus !== 'running') {
        console.log("[MAPS Zombie] 待機中 (実行指示なし)");
        return;
    }

    // リストの読み込み
    const list = data.taskList || [];
    const index = data.taskIndex || 0;
    const btnName = data.targetBtn;

    // ■ 終了判定
    if (index >= list.length) {
        alert("【完了】全件処理が終わりました！お疲れ様でした。");
        await chrome.storage.local.set({ taskStatus: 'idle', taskIndex: 0 });
        return;
    }

    // ■ 環境チェック
    const baseInput = document.getElementById("tKyoten");
    if (!baseInput) {
        console.error("拠点入力欄が見つかりません。");
        return;
    }

    // ■ 処理開始
    const code = list[index];
    console.log(`[MAPS Zombie] ターゲット捕捉: ${code} (残り${list.length - index}件)`);

    // 1. 入力
    baseInput.focus();
    baseInput.value = code;
    baseInput.dispatchEvent(new Event('input', { bubbles: true }));
    baseInput.dispatchEvent(new Event('change', { bubbles: true }));
    baseInput.blur();

    // 2. 少し待つ
    await new Promise(r => setTimeout(r, 1500)); 

    // 3. ボタンを押す
    const buttons = Array.from(document.querySelectorAll('input[type="button"], input[type="submit"], button, a, span.button, div.btn'));
    const targetButton = buttons.find(b => (b.value || b.textContent || "").replace(/\s+/g, '') === btnName);

    if (targetButton) {
        if (targetButton.form) targetButton.form.target = "_blank";
        targetButton.click();
        console.log(`[MAPS Zombie] ${code} 発射成功！`);
    } else {
        console.error("ボタンが見つかりませんスキップします。");
    }

    // 4. 次の番号を記憶してリロード予約
    await chrome.storage.local.set({ taskIndex: index + 1 });

    console.log("[MAPS Zombie] 5秒後に転生（リロード）します...");
    setTimeout(() => {
        window.location.reload(); 
    }, 5000); 
};


// ■■■ エントリーポイント（ここを修正！）■■■
// 画面の準備ができているか確認して、すぐ実行する
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // もう読み込み終わってるならすぐやる
    main();
} else {
    // まだなら終わるのを待つ
    document.addEventListener('DOMContentLoaded', main);
}