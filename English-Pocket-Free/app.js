'use strict';
(() => {
  const DATA = window.LEARNING_DATA;
  const KEY = 'english-pocket-free-en-v1';
  const main = document.getElementById('main');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
  let storageOK = true;
  let personal = {version:1, favorites:[], progress:{}, custom:[]};
  try { const saved = localStorage.getItem(KEY); if (saved) personal = validateBackup(JSON.parse(saved)); } catch { storageOK = false; }
  let view = ['library','review','articles','manage'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'library';
  let filter = {kind:'natural', scene:'all', query:'', source:null, basicWord:null};
  const language = 'en';
  let koreanBasicTab = 'words';
  let speechRequest = 0;
  let review = null;
  let reviewScope = 'due';
  let reviewKind = 'all';
  let toastTimer;
  const allCards = () => [...DATA.cards,...personal.custom].filter(c=>(c.language||'en')===language).map(c=>c.kind==='basic'?{...c,scene:'共通'}:c);
  const getCard = id => allCards().find(c => c.id === id);
  const sourceName = id => id === 'user' ? (language!=='en'?languageName()+'の入門用の補足':'学習メモからの補足') : id === 'custom' ? '自分で追加したフレーズ' : DATA.articles.find(a => a.id === id)?.title || '学習記事';
  const kindName = kind => kind === 'natural' ? '自然な言い回し' : '基本';
  const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const due = c => !personal.progress[c.id]?.due || personal.progress[c.id].due <= dayKey();
  const dateLabel = value => value ? `${Number(value.slice(5,7))}/${Number(value.slice(8,10))}` : '未復習';
  function toast(message) { const el = document.getElementById('toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'),3200); }
  function save() { try { localStorage.setItem(KEY,JSON.stringify(personal)); storageOK=true; } catch { storageOK=false; toast('保存できません。追加・保存からバックアップしてください。'); } }
  function warning() { return storageOK ? '' : '<div class="storage-warning" role="alert">このブラウザでは端末への保存が使えないか、保存データを読み込めませんでした。変更を残すには「追加・保存」からバックアップしてください。</div>'; }
  function navigate(next) { if (!['library','review','articles','manage'].includes(next)) return; view=next; if(next==='review')review=null; if(location.hash.slice(1)!==next) location.protocol==='file:'?location.hash=next:history.pushState(null,'','#'+next); render(); window.scrollTo(0,0); }
  const langTag = () => language==='zh-TW'?'zh-Hant-TW':language;
  const languageName = () => ({en:'英語',ko:'韓国語','zh-TW':'台湾華語'}[language]);
  function readingHTML(text,extra='',pinyin='') {
    if(language==='en'||personal.showReading===false)return '';
    return `${language==='zh-TW'&&pinyin?`<p class="reading pinyin ${extra}" lang="zh-Latn-pinyin">${esc(pinyin)}</p>`:''}${text?`<p class="reading ${extra}" lang="ja">${esc(text)}</p>`:''}`;
  }
  function languageControls() {
    return '<section class="free-edition" aria-label="無料版の収録内容"><strong>英語無料版 · 第1〜5話</strong><span>46枚の教材カード · 記事を読んで、声に出して、復習する</span></section>';
  }
  function render() {
    document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.querySelectorAll('.due-count').forEach(x=>x.textContent=allCards().filter(due).length);
    main.innerHTML=languageControls()+warning()+({library:library,review:reviewPage,articles:articlesPage,manage:managePage}[view])();
  }
  function library() {
    const cards=allCards(); const natural=cards.filter(c=>c.kind==='natural').length;
    const scenes=[...new Set(cards.filter(c=>c.kind==='natural').map(c=>c.scene))];
    const showHangul=language==='ko'&&filter.kind==='basic'&&koreanBasicTab==='letters';
    return `${filter.kind==='basic'?`<section class="basic-intro"><p class="eyebrow">THE BASICS, WORD BY WORD.</p><h1>言葉から、基本をひらく。</h1><p class="subtitle">${languageName()}の単語・表現を選んで、意味と使い方を確かめる。</p></section>`:`<section class="hero"><div><p class="eyebrow">YOUR WORDS, READY TO GO.</p><h1>あの場面で、<br>すっと出てくる。</h1><p class="subtitle">学んだひと言を、自分の引き出しに。<br>探して、声に出して、少しずつ。</p></div><div class="hero-art" aria-hidden="true"><div class="art-card"></div><div class="art-card front"><strong>${language==='zh-TW'?'外帶，<br>謝謝。':language==='ko'?'포장해<br>주세요.':'To go,<br>please.'}</strong><span>持ち帰りでお願いします。</span><div class="art-line"></div></div><span class="art-spark">✦</span></div></section>
    <div class="stats"><div class="stat"><strong>${natural}</strong><span>自然な言い回し</span></div><div class="stat"><strong>${cards.length-natural}</strong><span>基本の引き出し</span></div><div class="stat"><strong>${DATA.articles.length}</strong><span>学習した記事</span></div></div>
    <section class="review-banner">${icon('repeat')}<div><strong>今日は、ひとつ思い出そう。</strong><p>未復習・見直しどきのカードが ${cards.filter(due).length} 枚あります。</p></div><button data-view="review">短く復習する ${icon('arrow')}</button></section>`}
    <div class="library-tabs" role="group" aria-label="引き出しの種類">${[['natural','自然な言い回し'],['basic','基本'],['favorite','見返す']].map(([k,l])=>`<button class="filter ${filter.kind===k?'active':''}" data-kind="${k}" aria-pressed="${filter.kind===k}">${k==='favorite'?icon('star'):''}${l}</button>`).join('')}</div>
    ${language==='ko'&&filter.kind==='basic'?`<div class="korean-basic-tabs" role="group" aria-label="韓国語の基本の種類"><button data-korean-basic="words" class="${koreanBasicTab==='words'?'selected':''}" aria-pressed="${koreanBasicTab==='words'}">単語・表現</button><button data-korean-basic="letters" class="${showHangul?'selected':''}" aria-pressed="${showHangul}">ハングルの組み立て</button></div>`:''}
    ${filter.kind==='natural'?`<section aria-label="場面で探す"><div class="section-head"><h2>どんな場面で使う？</h2><small>自然な言い回しを場面で探す</small></div><div class="scene-grid">${scenes.map(s=>`<button class="scene-card ${filter.scene===s?'selected':''}" data-scene="${esc(s)}" aria-pressed="${filter.scene===s}"><span class="scene-icon">${icon(s==='飲食店'?'cup':'pin')}</span><span><b>${esc(s)}</b><small>${cards.filter(c=>c.kind==='natural'&&c.scene===s).length} フレーズ</small></span>${icon('arrow')}</button>`).join('')}<button class="scene-card ${filter.scene==='all'?'selected':''}" data-scene="all" aria-pressed="${filter.scene==='all'}"><span class="scene-icon">${icon('book')}</span><span><b>すべての場面</b><small>言い回しをまとめて</small></span></button></div></section>`:''}
    ${sourceStudyHTML()}
    ${showHangul?`<section id="phrase-section" aria-label="ハングルの組み立て">${window.HANGUL_LESSON.render()}</section>`:`<section id="phrase-section" aria-label="フレーズ一覧"><div class="section-head"><h2 id="list-title">${filter.source?'この記事の引き出し':filter.kind==='basic'?'単語・表現を選ぶ':filter.kind==='favorite'?'見返す引き出し':filter.scene==='all'?'自然な言い回し':esc(filter.scene)+'の引き出し'}</h2><span class="result-count" id="result-count"></span>${filter.source?'<button data-action="clear-source" class="text-button">記事の絞り込みを解除</button>':''}</div>${filter.kind==='basic'?'<p class="subtitle library-description">気になる言葉をタップ。説明と例文が開きます。</p>':''}<div class="search-box">${icon('search')}<input id="search" type="search" placeholder="${language==='zh-TW'?'持ち帰り、外帶、wàidài…':language==='ko'?'ください、近く、ジュセヨ…':filter.kind==='basic'?"can、want、some、できる…":'持ち帰り、駅、to go…'}" aria-label="日本語・${languageName()}・キーワードで検索" value="${esc(filter.query)}"><button data-action="clear-search" aria-label="検索をクリア">×</button></div><div id="card-grid" class="${filter.kind==='basic'?'basic-content':'card-grid'}">${cardResults()}</div></section>`}`;
  }
  function filteredCards() {
    const q=wordKey(filter.query);
    const cards=allCards().filter(c=>(c.kind===filter.kind||(filter.kind==='favorite'&&personal.favorites.includes(c.id)))&&(filter.kind!=='natural'||filter.scene==='all'||c.scene===filter.scene)&&(!filter.source||c.source===filter.source));
    if(!q)return cards;
    const words=filter.kind==='basic'?cards.filter(c=>wordKey([c.headword||'',c.headwordReading||'',c.headwordPinyin||'',c.meaning||''].join(' ')).includes(q)):[];
    return words.length?words:cards.filter(c=>wordKey(JSON.stringify([c.headword,c.headwordReading,c.headwordPinyin,c.meaning,c.en,c.pinyin,c.reading,c.ja,c.label,c.scene,c.topic,c.tags,c.chunks,c.note,c.examples])).includes(q));
  }

  function cardResults() { if(filter.kind==='basic')return basicResults(); const cards=filteredCards(); return cards.length?cards.map(c=>cardHTML(c)).join(''):`<div class="empty">${icon('search')}<p>${filter.kind==='favorite'?'見返したいフレーズの☆を押すと、ここに集まります。':'見つかりませんでした。検索語や場面を変えてみてください。'}</p><button class="text-button" data-action="reset-filters">すべてのフレーズを見る</button></div>`; }
  const wordKey = word => String(word).trim().replace(/’/g,"'").toLocaleLowerCase();
  function basicGroups(cards) {
    const groups=new Map();
    for(const c of cards){
      const word=c.headword||c.chunks?.[0]?.[0]||c.en, key=wordKey(word);
      if(!groups.has(key))groups.set(key,{key,word,reading:c.headwordReading||'',pinyin:c.headwordPinyin||'',meaning:c.meaning||c.topic||c.ja,cards:[]});
      groups.get(key).cards.push(c);
    }
    const order=language==='zh-TW'?['請問','這個','有 / 沒有','可以','想 / 要','附近','嗎','謝謝']:language==='ko'?['주세요','이거','있어요','없어요','할 수 있어요','-고 싶어요','근처','네 / 아니요']:['look for','can','could','want',"i'd like",'will','would','a / an','the','my','atm','some','any','a little','more','there is / are','am / is / are','not'];
    const rank=key=>order.includes(key)?order.indexOf(key):order.length;
    return [...groups.values()].sort((a,b)=>rank(a.key)-rank(b.key)||a.word.localeCompare(b.word,langTag()));
  }
  function basicResults() {
    const groups=basicGroups(filteredCards());
    if(!groups.length)return `<div class="empty">${icon('search')}<p>見つかりませんでした。${languageName()}の単語や日本語の意味で探してみてください。</p><button class="text-button" data-action="clear-search">検索をクリア</button></div>`;
    const chosen=groups.find(g=>g.key===filter.basicWord);
    if(chosen)return `<div class="basic-selected"><button class="text-button word-back" data-action="basic-index">← 単語・表現の一覧に戻る</button><div class="word-heading"><div><h3 lang="${langTag()}">${esc(chosen.word)}</h3>${readingHTML(chosen.reading,'',chosen.pinyin)}<p>${esc(chosen.meaning)}</p></div><span>${chosen.cards.length} 項目</span></div><div class="card-grid">${chosen.cards.map(c=>cardHTML(c,true)).join('')}</div></div>`;
    return `<div class="word-grid" aria-label="基本の${languageName()}の単語・表現">${groups.map(g=>`<button class="word-tile" data-headword="${esc(g.key)}" aria-label="${esc(g.word)}：${esc(g.meaning)}"><strong lang="${langTag()}">${esc(g.word)}</strong>${readingHTML(g.reading,'word-reading',g.pinyin)}<span>${esc(g.meaning)}</span><small>${g.cards.length} 項目 ${icon('arrow')}</small></button>`).join('')}</div>`;
  }
  function updateResults() { document.getElementById('card-grid').innerHTML=cardResults(); updateCount(); }
  function updateCount() { const count=document.getElementById('result-count'); if(count)count.textContent=filter.kind==='basic'?basicGroups(filteredCards()).length+' 語・表現':filteredCards().length+' 件'; }
  function questionHTML(c) {
    if(!c.questionEn)return '';
    return `<div class="question-context"><p class="detail-label">この質問への返事</p><div class="english-row"><p lang="${langTag()}">${esc(c.questionEn)}</p><button class="sound-btn" data-speak="${esc(c.questionEn)}" aria-label="質問を読み上げる">${icon('sound')}</button></div><p class="question-translation">${esc(c.questionJa||'')}</p></div>`;
  }
  function sourceStudyHTML() {
    if(!filter.source)return '';
    const article=DATA.articles.find(a=>a.id===filter.source),cards=allCards().filter(c=>c.source===filter.source);
    if(!article)return '';
    return `<section class="source-study" aria-label="この話から学ぶ"><p>${esc(article.title)}</p><div role="group" aria-label="この話の種類">${[['natural','自然な言い回し'],['basic','基本']].map(([kind,label])=>`<button data-source-kind="${kind}" class="${filter.kind===kind?'selected':''}" aria-pressed="${filter.kind===kind}">${label} ${cards.filter(c=>c.kind===kind).length} 枚</button>`).join('')}</div></section>`;
  }
  function cardHTML(c,expanded=false) {
    const starred=personal.favorites.includes(c.id), p=personal.progress[c.id];
    return `<article class="phrase-card" data-card-id="${esc(c.id)}"><div class="card-top"><div class="card-meta"><span class="kind-tag ${c.kind==='basic'?'basic':''}">${kindName(c.kind)}</span><span>${c.kind==='basic'?'':esc(c.scene)+' / '}${esc(c.topic)}</span></div><button class="star-btn ${starred?'saved':''}" data-star="${esc(c.id)}" aria-pressed="${starred}" aria-label="${esc(c.label)}を${starred?'見返すから外す':'見返すに保存'}">${icon('star')}</button></div><div class="card-main"><h3>${esc(c.label)}</h3>${questionHTML(c)}<div class="english-row"><p class="english" lang="${langTag()}">${esc(c.en)}</p><button class="sound-btn" data-speak="${esc(c.en)}" aria-label="${languageName()}を読み上げる">${icon('sound')}</button></div>${readingHTML(c.reading,'',c.pinyin)}<p class="japanese">${esc(c.ja)}</p><div class="word-hint">${c.chunks.slice(0,3).map(x=>`<span>${esc(x[0])}</span>`).join('')}</div></div><details${expanded===true?' open':''}><summary>かたまり・応用を見る</summary><div class="card-detail"><p class="detail-label">かたまりで覚える</p><div class="chunk-list">${c.chunks.map(([en,ja,reading,pinyin])=>`<div class="chunk"><b lang="${langTag()}">${esc(en)}</b><small>${esc(ja)}</small>${readingHTML(reading,'chunk-reading',pinyin)}</div>`).join('')}</div><p class="detail-note">${esc(c.note)}</p><p class="detail-label">応用・会話の例</p>${c.examples.map(([who,en,ja,reading,pinyin])=>`<div class="example"><small>${esc(who)}</small><div class="english-row"><p class="example-en" lang="${langTag()}">${esc(en)}</p><button class="sound-btn" data-speak="${esc(en)}" aria-label="例文を読み上げる">${icon('sound')}</button></div>${readingHTML(reading,'',pinyin)}<p>${esc(ja)}</p></div>`).join('')}${DATA.articles.some(a=>a.id===c.source)?`<button class="source-link" data-article="${esc(c.source)}">出典：${esc(c.source==='a1'?'第1話・駅はありますか？':c.source==='a2'?'第2話・持ち帰りでお願いします':sourceName(c.source))}</button>`:`<span class="source-link">${esc(sourceName(c.source))}</span>`}${(c.relatedLessons||[]).map(id=>`<button class="related-lesson" data-source-filter="${esc(id)}">続き：${esc(DATA.articles.find(a=>a.id===id)?.shortTitle||'関連する学習')}を学ぶ ${icon('arrow')}</button>`).join('')}<div class="card-progress">${esc(c.origin)}${p?` · 復習 ${p.reviews} 回 · 次の見直し ${dateLabel(p.due)}`:' · まだ復習していません'}</div></div></details></article>`;
  }
  function reviewPage() {
    const candidates=allCards().filter(c=>(reviewKind==='all'||c.kind===reviewKind)&&(reviewScope!=='favorite'||personal.favorites.includes(c.id))&&(reviewScope!=='due'||due(c)));
    const intro=`<div class="page-intro"><p class="eyebrow">A LITTLE RECALL, EVERY NOW AND THEN.</p><h1>ひとつ、思い出してみよう。</h1><p class="subtitle">日本語の意味や質問を手がかりに、${languageName()}を口に出してから、答えを見ます。</p></div>`;
    const opts=`<div class="review-options"><label>対象 <select id="review-scope">${[['due','未復習・見直しどき'],['favorite','☆ 見返す'],['all','すべて']].map(([v,l])=>`<option value="${v}" ${reviewScope===v?'selected':''}>${l}</option>`).join('')}</select></label><label>種類 <select id="review-kind">${[['all','すべて'],['natural','自然な言い回し'],['basic','基本']].map(([v,l])=>`<option value="${v}" ${reviewKind===v?'selected':''}>${l}</option>`).join('')}</select></label></div>`;
    if(!review) {
      const sorted=candidates.slice().sort((a,b)=>(personal.progress[a.id]?.due||'').localeCompare(personal.progress[b.id]?.due||'')||(personal.progress[a.id]?.last||'').localeCompare(personal.progress[b.id]?.last||''));
      review={ids:sorted.slice(0,5).map(c=>c.id),pos:0,revealed:false,known:0,again:0};
    }
    if(!review.ids.length)return `<div class="review-wrap">${intro}${opts}<div class="empty"><p>${reviewScope==='favorite'?'☆に保存したフレーズがありません。':'今の条件で復習するカードはありません。'}</p><button class="btn" data-action="review-all">すべてのカードから復習する</button></div></div>`;
    if(review.pos>=review.ids.length)return `<div class="review-wrap">${intro}<div class="review-finish">${icon('check')}<h2>今日のひとくち復習、おつかれさま。</h2><p>${review.ids.length} 枚を見直しました。<br>言えた ${review.known} 枚 · もう一度 ${review.again} 枚</p><p>「もう一度」は明日、「言えた」は<br>1日 → 3日 → 7日…と間隔をあけて見直します。</p><div class="button-row" style="justify-content:center;margin-top:22px"><button class="btn primary" data-action="review-again">次のカードへ</button><button class="btn" data-view="library">引き出しに戻る</button></div></div><p class="review-tip" style="margin-top:15px">復習履歴はこの端末のブラウザに保存されます。</p></div>`;
    const c=getCard(review.ids[review.pos]);
    return `<div class="review-wrap">${intro}${opts}<div class="review-status"><span>1回、最大5フレーズ</span><span>${review.pos+1} / ${review.ids.length}</span></div><div class="progress-track"><span style="width:${review.pos/review.ids.length*100}%"></span></div><div class="flash-card"><span class="kind-tag ${c.kind==='basic'?'basic':''}">${kindName(c.kind)}${c.kind==='basic'?'':' · '+esc(c.scene)}</span>${questionHTML(c)}<p class="prompt">${esc(c.ja)}</p>${review.revealed?`<div class="answer-area"><p class="eyebrow">ONE NATURAL WAY TO SAY IT</p><div class="english-row"><p class="english" lang="${langTag()}">${esc(c.en)}</p><button class="sound-btn" data-speak="${esc(c.en)}" aria-label="答えを読み上げる">${icon('sound')}</button></div>${readingHTML(c.reading,'',c.pinyin)}<p>${esc(c.chunks.map(x=>x[1]).join(' / '))}</p></div>`:`<p class="subtitle">${languageName()}でどう言う？<br>声に出すか、心の中で思い出してみてください。</p><button class="btn primary" data-action="reveal">答えを見る ${icon('arrow')}</button>`}</div>${review.revealed?`<div class="review-actions"><button class="btn warm" data-grade="again">もう一度覚えたい</button><button class="btn primary" data-grade="known">言えた ${icon('check')}</button></div>`:''}<p class="review-tip">同じ意味の別の自然な言い方でもOK。採点は自分の感覚で。</p></div>`;
  }
  function grade(type) {
    if(!review||!review.revealed||review.pos>=review.ids.length)return;
    const id=review.ids[review.pos],old=personal.progress[id]||{streak:0,reviews:0};
    const streak=type==='known'?old.streak+1:0;
    const interval=type==='known'?[1,3,7,14,30,60][Math.min(streak-1,5)]:1;
    const next=new Date(); next.setDate(next.getDate()+interval);
    personal.progress[id]={reviews:old.reviews+1,streak,last:dayKey(),due:dayKey(next)};
    review[type==='known'?'known':'again']++;review.pos++;review.revealed=false;save();render();
  }
  function articlesPage() { return `<div class="page-intro"><p class="eyebrow">FROM MY LEARNING NOTES.</p><h1>学びの、もとの話。</h1><p class="subtitle">${language!=='en'?`日本語で書いた英語の学習記事の場面を、${languageName()}でも練習します。各言語のカードは補足教材です。`:'記事を読み返して、あのときの気づきも一緒に。'}</p></div><div class="article-list">${DATA.articles.map((a,i)=>`<article class="article-card"><div class="article-number">${String(i+1).padStart(2,'0')}</div><div><span class="eyebrow">LEARNING NOTE ${String(i+1).padStart(2,'0')}</span><h2>${esc(a.title.replace('｜AI英会話学習ノート',''))}</h2><p>${a.sourceType==='learning-note'?'会話からの学習メモ · ':''}${allCards().filter(c=>c.source===a.id).length} 枚のカードに整理 · ${a.summary?esc(a.summary):a.id==='a1'?(language!=='en'?'道案内 / ありますか':'道案内 / There is・疑問文・否定文'):a.id==='a2'?(language!=='en'?'飲食店 / 持ち帰り・店内で':'飲食店 / to go・for here'):a.sourceType==='learning-note'?'道案内 / 短い返事・否定・単数と複数':esc(a.filename)}</p><div class="article-buttons"><button class="btn" data-article="${esc(a.id)}">noteで記事を読む ${icon('arrow')}</button><button class="btn" data-source-filter="${esc(a.id)}" ${allCards().some(c=>c.source===a.id)?'':'data-source-language="en"'}>${allCards().some(c=>c.source===a.id)?'この話のフレーズを見る':'英語でこの話を学ぶ'} ${icon('arrow')}</button></div></div></article>`).join('')}</div><div class="info-panel"><strong>英語無料版について</strong>第1〜5話の記事へのリンクと、英語46枚を収録しています。記事はnoteで開きます。教材の自動更新はありません。「追加・保存」から、自分のフレーズを追加できます。</div>`; }
  function managePage() { return `<div class="page-intro"><p class="eyebrow">GROW YOUR OWN POCKET.</p><h1>少しずつ、増やしていく。</h1><p class="subtitle">覚えたい英語を、自分の引き出しに。</p></div>
    <div class="manage-grid"><div><section class="panel"><h2>フレーズを追加</h2><p>自分で覚えたいひと言を残せます。</p>
    <form id="add-form"><div class="field-row"><label class="field">種類<select name="kind" id="add-kind"><option value="natural">自然な言い回し</option><option value="basic">基本</option></select></label>
    <label class="field" id="scene-field">場面<input id="add-scene" name="scene" placeholder="例：飲食店" maxlength="40" required list="scene-options"><datalist id="scene-options">${[...new Set(allCards().filter(c=>c.kind==='natural').map(c=>c.scene))].map(s=>`<option value="${esc(s)}">`).join('')}</datalist></label></div>
    <div id="basic-fields" class="field-row" hidden><label class="field">英語の単語・表現<input name="headword" placeholder="例：can" maxlength="100" disabled></label><label class="field">意味<input name="meaning" placeholder="例：できる" maxlength="200" disabled></label></div>
    <label class="field">日本語<input name="ja" placeholder="例：お水をもらえますか？" maxlength="300" required></label><label class="field">英語<input name="en" placeholder="例：Can I have some water, please?" maxlength="500" required lang="en" autocapitalize="sentences"></label>
    <label class="field">メモ・使いどころ<textarea name="note" placeholder="どんなときに使う？" maxlength="1500"></textarea></label><button type="submit" class="btn primary">${icon('plus')} 引き出しに追加する</button></form><p class="backup-note">追加した内容は、このブラウザに保存されます。移動前にバックアップしてください。</p></section>
    ${personal.custom.length?`<section class="panel"><h2>自分で追加したフレーズ</h2>${personal.custom.map(c=>`<div class="user-card-item"><span>${esc(c.ja)}<small lang="en">${esc(c.en)}</small></span><button class="text-button danger" data-delete="${esc(c.id)}">削除</button></div>`).join('')}</section>`:''}</div>
    <div><section class="panel"><h2>この無料版について</h2><p>第1〜5話の記事へのリンクと、英語46枚（自然な言い回し20枚・基本26枚）を収録しています。</p><p>検索・読み上げ・復習・フレーズ追加を使えます。教材の自動更新はありません。</p><p class="backup-note">記事：アミミン「AI英会話学習ノート」</p></section>
    <section class="panel"><h2>バックアップと端末の移行</h2><p>☆・復習履歴・自分で追加したフレーズを、1つのファイルに保存できます。</p><div class="button-row"><button class="btn" data-action="export">バックアップを保存</button><button class="btn" data-action="import">ファイルを読み込む</button><input id="import-file" type="file" accept=".json,application/json" hidden></div><p class="backup-note">自動同期はありません。ブラウザのデータ削除や、フォルダの移動・更新前にはバックアップを。読み込めるのは英語のバックアップです。</p></section>
    <section class="panel"><h2>開き方と読み上げ</h2><p>公開されたURLをブラウザで開くだけで使えます。ログインは不要です。パソコンでもスマホでも使えますが、端末によっては動かない場合があります。</p><p>記事はnoteで開くため、記事を読むときはネット接続が必要です。</p><p>読み上げはブラウザ・端末の英語音声を使います。声や利用できる音声、ネット接続の要否は環境によって変わります。</p></section></div></div>`; }

  function openArticle(id) {
    const a=DATA.articles.find(a=>a.id===id);if(!a)return;if(a.url){window.open(a.url,'_blank','noopener');return;}
    document.getElementById('article-body').innerHTML=`<div class="filename">${a.sourceType==='learning-note'?'チャットから追加した学習メモ':esc(a.filename)}</div>`+markdown(a.text);
    document.getElementById('article-dialog').showModal();document.getElementById('article-dialog').scrollTop=0;
  }
  function markdown(text) {
    const inline=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
    return text.trim().split(/\r?\n\r?\n/).map(block=>{
      if(/^#{1,6}\s/.test(block))return block.split(/\r?\n/).map(line=>{const h=line.match(/^(#{1,6})\s+(.*)/);return h?`<h${Math.min(h[1].length,3)}>${inline(h[2])}</h${Math.min(h[1].length,3)}>`:`<p>${inline(line)}</p>`;}).join('');
      if(/^>/.test(block))return `<blockquote>${inline(block.replace(/^>\s?/gm,''))}</blockquote>`;
      if(/^- /.test(block))return '<ul>'+block.split(/\r?\n/).map(s=>`<li>${inline(s.replace(/^- /,''))}</li>`).join('')+'</ul>';
      return `<p>${inline(block)}</p>`;
    }).join('');
  }
  function speak(text) {
    const request=++speechRequest;
    if(!('speechSynthesis' in window)){toast('このブラウザは読み上げに対応していません。');return;}
    const speech=new SpeechSynthesisUtterance(text);speech.lang='en-US';speech.rate=.87;
    const voice=speechSynthesis.getVoices().find(v=>v.lang==='en-US');if(voice)speech.voice=voice;
    speech.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')toast('音声を再生できませんでした。端末の音声設定を確認してください。');};
    speechSynthesis.cancel();speechSynthesis.speak(speech);
  }

  function validateBackup(input) {
    if(!input||input.version!==1||!Array.isArray(input.favorites)||!input.progress||typeof input.progress!=='object'||Array.isArray(input.progress)||!Array.isArray(input.custom))throw Error('format');
    const str=(v,max=2000)=>typeof v==='string'&&v.length<=max;
    if(input.favorites.length>10000||input.custom.length>2000||Object.keys(input.progress).length>10000)throw Error('size');
    if(!input.favorites.every(x=>str(x,120)))throw Error('favorites');
    const progress={};
    for(const [id,p] of Object.entries(input.progress)){
      if(!str(id,120)||id==='__proto__'||id==='constructor'||id==='prototype'||!p||!Number.isInteger(p.reviews)||p.reviews<0||!Number.isInteger(p.streak)||p.streak<0||!/^\d{4}-\d{2}-\d{2}$/.test(p.due)||!/^\d{4}-\d{2}-\d{2}$/.test(p.last))throw Error('progress');
      progress[id]={reviews:p.reviews,streak:p.streak,due:p.due,last:p.last};
    }
    const ids=new Set(DATA.cards.map(c=>c.id));
    const custom=input.custom.map(c=>{
      if(!c||!str(c.id,120)||!c.id.startsWith('custom-')||ids.has(c.id)||!['natural','basic'].includes(c.kind)||!['scene','label','en','ja','topic','note'].every(k=>str(c[k])&&(!['scene','label','en','ja'].includes(k)||c[k].trim())))throw Error('card');
      if((c.language!==undefined&&c.language!=='en')||(c.reading!==undefined&&!str(c.reading,500))||(c.headwordReading!==undefined&&!str(c.headwordReading,300))||(c.pinyin!==undefined&&!str(c.pinyin,500))||(c.headwordPinyin!==undefined&&!str(c.headwordPinyin,300)))throw Error('language');
      if((c.headword!==undefined&&!str(c.headword,100))||(c.meaning!==undefined&&!str(c.meaning,200)))throw Error('word');
      ids.add(c.id);return {id:c.id,kind:c.kind,scene:c.kind==='basic'?'共通':c.scene,language:c.language||'en',reading:c.reading||'',pinyin:c.pinyin||'',headwordPinyin:c.headwordPinyin||'',headwordReading:c.headwordReading||'',headword:c.headword||'',meaning:c.meaning||'',label:c.label,en:c.en,ja:c.ja,topic:c.topic,note:c.note,chunks:[[c.en,c.ja]],examples:[],tags:[],source:'custom',origin:'自分で追加'};
    });
    return {version:1,language:'en',showReading:input.showReading!==false,favorites:[...new Set(input.favorites)],progress,custom};
  }
  function exportBackup() {const blob=new Blob([JSON.stringify({...personal,exported:new Date().toISOString()},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='英会話の引き出し_無料英語版_バックアップ_'+dayKey()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('バックアップファイルを保存しました。');}
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.view){navigate(b.dataset.view);return;}
    if(b.dataset.sourceKind){if(!filter.source||!['natural','basic'].includes(b.dataset.sourceKind))return;filter.kind=b.dataset.sourceKind;filter.query='';filter.basicWord=null;render();updateCount();return;}
    if(b.dataset.scene){filter.kind='natural';filter.scene=b.dataset.scene;filter.source=null;render();updateCount();document.getElementById('phrase-section').scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(b.dataset.kind){filter.basicWord=null;filter.query='';filter.kind=b.dataset.kind;filter.scene='all';filter.source=null;render();updateCount();return;}
    if(b.dataset.headword){filter.basicWord=b.dataset.headword;updateResults();document.getElementById('phrase-section').scrollIntoView({behavior:'smooth',block:'start'});return;}
    if(b.dataset.star){const id=b.dataset.star;personal.favorites=personal.favorites.includes(id)?personal.favorites.filter(x=>x!==id):[...personal.favorites,id];save();if(filter.kind==='favorite')updateResults();else{b.classList.toggle('saved',personal.favorites.includes(id));b.setAttribute('aria-pressed',String(personal.favorites.includes(id)));b.setAttribute('aria-label',getCard(id).label+'を'+(personal.favorites.includes(id)?'見返すから外す':'見返すに保存'));}return;}
    if(b.dataset.speak){speak(b.dataset.speak);return;}
    if(b.dataset.article){openArticle(b.dataset.article);return;}
    if(b.dataset.sourceFilter){filter={kind:'natural',scene:'all',query:'',source:b.dataset.sourceFilter};navigate('library');document.getElementById('phrase-section').scrollIntoView();return;}
    if(b.dataset.grade){grade(b.dataset.grade);return;}
    if(b.dataset.delete){if(!confirm('この手入力のフレーズを削除しますか？'))return;personal.custom=personal.custom.filter(c=>c.id!==b.dataset.delete);personal.favorites=personal.favorites.filter(id=>id!==b.dataset.delete);delete personal.progress[b.dataset.delete];save();render();toast('フレーズを削除しました。');return;}
    switch(b.dataset.action){
      case 'toggle-reading':personal.showReading=personal.showReading===false;save();render();break;
      case 'clear-search':filter.query='';filter.basicWord=null;document.getElementById('search').value='';updateResults();document.getElementById('search').focus();break;
      case 'basic-index':filter.basicWord=null;updateResults();document.getElementById('phrase-section').scrollIntoView({behavior:'smooth',block:'start'});break;
      case 'clear-source':filter.source=null;render();updateCount();break;
      case 'reset-filters':filter={kind:'natural',scene:'all',query:'',source:null};render();updateCount();break;
      case 'reveal':if(review){review.revealed=true;render();}break;
      case 'review-again':review=null;render();break;
      case 'review-all':reviewScope='all';review=null;render();break;
      case 'export':exportBackup();break;
      case 'import':document.getElementById('import-file').click();break;
    }
  });
  document.addEventListener('input',e=>{if(e.target.id==='search'){filter.query=e.target.value;filter.basicWord=null;updateResults();}});
  document.addEventListener('change',async e=>{
    if(e.target.id==='add-kind'){
      const basic=e.target.value==='basic', field=document.getElementById('scene-field'), input=document.getElementById('add-scene');
      field.hidden=basic;input.required=!basic;input.disabled=basic;
      const basicFields=document.getElementById('basic-fields');basicFields.hidden=!basic;basicFields.querySelectorAll('input').forEach(i=>{i.required=basic;i.disabled=!basic;});
    }
    if(e.target.id==='review-scope'){reviewScope=e.target.value;review=null;render();}
    if(e.target.id==='review-kind'){reviewKind=e.target.value;review=null;render();}
    if(e.target.id==='import-file'){
      const f=e.target.files?.[0];if(!f)return;
      try {if(f.size>5000000)throw Error('size');const imported=validateBackup(JSON.parse(await f.text()));
        const mergedProgress={...personal.progress};for(const [id,p] of Object.entries(imported.progress)){if(!mergedProgress[id]||p.last>mergedProgress[id].last||(p.last===mergedProgress[id].last&&p.reviews>=mergedProgress[id].reviews))mergedProgress[id]=p;}
        const customs=new Map(personal.custom.map(c=>[c.id,c]));imported.custom.forEach(c=>customs.set(c.id,c));
        personal={...personal,version:1,favorites:[...new Set([...personal.favorites,...imported.favorites])],progress:mergedProgress,custom:[...customs.values()]};save();review=null;render();toast('バックアップを読み込みました。今の内容と統合しました。');
      }catch{toast('読み込めません。英語のバックアップJSONを選んでください。');}
    }
  });
  document.addEventListener('submit',e=>{
    if(e.target.id!=='add-form')return;e.preventDefault();const f=new FormData(e.target);
    const ja=f.get('ja').trim(),en=f.get('en').trim(),scene=f.get('kind')==='basic'?'共通':String(f.get('scene')||'').trim();if(!ja||!en||!scene){toast('日本語・'+languageName()+'・場面を入力してください。');return;}
    const headword=String(f.get('headword')||'').trim(),meaning=String(f.get('meaning')||'').trim();
    if(f.get('kind')==='basic'&&(!headword||!meaning)){toast('単語・表現と意味を入力してください。');return;}
    const card={id:'custom-'+(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2)),kind:f.get('kind'),scene,language,reading:String(f.get('reading')||'').trim(),pinyin:String(f.get('pinyin')||'').trim(),headword,meaning,topic:'自分のひと言',label:ja,ja,en,note:f.get('note').trim()||'自分で追加したフレーズです。',chunks:[[en,ja]],examples:[],source:'custom',origin:'自分で追加',tags:[]};
    personal.custom.push(card);save();render();toast('引き出しに追加しました。');
  });
  document.getElementById('close-article').addEventListener('click',()=>document.getElementById('article-dialog').close());
  document.getElementById('article-dialog').addEventListener('click',e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.currentTarget.close();}});
  window.addEventListener('popstate',()=>{view=['library','review','articles','manage'].includes(location.hash.slice(1))?location.hash.slice(1):'library';review=null;render();updateCount();});
  document.addEventListener('click',e=>{if(e.target.closest('a[href="#library"]')){e.preventDefault();navigate('library');}});
  render();updateCount();
  new MutationObserver(()=>{if(view==='library')updateCount();}).observe(main,{childList:true});
})();
