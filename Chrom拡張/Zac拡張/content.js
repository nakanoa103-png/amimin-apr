/**
 * ファイル名: content.js
 * 概要: ZAC入力支援・完全版（最小化ボタンヘッダー移動・ZAC専用）
 * 作成者: Nakano Akifumi
 * バージョン: 3.7.0 (Header Controls)
 */

console.log("ZAC Helper v3.7.0: Loaded");

// ■■■ 初期設定 ■■■
const DEFAULT_PROJECTS = "NTB2s保守, 4400351\n見積等営業支援, 4500006\n技術間接 保守, 4500006";
const DEFAULT_PHASES   = "要件定義, 要件定義\n基本設計, 基本設計\n詳細設計, 詳細設計\n製造, 製造\n単体テスト, 単体テスト\n結合テスト, 結合テスト\n会議, 会議";
const DEFAULT_REMARKS  = "定例作業, 定例作業\nバグ調査, 不具合調査・対応\n資料作成, ドキュメント作成\n問合せ対応, ユーザー問合せ対応";

// データ管理
const loadList = (key, defaultText) => localStorage.getItem(key) || defaultText;
const parseList = (text) => text ? text.split('\n').map(line => {
    const parts = line.replace('，', ',').split(',');
    return parts.length >= 2 ? { name: parts[0].trim(), value: parts[1].trim() } : null;
}).filter(i => i) : [];

// ■■■ UI構築 ■■■
const panel = document.createElement('div');
panel.id = "zac-helper-remote";

// 最小化状態の復元
const isMinimized = localStorage.getItem('zac_helper_minimized') === 'true';
// 最小化時はヘッダー(約35px)だけ残す
const initialHeight = isMinimized ? "35px" : "auto";
const initialOverflow = isMinimized ? "hidden" : "auto";

panel.style.cssText = `
    position: fixed; bottom: 20px; left: 20px; z-index: 2147483647;
    background: rgba(255, 255, 255, 0.98); border: 1px solid #ccc;
    border-radius: 8px; padding: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    font-family: "Yu Gothic", sans-serif;
    width: 200px; 
    max-height: 85vh; 
    height: ${initialHeight}; 
    overflow-y: ${initialOverflow};
    font-size: 12px;
    transition: height 0.3s ease, border 0.3s ease;
`;

const mainView = document.createElement('div');
const settingsView = document.createElement('div');
settingsView.style.display = 'none';

// 警告エリア
const alertBox = document.createElement('div');
alertBox.style.cssText = "display:none; background:#ffe6e6; color:#d00; font-weight:bold; padding:8px; margin-bottom:8px; border:1px solid #d00; border-radius:4px; text-align:center; line-height:1.4;";

panel.appendChild(mainView);
panel.appendChild(settingsView);

// ドラッグ機能
const makeDraggable = (element, handle) => {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.style.cursor = "move"; 
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        // ボタン類(SPANタグ)をクリックした時はドラッグしない
        if(e.target.tagName === 'SPAN') return;
        
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        if (element.style.bottom !== "auto") {
            const rect = element.getBoundingClientRect();
            element.style.bottom = "auto";
            element.style.left = rect.left + "px";
            element.style.top = rect.top + "px";
        }
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }
    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
};

