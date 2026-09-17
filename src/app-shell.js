(() => {
  const SAVE_KEY = 'country-project-save-v1';
  const PROFILE_KEY = 'country-project-profile-v1';

  const css = `
    .cp-overlay{position:fixed;inset:0;z-index:9999;background:rgba(42,61,49,.48);backdrop-filter:blur(8px);display:grid;place-items:center;padding:18px;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#31463a}
    .cp-card{width:min(92vw,680px);max-height:88vh;overflow:auto;background:#fffdf6;border:1px solid rgba(88,112,94,.2);border-radius:26px;box-shadow:0 24px 70px rgba(36,55,43,.24);padding:24px}
    .cp-card h1,.cp-card h2,.cp-card h3{margin-top:0;color:#3e5948}.cp-card p{line-height:1.75}
    .cp-input{width:100%;font-size:18px;padding:14px 16px;border-radius:14px;border:1px solid #b7c9ba;background:#fbfff9;color:#31463a;outline:none}
    .cp-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
    .cp-btn{appearance:none;border:0;border-radius:999px;padding:12px 18px;font-size:16px;font-weight:700;background:#67866f;color:white;box-shadow:0 7px 18px rgba(73,105,82,.18)}
    .cp-btn.secondary{background:#e8efe7;color:#45604d}.cp-btn.warm{background:#9a795a}
    .cp-flags{display:flex;gap:10px;margin:14px 0 6px}.cp-flag{width:52px;height:38px;border-radius:8px;border:3px solid transparent;box-shadow:0 3px 9px rgba(0,0,0,.1)}.cp-flag.selected{border-color:#526f5b}
    .cp-fab{position:fixed;right:18px;bottom:145px;z-index:9990;border:0;border-radius:999px;background:#fffdf4e8;color:#3f5948;padding:10px 14px;font-weight:700;box-shadow:0 8px 22px rgba(49,72,56,.2);display:none}
    .cp-hero{background:linear-gradient(145deg,#e9f2df,#f8ecd8);border-radius:20px;padding:20px;margin-bottom:18px}
    .cp-epithet{font-size:27px;font-weight:800;line-height:1.35}.cp-kicker{font-size:13px;letter-spacing:.08em;color:#6b7d70;margin-bottom:6px}
    .cp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:16px 0}.cp-box{background:#f2f6ee;border-radius:16px;padding:14px;min-height:92px}.cp-box strong{display:block;margin-bottom:6px}
    .cp-timeline{display:grid;gap:10px}.cp-event{border-left:4px solid #9ab29d;padding:8px 12px;background:#f7faf4;border-radius:0 12px 12px 0}
    .cp-chain{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin:10px 0}.cp-node{background:#eef4e9;border-radius:999px;padding:8px 11px;font-size:14px}.cp-arrow{opacity:.5}
    .cp-share-preview{width:100%;max-width:420px;border-radius:20px;display:block;margin:14px auto;box-shadow:0 12px 30px rgba(0,0,0,.15)}
    @media(max-width:560px){.cp-card{padding:20px}.cp-grid{grid-template-columns:1fr}.cp-epithet{font-size:23px}.cp-fab{bottom:168px}}
  `;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function getSave() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch { return null; }
  }

  function setSave(value) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(value));
  }

  function chooseFlagMarkup(selected = 0) {
    const flags = [
      'linear-gradient(135deg,#dcead4 0 50%,#8fb5a0 50%)',
      'linear-gradient(#f2d6bf 0 33%,#fff8e8 33% 66%,#88a99d 66%)',
      'linear-gradient(135deg,#9dbdd0 0 48%,#f5edcf 48% 52%,#c9937d 52%)',
      'linear-gradient(#a5bb8a 0 50%,#f5dfaf 50%)'
    ];
    return flags.map((bg, i) => `<button class="cp-flag ${i === selected ? 'selected' : ''}" data-flag="${i}" aria-label="旗${i + 1}" style="background:${bg}"></button>`).join('');
  }

  function showCountrySetup() {
    const overlay = document.createElement('div');
    overlay.className = 'cp-overlay';
    overlay.innerHTML = `
      <section class="cp-card">
        <div class="cp-kicker">YOUR COUNTRY</div>
        <h1>ここから、あなたの国がはじまります。</h1>
        <p>国の名前と旗をひとつ選んでください。あとから世界の中身が、この国だけの歴史になっていきます。</p>
        <label>国の名前</label>
        <input class="cp-input" maxlength="18" value="はじまりの国" aria-label="国の名前">
        <div class="cp-flags">${chooseFlagMarkup(0)}</div>
        <div class="cp-actions"><button class="cp-btn">この国ではじめる</button></div>
      </section>`;
    document.body.appendChild(overlay);
    let flag = 0;
    overlay.querySelectorAll('.cp-flag').forEach(btn => btn.addEventListener('click', () => {
      flag = Number(btn.dataset.flag);
      overlay.querySelectorAll('.cp-flag').forEach(b => b.classList.toggle('selected', b === btn));
    }));
    overlay.querySelector('.cp-btn').addEventListener('click', () => {
      const name = overlay.querySelector('.cp-input').value.trim() || 'はじまりの国';
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ name, flag }));
      const save = getSave() || {};
      save.countryName = name;
      if (!Array.isArray(save.history)) save.history = [];
      setSave(save);
      location.reload();
    });
  }

  function scores(save) {
    const p = save.policies || {};
    const history = Array.isArray(save.history) ? save.history.map(h => h.text || '').join(' ') : '';
    return {
      '学び': (save.education || 0) + (p.educationBudget === '高め' ? 18 : 0),
      '研究': (save.education || 0) * .55 + (save.technology || 0) * .6 + (history.includes('研究') ? 18 : 0),
      '発明': (save.technology || 0) * .9 + (history.includes('研究') ? 10 : 0),
      '自然': (save.environment || 0) + (p.environmentRule === '高め' ? 16 : 0),
      '森': (save.environment || 0) * .82 + (p.environmentRule === '高め' ? 12 : 0),
      '水辺': (save.environment || 0) * .76 + (history.includes('川') ? 12 : 0),
      '観光': (save.environment || 0) * .55 + (save.freeTime || 0) * .35,
      'ものづくり': (save.employment || 0) * .72 + (save.technology || 0) * .35,
      'ゆとり': (save.freeTime || 0) + (p.workStyle === '低め' ? 18 : 0),
      'にぎわい': (save.population || 0) * .6 + (save.employment || 0) * .45,
      '助け合い': 45 + (history.includes('助') ? 30 : 0) + (history.length > 120 ? 8 : 0),
      '技術': (save.technology || 0) + (p.technologyInvestment === '高め' ? 18 : 0),
      '働き者': (save.employment || 0) + (p.workStyle === '高め' ? 18 : 0)
    };
  }

  function getTraits(save) {
    return Object.entries(scores(save)).sort((a,b) => b[1] - a[1]).slice(0,2).map(x => x[0]);
  }

  function makeSummary(save, traits) {
    const parts = [];
    if ((save.education || 0) >= 60) parts.push('学びの場を広げ');
    if ((save.environment || 0) >= 70) parts.push('自然や水辺を守り');
    if ((save.freeTime || 0) >= 65) parts.push('暮らしの余白を増やし');
    if ((save.technology || 0) >= 55) parts.push('技術を暮らしに取り入れ');
    if (!parts.length) parts.push('いくつもの選択を重ね');
    return `${parts.slice(0,2).join('、')}てきた、${traits[0]}と${traits[1]}の国。正解ではなく、この国が選んできた30年のかたちです。`;
  }

  function residentAfterstory(save) {
    if ((save.education || 0) >= 60 && (save.technology || 0) >= 45) return '子どもだったミナは、町で学んだあと、地域の暮らしを便利にする仕事に関わるようになりました。';
    if ((save.environment || 0) >= 75) return 'ルカは今も川辺で働いています。昔より鳥や散歩する人が増えた景色を、静かに見ています。';
    if ((save.population || 0) >= 60) return 'トオルの店の前には、以前よりいろいろな世代の人が行き交うようになりました。';
    return '3人の住民は、それぞれ違う暮らしを続けています。国の変化は、同じ出来事でも一人ひとりに違う意味を残しました。';
  }

  function causalChain(save) {
    const p = save.policies || {};
    if (p.educationBudget === '高め' && p.technologyInvestment === '高め') return ['教育への投資','学ぶ人が増える','技術が育つ','新しい仕事が生まれる'];
    if (p.environmentRule === '高め') return ['環境を守る','川や森が回復する','人が外で過ごす','町の魅力が変わる'];
    if (p.workStyle === '低め') return ['働く時間を短くする','自由時間が増える','町で過ごす人が増える','働き手不足も課題になる'];
    if (p.taxLevel === '高め') return ['税収を増やす','公共の支出を支える','暮らしの基盤が変わる','負担への声も生まれる'];
    return ['小さな選択','社会の数字が変わる','人の行動が変わる','景色と歴史が変わる'];
  }

  function representativeEvents(save) {
    const h = Array.isArray(save.history) ? save.history : [];
    if (!h.length) return [{year:1,text:'小さな町から国づくりが始まった。'}];
    const unique = [];
    for (const item of h) {
      if (!unique.some(x => x.text === item.text)) unique.push(item);
    }
    const picks = [];
    const school = unique.find(x => /学校/.test(x.text)); if (school) picks.push(school);
    const nature = unique.find(x => /川|鳥|森/.test(x.text)); if (nature && !picks.includes(nature)) picks.push(nature);
    const research = unique.find(x => /研究|技術/.test(x.text)); if (research && !picks.includes(research)) picks.push(research);
    for (const item of unique.slice().reverse()) if (picks.length < 3 && !picks.includes(item)) picks.push(item);
    return picks.slice(0,3);
  }

  function drawShareCard(save, traits, events) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0,0,1080,1350);
    grad.addColorStop(0,'#dcebd2'); grad.addColorStop(.5,'#fff5df'); grad.addColorStop(1,'#c9dfd8');
    ctx.fillStyle = grad; ctx.fillRect(0,0,1080,1350);
    ctx.fillStyle = 'rgba(255,253,246,.91)'; roundRect(ctx,70,80,940,1190,44); ctx.fill();
    ctx.fillStyle = '#486250'; ctx.font = '700 38px system-ui'; ctx.fillText(save.countryName || 'はじまりの国',120,160);
    ctx.font = '800 66px system-ui'; wrapText(ctx,`${traits[0]}と${traits[1]}の国`,120,250,830,82);
    ctx.font = '500 28px system-ui'; ctx.fillStyle='#66796a'; ctx.fillText('30 YEARS OF HISTORY',120,390);
    ctx.fillStyle='#34503e'; ctx.font='600 29px system-ui';
    let y=470;
    events.forEach(e=>{wrapText(ctx,`${e.year}年目　${e.text}`,120,y,820,42);y+=130;});
    ctx.fillStyle='#5e7564'; ctx.font='500 27px system-ui';
    wrapText(ctx,makeSummary(save,traits),120,920,820,42);
    ctx.fillStyle='#829889'; ctx.font='500 23px system-ui'; ctx.fillText('Country Project Game',120,1200);
    return canvas;
  }

  function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function wrapText(ctx,text,x,y,maxWidth,lineHeight){const chars=[...text];let line='';let yy=y;for(const c of chars){const test=line+c;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,yy);line=c;yy+=lineHeight;}else line=test;}if(line)ctx.fillText(line,x,yy);return yy;}

  async function shareCard(save, traits, events, container) {
    const canvas = drawShareCard(save, traits, events);
    const dataUrl = canvas.toDataURL('image/png');
    container.innerHTML = `<img class="cp-share-preview" src="${dataUrl}" alt="国の30年共有カード"><p>このカードにはゲーム内の架空情報だけが入っています。</p>`;
    if (navigator.share && canvas.toBlob) {
      canvas.toBlob(async blob => {
        try {
          const file = new File([blob], 'country-history.png', {type:'image/png'});
          if (!navigator.canShare || navigator.canShare({files:[file]})) {
            await navigator.share({title:`${save.countryName}の30年`,text:`${traits[0]}と${traits[1]}の国`,files:[file]});
          }
        } catch (_) {}
      }, 'image/png');
    }
  }

  function showReview(save) {
    const traits = getTraits(save);
    const events = representativeEvents(save);
    const chain = causalChain(save);
    const overlay = document.createElement('div');
    overlay.className = 'cp-overlay';
    overlay.innerHTML = `
      <section class="cp-card">
        <div class="cp-hero">
          <div class="cp-kicker">30 YEARS REVIEW</div>
          <div class="cp-epithet">${escapeHtml(save.countryName || 'はじまりの国')}<br>${traits[0]}と${traits[1]}の国</div>
          <p>${escapeHtml(makeSummary(save,traits))}</p>
        </div>
        <div class="cp-grid">
          <div class="cp-box"><strong>30年前</strong>小さな町、少ない施設、これから決まっていく国。</div>
          <div class="cp-box"><strong>いま</strong>人口 ${save.population ?? '-'}／教育 ${save.education ?? '-'}／環境 ${save.environment ?? '-'}／自由時間 ${save.freeTime ?? '-'}</div>
        </div>
        <h3>この国を形づくった出来事</h3>
        <div class="cp-timeline">${events.map(e=>`<div class="cp-event"><strong>${e.year}年目</strong><br>${escapeHtml(e.text)}</div>`).join('')}</div>
        <h3 style="margin-top:24px">住民のその後</h3><p>${escapeHtml(residentAfterstory(save))}</p>
        <h3>この国で起きたつながり</h3>
        <div class="cp-chain">${chain.map((n,i)=>`${i?'<span class="cp-arrow">→</span>':''}<span class="cp-node">${escapeHtml(n)}</span>`).join('')}</div>
        <p style="font-size:14px;color:#6d7f72">これは評価や点数ではありません。あなたの国で実際に重なった選択を、ひとつの見方として振り返っています。</p>
        <div class="cp-share-zone"></div>
        <div class="cp-actions">
          <button class="cp-btn continue">この国を続ける</button>
          <button class="cp-btn warm share">共有カードをつくる</button>
          <button class="cp-btn secondary new">新しい国をつくる</button>
        </div>
      </section>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.continue').addEventListener('click',()=>overlay.remove());
    overlay.querySelector('.share').addEventListener('click',()=>shareCard(save,traits,events,overlay.querySelector('.cp-share-zone')));
    overlay.querySelector('.new').addEventListener('click',()=>{
      if (confirm('この端末の現在の国の記録を消して、新しい国を始めますか？')) {
        localStorage.removeItem(SAVE_KEY); localStorage.removeItem(PROFILE_KEY); location.reload();
      }
    });
  }

  function escapeHtml(s='') { return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  function initReviewButton() {
    const fab = document.createElement('button');
    fab.className='cp-fab'; fab.textContent='30年の記録'; document.body.appendChild(fab);
    fab.addEventListener('click',()=>{const s=getSave(); if(s) showReview(s);});
    const refresh=()=>{const s=getSave(); fab.style.display=(s && Number(s.year)>=30)?'block':'none';};
    refresh(); setInterval(refresh,1500);
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem(PROFILE_KEY)) showCountrySetup();
    initReviewButton();
  });
})();
