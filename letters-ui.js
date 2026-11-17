/* 信件室 / 拆信 / 长信阅读。
   只接管 letters 与 read 两个路由，其余房间仍由 app.js 渲染。 */
(() => {
  const splitTitle = l => {
    const parts = String(l.title || '').split(' · ');
    return { ordinal: parts[0] || '', headline: parts.slice(1).join(' · ') || parts[0] || '' };
  };
  const dateOf = l => l.date || '日期待核实';
  const preview = l => {
    const raw = String((l.paragraphs && l.paragraphs[0]) || '').replace(/\s+/g, ' ').trim();
    return raw.length > 42 ? raw.slice(0, 42) + '…' : raw;
  };

  let direction = 'mine';

  function room() {
    const mine = letters.filter(l => l.paragraphs.length);
    const drafts = letters.filter(l => !l.paragraphs.length);
    const cards = mine.map(l => {
      const t = splitTitle(l);
      return '<button class="mail-card" data-open-mail="' + l.id + '" aria-haspopup="dialog">' +
        '<span class="mail-no">' + String(l.number).padStart(2, '0') + '</span>' +
        '<small>' + esc(dateOf(l)) + ' · ' + esc(t.ordinal) + ' · 盛梓轩 写给 方然</small>' +
        '<h2>' + esc(t.headline) + '</h2>' +
        '<span class="mail-foot">方然 亲启 · 拆开看看 ↗</span>' +
        '</button>';
    }).join('') + drafts.map(l => {
      const t = splitTitle(l);
      return '<article class="mail-card mail-draft" aria-label="' + esc(t.ordinal) + '，还在准备">' +
        '<span class="mail-no">' + String(l.number).padStart(2, '0') + '</span>' +
        '<small>还在准备 · ' + esc(t.ordinal) + ' · 盛梓轩 写给 方然</small>' +
        '<h2>' + esc(t.headline) + '</h2>' +
        '<span class="mail-foot">等写好，再亲手交给你。</span>' +
        '</article>';
    }).join('');

    const hers = '<section class="letter-empty">' +
      '<span class="eyebrow">留一个位置</span>' +
      '<h2>你的来信，<br>也在这里等着。</h2>' +
      '<p>这里还没有收录已核实的信件原文。等你哪天想写点什么，这格会亮起来。</p>' +
      '</section>';

    app.innerHTML =
      '<header class="letter-room-head">' +
        '<span class="eyebrow"><span class="xuan">盛梓轩</span> &amp; <span class="ran">方然</span> · 信件室</span>' +
        '<h1>有些喜欢，<br>想慢慢写给你。</h1>' +
        '<p>写下来的话，都好好收在这里。四封的位置先留好，写好的随时可以拆开。</p>' +
      '</header>' +
      '<nav class="letter-directions" aria-label="来信方向">' +
        '<button type="button" data-direction="mine" aria-pressed="' + (direction === 'mine') + '">我写给你的 <b>' + mine.length + '</b></button>' +
        '<button type="button" data-direction="hers" aria-pressed="' + (direction === 'hers') + '">你写给我的 <b>0</b></button>' +
      '</nav>' +
      (direction === 'mine' ? '<div class="letter-shelves">' + cards + '</div>' : hers) +
      '<dialog class="letter-opening-dialog" aria-labelledby="mail-dialog-title"></dialog>';

    app.querySelectorAll('[data-direction]').forEach(b => {
      b.onclick = () => {
        if (direction === b.dataset.direction) return;
        direction = b.dataset.direction;
        room();
        app.querySelector('[data-direction="' + direction + '"]').focus();
      };
    });
    app.querySelectorAll('[data-open-mail]').forEach(b => {
      b.onclick = () => unseal(letters.find(l => l.id === b.dataset.openMail), b);
    });
  }

  function unseal(l, trigger) {
    if (!l) return;
    const t = splitTitle(l);
    const d = app.querySelector('.letter-opening-dialog');
    d.innerHTML =
      '<div class="mail-dialog-body">' +
        '<div class="mail-dialog-top">' +
          '<span class="mail-dialog-ordinal">' + esc(t.ordinal) + '</span>' +
          '<button type="button" class="mail-dialog-close" aria-label="收好信封，关掉">收好 ×</button>' +
        '</div>' +
        '<h2 class="mail-dialog-title" id="mail-dialog-title">' + esc(t.headline) + '</h2>' +
        '<p class="mail-dialog-meta">' + esc(dateOf(l)) + ' · 盛梓轩 写给 方然</p>' +
        '<section class="letter-opening">' +
          '<div class="letter-desk" data-open="false">' +
            '<div class="opening-mail">' +
              '<div class="mail-paper">' +
                '<small>' + esc(t.ordinal) + '</small>' +
                '<p class="mail-preview">' + esc(preview(l)) + '</p>' +
                '<span class="mail-sign">盛梓轩</span>' +
              '</div>' +
              '<div class="mail-pocket"></div>' +
              '<div class="mail-flap">r &amp; x</div>' +
            '</div>' +
          '</div>' +
        '</section>' +
        '<div class="mail-open-actions">' +
          '<button type="button" id="unseal-letter" aria-expanded="false">拆开信封</button>' +
          '<button type="button" id="read-open-letter" hidden>展开读这封信 →</button>' +
        '</div>' +
      '</div>';

    const close = () => d.close();
    const unsealBtn = d.querySelector('#unseal-letter');
    const readBtn = d.querySelector('#read-open-letter');

    d.querySelector('.mail-dialog-close').onclick = close;
    d.onclick = e => { if (e.target === d) close(); };
    d.onclose = () => { try { trigger && trigger.focus({ preventScroll: true }); } catch (e) {} };

    unsealBtn.onclick = () => {
      const desk = d.querySelector('.letter-desk');
      const opened = desk.dataset.open !== 'true';
      desk.dataset.open = String(opened);
      unsealBtn.setAttribute('aria-expanded', String(opened));
      unsealBtn.textContent = opened ? '收回信纸' : '拆开信封';
      readBtn.hidden = !opened;
      if (opened) readBtn.focus({ preventScroll: true });
    };
    readBtn.onclick = () => {
      d.close();
      go('read', l.id);
    };

    d.showModal();
    unsealBtn.focus({ preventScroll: true });
  }

  function reader() {
    const l = letters.find(x => x.id === reading);
    if (!l || !l.paragraphs.length) { go('letters'); return; }
    const t = splitTitle(l);
    let saved = null;
    try { saved = localStorage.getItem('museum-read-' + l.id); } catch (e) {}

    const body = l.paragraphs.map((p, i) => {
      const text = String(p == null ? '' : p);
      const kind = text.trim().length <= 28 ? 'verse' : 'prose';
      return '<p id="paragraph-' + i + '" class="' + kind + '">' + esc(text) + '</p>';
    }).join('');

    app.innerHTML =
      '<div class="reader-top">' +
        '<button type="button" class="text-btn" data-go="letters">← 回到信件室</button>' +
        '<button type="button" class="text-btn" id="resume"' + (saved ? '' : ' hidden') + '>回到上次读到的位置</button>' +
      '</div>' +
      '<article class="reader reader--letter">' +
        '<header class="letter-head">' +
          '<span class="eyebrow">' + esc(t.ordinal) + ' · ' + esc(dateOf(l)) + '</span>' +
          '<h1>' + esc(t.headline) + '</h1>' +
          '<p class="reader-date">盛梓轩 写给 方然' + (l.paragraphs.length > 60 ? ' · 逐行原稿' : '') + '</p>' +
        '</header>' +
        '<div class="letter-body">' + body + '</div>' +
        '<div class="letter-sign">盛梓轩</div>' +
        '<div class="reader-mark">' +
          '<button type="button" data-go="letters">收好这封信</button>' +
          '<span class="small muted">阅读位置只保存在这台设备上。</span>' +
        '</div>' +
      '</article>';

    app.querySelectorAll('[data-go]').forEach(b => { b.onclick = () => go(b.dataset.go); });
    const resume = app.querySelector('#resume');
    if (resume) resume.onclick = () => {
      document.getElementById(saved)?.scrollIntoView({ block: 'center' });
    };
  }

  const prior = render;
  render = function () {
    prior();
    if (route === 'letters') room();
    else if (route === 'read') reader();
  };

  if (route === 'letters' || route === 'read') render();
})();