// ヘッダー作成 (ここに最小化ボタンを追加！)
const createHeader = (title, showSettings) => {
    const h = document.createElement('div');
    h.style.cssText = "display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #007bff; padding-bottom:5px; margin-bottom:8px; user-select:none;";
    
    const t = document.createElement('span'); 
    t.textContent = title; 
    t.style.fontWeight = "bold"; 
    h.appendChild(t);

    const btnGroup = document.createElement('div');
    btnGroup.style.display = "flex"; 
    btnGroup.style.gap = "5px";

    if (showSettings) {
        const gear = document.createElement('span'); 
        gear.textContent = "⚙️"; 
        gear.title = "設定";
        gear.style.cssText = "cursor:pointer; font-size:12px; color:#555; background:#eee; padding:2px 5px; border-radius:4px;";
        gear.onclick = () => toggleView(); 
        btnGroup.appendChild(gear);
    }

    // ★ 最小化/展開ボタン (New!)
    const minBtn = document.createElement('span');
    // 現在の状態に合わせてアイコンを決める
    const isMin = localStorage.getItem('zac_helper_minimized') === 'true';
    minBtn.textContent = isMin ? "＋" : "－";
    minBtn.title = isMin ? "展開する" : "最小化する";
    minBtn.style.cssText = "cursor:pointer; font-size:12px; font-weight:bold; color:#fff; background:#17a2b8; padding:0px 6px; border-radius:4px; line-height:18px;";
    
    minBtn.onclick = () => {
        if (panel.style.height === "35px") {
            // 展開処理
            panel.style.height = "auto";
            panel.style.overflow = "auto";
            minBtn.textContent = "－";
            minBtn.title = "最小化する";
            localStorage.setItem('zac_helper_minimized', 'false');
        } else {
            // 最小化処理
            panel.style.height = "35px";
            panel.style.overflow = "hidden";
            minBtn.textContent = "＋";
            minBtn.title = "展開する";
            localStorage.setItem('zac_helper_minimized', 'true');
        }
    };
    btnGroup.appendChild(minBtn);


    // × 閉じるボタン
    const closeBtn = document.createElement('span'); 
    closeBtn.textContent = "×"; 
    closeBtn.title = "閉じる（復活はF5）";
    closeBtn.style.cssText = "cursor:pointer; font-size:14px; font-weight:bold; color:#fff; background:#d9534f; padding:0px 6px; border-radius:4px; line-height:18px;";
    closeBtn.onclick = () => { panel.remove(); };
    btnGroup.appendChild(closeBtn);

    h.appendChild(btnGroup);
    setTimeout(() => makeDraggable(panel, h), 100);
    return h;
};

const toggleView = () => { mainView.style.display = (mainView.style.display === 'none') ? 'block' : 'none'; settingsView.style.display = (settingsView.style.display === 'none') ? 'block' : 'none'; if(mainView.style.display==='block') renderMain(); else renderSettings(); };

// メイン画面描画
const renderMain = () => {
    mainView.innerHTML = "";
    mainView.appendChild(createHeader("🛠️ ZAC入力支援", true));
    mainView.appendChild(alertBox);

    const addGroup = (title, key, def, col) => {
        const d = document.createElement('div'); d.textContent = title; d.style.cssText = "font-weight:bold; margin:10px 0 4px; font-size:11px; color:#666; border-bottom:1px solid #eee;"; mainView.appendChild(d);
        parseList(loadList(key, def)).forEach(item => {
            const b = document.createElement('button'); b.textContent = item.name; b.title = item.value; b.style.cssText = `width:100%; margin-bottom:4px; padding:5px; cursor:pointer; background:${col}; color:white; border:none; border-radius:4px; font-size:12px; text-align:left; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;`;
            b.onclick = () => { navigator.clipboard.writeText(item.value); const org=b.textContent; b.textContent = "COPIED! ✅"; b.style.opacity="0.7"; setTimeout(()=>{b.textContent=org; b.style.opacity="1";}, 800); };
            mainView.appendChild(b);
        });
    };
    addGroup("📋 案件", 'zac_projects', DEFAULT_PROJECTS, "#007bff");
    addGroup("⚙️ 工程", 'zac_phases', DEFAULT_PHASES, "#17a2b8");
    addGroup("📝 備考", 'zac_remarks', DEFAULT_REMARKS, "#6c757d");
    
    const d = document.createElement('div'); d.textContent = "⏰ 残業理由"; d.style.cssText = "font-weight:bold; margin:10px 0 4px; font-size:11px; color:#666; border-bottom:1px solid #eee;"; mainView.appendChild(d);
    const memo = document.createElement('textarea'); memo.style.cssText = "width:95%; height:50px; border:1px solid #ccc; font-size:11px;"; memo.value = localStorage.getItem('zac_overtime_memo')||""; 
    memo.oninput = () => localStorage.setItem('zac_overtime_memo', memo.value); mainView.appendChild(memo);
    const cb = document.createElement('button'); cb.textContent="申請理由をコピー"; cb.style.cssText="width:100%; background:#28a745; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;"; cb.onclick=()=>{navigator.clipboard.writeText(memo.value); const org=cb.textContent; cb.textContent="コピー完了！"; setTimeout(()=>cb.textContent=org, 1000);}; mainView.appendChild(cb);
};

