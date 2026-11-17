/* 「写给她」：朋友留言栏。不编造留言；登录编辑账号后可增改删。
   先写到本机，登录后同时尝试写入云端已发布稿，访客即可看见。 */
(() => {
  const ROUTE = 'for-her';
  const LOCAL_KEY = 'rx-for-her-notes';
  const DRAFT_ID = 'for-her';
  const PUBLISHED_ID = 'for-her-published';

  let notes = [];
  let localOnly = true;
  let draftRevision = null;
  let publishedRevision = null;
  let editingId = null;
  let formOpen = false;
  let statusText = '';
  let loaded = false;
  let loadPromise = null;

  const LOCAL_EDITOR_KEY = 'rx-for-her-local-editor';

  function hasLocalEditor() {
    try { return localStorage.getItem(LOCAL_EDITOR_KEY) === '1'; } catch (e) { return false; }
  }

  function setLocalEditor(on) {
    try {
      if (on) localStorage.setItem(LOCAL_EDITOR_KEY, '1');
      else localStorage.removeItem(LOCAL_EDITOR_KEY);
    } catch (e) {}
  }

  function hasCloudSession() {
    if (window.museumCloud && typeof window.museumCloud.hasSession === 'function') {
      return !!window.museumCloud.hasSession();
    }
    return document.body.dataset.editor === '1';
  }

  function isEditor() {
    return hasCloudSession() || hasLocalEditor();
  }

  function newId() {
    return 'note-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function normalize(list) {
    if (!Array.isArray(list)) return [];
    return list.map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const name = String(item.name || '').trim();
      const body = String(item.body || '').trim();
      if (!name || !body) return null;
      const date = String(item.date || '').trim();
      return {
        id: String(item.id || newId()),
        name,
        body,
        date,
        sort: Number.isFinite(item.sort) ? item.sort : index
      };
    }).filter(Boolean).sort((a, b) => a.sort - b.sort || String(a.id).localeCompare(String(b.id)));
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return normalize(parsed && parsed.notes ? parsed.notes : parsed);
    } catch (e) {
      return [];
    }
  }

  function writeLocal(list) {
    const payload = { notes: normalize(list) };
    localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
    return payload;
  }

  async function loadFromCloud() {
    const cloud = window.museumCloud;
    if (!cloud || typeof cloud.readPublishedContent !== 'function') return false;
    try {
      const published = await cloud.readPublishedContent(PUBLISHED_ID);
      if (published && published.value) {
        publishedRevision = published.revision ?? null;
        const publishedNotes = normalize(published.value.notes);
        if (isEditor() && typeof cloud.readOwnedContent === 'function') {
          try {
            const draft = await cloud.readOwnedContent(DRAFT_ID);
            if (draft && draft.value) {
              draftRevision = draft.revision ?? null;
              const draftNotes = normalize(draft.value.notes);
              if (draftNotes.length || publishedNotes.length) {
                notes = draftNotes.length ? draftNotes : publishedNotes;
                localOnly = false;
                writeLocal(notes);
                return true;
              }
            }
          } catch (e) {
            /* 草稿读不到就用已发布稿 */
          }
        }
        notes = publishedNotes;
        localOnly = false;
        if (publishedNotes.length) writeLocal(notes);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  }

  async function ensureLoaded() {
    if (loaded) return;
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
      notes = readLocal();
      await loadFromCloud();
      loaded = true;
    })();
    try {
      await loadPromise;
    } finally {
      loadPromise = null;
    }
  }

  async function persist(list, message) {
    notes = normalize(list);
    writeLocal(notes);
    localOnly = true;
    const cloud = window.museumCloud;
    if (isEditor() && cloud && typeof cloud.writeContent === 'function') {
      const value = { notes };
      try {
        const draft = await cloud.writeContent(DRAFT_ID, value, draftRevision, false);
        draftRevision = draft.revision ?? draftRevision;
        const published = await cloud.writeContent(PUBLISHED_ID, value, publishedRevision, true);
        publishedRevision = published.revision ?? publishedRevision;
        localOnly = false;
        statusText = message || '已保存，线上也能看到。';
        return;
      } catch (error) {
        statusText = '已先保存在这台设备。云端还没写上：' + (error && error.message ? error.message : '请稍后重试') + '。换设备暂时看不到。';
        return;
      }
    }
    statusText = message || (isEditor() ? '已保存在这台设备。登录编辑账号后，才能同步到云端给大家看。' : '已保存在这台设备。');
  }

  function openForm(id) {
    editingId = id || null;
    formOpen = true;
    room();
    const nameInput = app.querySelector('#for-her-name');
    if (nameInput) nameInput.focus();
  }

  function closeForm() {
    editingId = null;
    formOpen = false;
  }

  function currentFormNote() {
    return notes.find(n => n.id === editingId) || { name: '', body: '', date: '' };
  }

  function editorForm() {
    if (!isEditor() || !formOpen) return '';
    const note = currentFormNote();
    const title = editingId ? '改这一条' : '写一条新的';
    return (
      '<form class="for-her-editor" id="for-her-form">' +
        '<h2>' + title + '</h2>' +
        '<label>谁写的<input id="for-her-name" name="name" type="text" maxlength="40" required value="' + esc(note.name) + '" autocomplete="off"></label>' +
        '<label>日期（可空）<input id="for-her-date" name="date" type="text" maxlength="40" value="' + esc(note.date || '') + '" placeholder="想写就写，不写也可以"></label>' +
        '<label>留给她的话<textarea id="for-her-body" name="body" maxlength="4000" required>' + esc(note.body) + '</textarea></label>' +
        '<div class="for-her-editor-actions">' +
          '<button type="submit" class="primary" name="save">保存</button>' +
          '<button type="button" data-for-her-cancel>先不写了</button>' +
        '</div>' +
      '</form>'
    );
  }

  function cardHtml(note) {
    const dateLine = note.date ? '<p class="for-her-date">' + esc(note.date) + '</p>' : '';
    const actions = isEditor()
      ? '<div class="for-her-card-actions">' +
          '<button type="button" data-for-her-edit="' + esc(note.id) + '">改</button>' +
          '<button type="button" data-for-her-delete="' + esc(note.id) + '">拿掉</button>' +
        '</div>'
      : '';
    return (
      '<article class="for-her-card">' +
        '<h2 class="for-her-name">' + esc(note.name) + '</h2>' +
        dateLine +
        '<p class="for-her-body">' + esc(note.body) + '</p>' +
        actions +
      '</article>'
    );
  }

  function emptyHtml() {
    return (
      '<section class="for-her-empty">' +
        '<span class="eyebrow">先留一个位置</span>' +
        '<h2>还没有写下的话。</h2>' +
        '<p>' + (isEditor() ? '点上面的「写一条」，把朋友的原话收进来。没有核实过的内容，先别代写。' : '等朋友的一句，会收在这里。') + '</p>' +
      '</section>'
    );
  }

  function bind() {
    const addBtn = app.querySelector('[data-for-her-add]');
    if (addBtn) addBtn.onclick = () => openForm(null);
    const unlock = app.querySelector('[data-for-her-unlock]');
    if (unlock) unlock.onclick = () => { setLocalEditor(true); statusText = '可以在这台设备上增改删了。'; room(); };
    const lock = app.querySelector('[data-for-her-lock]');
    if (lock) lock.onclick = () => { setLocalEditor(false); closeForm(); statusText = ''; room(); };
    const cancel = app.querySelector('[data-for-her-cancel]');
    if (cancel) cancel.onclick = () => { closeForm(); statusText = ''; room(); };
    const form = app.querySelector('#for-her-form');
    if (form) {
      form.onsubmit = async (event) => {
        event.preventDefault();
        const name = String(form.elements.name.value || '').trim();
        const body = String(form.elements.body.value || '').trim();
        const date = String(form.elements.date.value || '').trim();
        if (!name || !body) {
          statusText = '名字和留言都要写上，才能收进来。';
          room();
          return;
        }
        const next = notes.map(n => ({ ...n }));
        if (editingId) {
          const index = next.findIndex(n => n.id === editingId);
          if (index >= 0) next[index] = { ...next[index], name, body, date };
        } else {
          next.push({ id: newId(), name, body, date, sort: next.length });
        }
        closeForm();
        await persist(next, '已保存。');
        room();
      };
    }
    app.querySelectorAll('[data-for-her-edit]').forEach(btn => {
      btn.onclick = () => openForm(btn.dataset.forHerEdit);
    });
    app.querySelectorAll('[data-for-her-delete]').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.forHerDelete;
        const note = notes.find(n => n.id === id);
        if (!note) return;
        if (!window.confirm('要把「' + note.name + '」这条拿掉吗？')) return;
        closeForm();
        await persist(notes.filter(n => n.id !== id), '已经拿掉了。');
        room();
      };
    });
  }

  function room() {
    const hint = statusText || (
      isEditor() && !hasCloudSession()
        ? (notes.length ? '现在是本机编辑，这些话只留在这台设备上。登录编辑账号后再保存，才能同步给大家看。' : '现在是本机编辑。保存后先留在这台设备上。')
        : (isEditor() && localOnly && notes.length ? '这些话目前只在这台设备上。再保存一次，会尝试同步到云端。' : '')
    );
    const unlock = (!isEditor() && !formOpen)
      ? '<button type="button" class="text-btn" data-for-her-unlock>在这台设备上编辑</button>'
      : '';
    const lock = (isEditor() && !hasCloudSession() && !formOpen)
      ? '<button type="button" class="text-btn" data-for-her-lock>退出本机编辑</button>'
      : '';
    const toolbar = '<div class="for-her-toolbar">' +
      (isEditor() && !formOpen ? '<button type="button" class="primary" data-for-her-add>写一条</button>' : '') +
      unlock + lock +
      (hint ? '<p class="for-her-status" role="status">' + esc(hint) + '</p>' : '') +
    '</div>';

    app.innerHTML =
      '<header class="for-her-head">' +
        '<span class="eyebrow">写给她</span>' +
        '<h1>这些话，<br>是写给她的。</h1>' +
        '<p>朋友们留下的原话，都收在这里。</p>' +
      '</header>' +
      toolbar +
      editorForm() +
      (notes.length ? '<div class="for-her-list">' + notes.map(cardHtml).join('') + '</div>' : emptyHtml());

    bind();
  }

  const prior = render;
  render = function () {
    prior();
    if (route === ROUTE) {
      if (!loaded) {
        app.innerHTML = '<header class="for-her-head"><span class="eyebrow">写给她</span><h1>这些话，<br>是写给她的。</h1><p>正在打开这一栏。</p></header>';
        ensureLoaded().then(room).catch(() => { loaded = true; notes = readLocal(); room(); });
        return;
      }
      room();
    }
  };

  document.addEventListener('museum-cloud-session', () => {
    loaded = false;
    if (typeof route !== 'undefined' && route === ROUTE) render();
  });

  if (typeof route !== 'undefined' && route === ROUTE) render();
})();