const renderSettings = () => { 
    settingsView.innerHTML = ""; settingsView.appendChild(createHeader("⚙️ 設定編集", false)); 
    const createArea = (lbl, k, def) => {
        const l = document.createElement('div'); l.textContent = lbl; l.style.cssText="font-size:11px; font-weight:bold; margin-top:8px;"; settingsView.appendChild(l);
        const a = document.createElement('textarea'); a.style.cssText="width:95%; height:60px; font-size:11px; border:1px solid #ccc; font-family:monospace;"; a.value=loadList(k, def); a.oninput=()=>localStorage.setItem(k, a.value); settingsView.appendChild(a);
    };
    createArea("案件リスト", 'zac_projects', DEFAULT_PROJECTS);
    createArea("工程リスト", 'zac_phases', DEFAULT_PHASES);
    createArea("備考リスト", 'zac_remarks', DEFAULT_REMARKS);
    const b = document.createElement('button'); b.textContent="完了 (戻る)"; b.style.cssText="width:100%; margin-top:10px; padding:8px; background:#333; color:white; border:none; border-radius:4px; cursor:pointer;"; b.onclick=toggleView; settingsView.appendChild(b);
};

// ■■■ 監視ロジック ■■■
const startMonitoring = () => {
    document.body.appendChild(panel);
    renderMain();
    
    setInterval(() => {
        let detectedMonth = null;
        const dateCandidates = document.querySelectorAll('.date-text, .header-date, h2, h3, div');
        for (let el of dateCandidates) {
            if (el.getBoundingClientRect().top > 250) continue; 
            const match = el.textContent.trim().match(/20\d\d年(\d{1,2})月(\d{1,2})日/);
            if (match) { detectedMonth = parseInt(match[1]); break; }
        }
        
        let mismatchText = null; let mismatchFound = false;
        if (detectedMonth) {
            const potentialItems = document.querySelectorAll('input[type="text"], .text-content, td, .mat-select-value-text, span');
            const monthRegex = new RegExp("(\\d{1,2})月");
            for (let el of potentialItems) {
                let val = el.value || el.textContent;
                if (!val || val.length > 50) continue;
                const mMatch = val.match(monthRegex);
                if (mMatch) {
                    const foundMonth = parseInt(mMatch[1]);
                    if (foundMonth >= 1 && foundMonth <= 12 && foundMonth !== detectedMonth) {
                        mismatchText = val; mismatchFound = true; break;
                    }
                }
            }
        }
        
        if(document.body.contains(panel)) {
            if (mismatchFound) {
                // 警告時は自動で展開してあげる（親切）
                /*
                if (panel.style.height === "35px") {
                     panel.style.height = "auto"; panel.style.overflow = "auto";
                     localStorage.setItem('zac_helper_minimized', 'false');
                     // アイコンの更新が必要だが、renderMainしなおすと入力中のメモが消えるので
                     // ここでは強制展開だけにしておきます
                }
                */
                panel.style.border = "4px solid #ff4444";
                alertBox.innerHTML = `⚠️ <b>月ズレ注意！</b><br>画面は${detectedMonth}月ですが<br>「${mismatchText}」<br>が選択されています。`;
                alertBox.style.display = 'block';
            } else {
                panel.style.border = "1px solid #ccc";
                alertBox.style.display = 'none';
            }
        }
    }, 1000);
};

// ■■■ 起動制御 ■■■
const currentURL = window.location.href;
if (currentURL.includes("zac") || currentURL.includes("daily_report")) {
    console.log("ZAC Helper: 起動");
    startMonitoring();
} else {
    console.log("ZAC Helper: 待機");
}