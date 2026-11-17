(() => {
  const config = Object.assign({"url":"https://[REDACTED_SUPABASE_PROJECT].supabase.co","publishableKey":"[REDACTED_SUPABASE_PUBLISHABLE_KEY]"}, window.MUSEUM_CLOUD_CONFIG || {});

  const DRAFT_ID = 'home-copy';
  const PUBLISHED_ID = 'home-copy-published';
  const RESERVED_IDS = ['explore-progress', 'puzzle-progress', 'gift-reveal'];
  const WISH_META_KEY = 'rx-wish100-sync';

  let session = null;
  let draftCopy = null;
  let draftRevision = null;
  let draftLoaded = false;
  let publishedCopy = null;

  try {
    session = JSON.parse(localStorage.getItem('museum-cloud-session') || sessionStorage.getItem('museum-cloud-session') || 'null');
  } catch {}

  function remember() {
    const persistent = localStorage.getItem('museum-cloud-remember') === 'yes';
    localStorage.removeItem('museum-cloud-session');
    sessionStorage.removeItem('museum-cloud-session');
    if (session) (persistent ? localStorage : sessionStorage).setItem('museum-cloud-session', JSON.stringify(session));
    announce();
  }

  function hasEditorSession() {
    if (!session || typeof session !== 'object' || !session.access_token) return false;
    if (session.expires_at && session.expires_at * 1000 < Date.now()) return false;
    return true;
  }

  function syncEditorFlag() {
    const on = hasEditorSession();
    if (on) document.body.dataset.editor = '1';
    else delete document.body.dataset.editor;
    document.querySelectorAll('[data-route="manage"]').forEach(btn => { btn.hidden = !on; });
  }

  function announce() {
    window.museumCloud = window.museumCloud || {};
    window.museumCloud.hasSession = hasEditorSession;
    window.museumCloud.reservedIds = RESERVED_IDS.slice();
    syncEditorFlag();
    document.dispatchEvent(new CustomEvent('museum-cloud-session', { detail: { signedIn: hasEditorSession() } }));
  }

  async function request(path, options = {}, authenticated = true) {
    if (authenticated && !session) throw Error('请先登录编辑账号。');
    if (authenticated && session.expires_at * 1000 < Date.now() + 60000) {
      const refreshed = await request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refresh_token })
      }, false);
      session = refreshed;
      remember();
    }
    const headers = {
      apikey: config.publishableKey,
      'Content-Type': 'application/json',
      ...(authenticated ? { Authorization: 'Bearer ' + session.access_token } : {}),
      ...options.headers
    };
    const response = await fetch(config.url + path, { ...options, headers });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) {
      throw Error(data?.msg || data?.message || data?.error_description || data?.hint || '连接失败，请稍后重试。');
    }
    return data;
  }

  function applyCopy() {
    if (typeof route === 'undefined' || route !== 'home') return;
    const copy = session && draftCopy ? draftCopy : publishedCopy;
    if (!copy) return;
    const heading = document.querySelector('.hero-copy h1');
    const intro = document.querySelector('.hero-copy p');
    if (heading) { heading.textContent = copy.title; heading.style.whiteSpace = 'pre-line'; }
    if (intro) { intro.textContent = copy.intro; intro.style.whiteSpace = 'pre-line'; }
  }

  async function loadPublishedCopy() {
    const rows = await request('/rest/v1/museum_content?id=eq.' + PUBLISHED_ID + '&published=eq.true&select=value', {}, false);
    publishedCopy = rows?.[0]?.value || null;
    applyCopy();
  }

  async function loadDraft() {
    const rows = await request('/rest/v1/museum_content?id=eq.' + DRAFT_ID + '&select=value,revision');
    draftLoaded = true;
    if (rows?.[0]) {
      draftCopy = rows[0].value || null;
      draftRevision = rows[0].revision ?? null;
    } else {
      draftCopy = publishedCopy || null;
      draftRevision = null;
    }
    applyCopy();
  }

  async function writeContent(id, value, revision, published) {
    const payload = {
      id,
      value,
      revision: revision == null ? 1 : revision + 1,
      published: !!published,
      updated_at: new Date().toISOString(),
      updated_by: session.user.id
    };
    if (revision == null) {
      try {
        const rows = await request('/rest/v1/museum_content', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(payload)
        });
        if (!rows?.length) throw Error('没有保存成功，请检查编辑权限。');
        return rows[0];
      } catch (error) {
        const message = String(error.message || '');
        if (/duplicate|conflict|already exists|unique/i.test(message)) {
          const conflict = Error('云端已有更新，你刚改的文字还留在本页。请先查看云端版本，再决定怎样保存。');
          conflict.conflict = true;
          throw conflict;
        }
        throw error;
      }
    }
    const rows = await request(
      '/rest/v1/museum_content?id=eq.' + encodeURIComponent(id) + '&revision=eq.' + revision,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          value: payload.value,
          revision: payload.revision,
          published: payload.published,
          updated_at: payload.updated_at,
          updated_by: payload.updated_by
        })
      }
    );
    if (!rows?.length) {
      const error = Error('云端已有更新，你刚改的文字还留在本页。请先查看云端版本，再决定怎样保存。');
      error.conflict = true;
      throw error;
    }
    return rows[0];
  }

  function defaultCopyFromForm(form) {
    return {
      title: form.elements.title.value.trim(),
      intro: form.elements.intro.value.trim()
    };
  }

  const originalRender = render;
  const originalGo = go;
  go = function (page, id, record = true) {
    if (page === 'manage' && !hasEditorSession() && !(window.MuseumEditor && window.MuseumEditor._loginRequested)) page = 'home';
    if (page !== 'manage' && window.MuseumEditor) window.MuseumEditor._loginRequested = false;
    if (page === 'home' && (location.hash === '#manage' || location.hash === '#/manage')) {
      history.replaceState(null, '', (location.pathname || '') + (location.search || '') + '#home');
      record = false;
    }
    return originalGo(page, id, record);
  };
  render = function () {
    if (typeof route !== 'undefined' && route === 'manage' && !hasEditorSession() && !(window.MuseumEditor && window.MuseumEditor._loginRequested)) {
      if (location.hash === '#manage' || location.hash === '#/manage') {
        history.replaceState(null, '', (location.pathname || '') + (location.search || '') + '#home');
      }
      originalGo('home');
      return;
    }
    originalRender();
    applyCopy();
    if (typeof route !== 'undefined' && route === 'manage') renderManager();
    syncEditorFlag();
  };

  function renderManager() {
    const app = document.getElementById('app');
    app.innerHTML = '<section class="page-head"><h1>把喜欢，慢慢写好。</h1><p>登录后修改首页文案。先保存草稿，确认后再发布，访客才能看到。</p></section><section class="cloud-panel"></section><p id="cloud-status" role="status"></p>';
    const panel = app.querySelector('.cloud-panel');
    const status = message => { const node = document.getElementById('cloud-status'); if (node) node.textContent = message; };

    if (!session) {
      panel.innerHTML = '<form id="cloud-login"><label>登录邮箱<input name="email" type="email" autocomplete="username" required></label><label>登录密码<input name="password" type="password" autocomplete="current-password" required></label><label class="cloud-check"><input name="remember" type="checkbox">记住这台设备</label><button>登录编辑后台</button></form>';
      panel.querySelector('form').onsubmit = async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = form.querySelector('button');
        button.disabled = true;
        try {
          session = await request('/auth/v1/token?grant_type=password', {
            method: 'POST',
            body: JSON.stringify({
              email: form.elements.email.value.trim(),
              password: form.elements.password.value
            })
          }, false);
          localStorage.setItem('museum-cloud-remember', form.elements.remember.checked ? 'yes' : 'no');
          remember();
          await loadDraft();
          renderManager();
        } catch (error) {
          status(error.message);
        } finally {
          button.disabled = false;
        }
      };
      return;
    }

    panel.innerHTML = '<form id="cloud-copy"><label>首页标题<textarea name="title" maxlength="100" required></textarea></label><label>首页介绍<textarea name="intro" maxlength="1000" required></textarea></label><button name="save" type="submit">保存草稿</button></form><div class="cloud-actions"><button type="button" id="cloud-publish">发布给访客</button><button type="button" id="cloud-read">读取云端文案</button><button type="button" id="cloud-preview">返回首页查看</button><button type="button" id="cloud-wish-up">上传本机愿望进度</button><button type="button" id="cloud-wish-down">合并云端愿望进度</button><button type="button" id="cloud-logout">退出编辑账号</button></div><p class="small">愿望取消也会同步。保存的是草稿；发布后，未登录的访客刷新即可读到。探索、拼图和礼物进度只预留了结构，这轮不接同步。</p>';

    const form = panel.querySelector('form');
    form.elements.title.value = draftCopy?.title || '有些偏心，\n只给你看。';
    form.elements.intro.value = draftCopy?.intro || '从一句舍不得结束的晚安，\n到终于可以靠近你的日子。';

    form.onsubmit = async event => {
      event.preventDefault();
      const button = form.querySelector('button[name="save"]');
      button.disabled = true;
      try {
        if (!draftLoaded) throw Error('请先读取云端文案再保存，以免用默认值覆盖新内容。');
        const value = defaultCopyFromForm(form);
        const saved = await writeContent(DRAFT_ID, value, draftRevision, false);
        draftCopy = saved.value;
        draftRevision = saved.revision;
        draftLoaded = true;
        status('草稿已保存。访客还看不到，确认后再发布。');
      } catch (error) {
        status(error.message);
      } finally {
        button.disabled = false;
      }
    };

    panel.querySelector('#cloud-publish').onclick = async () => {
      try {
        if (!draftLoaded) throw Error('请先读取并保存草稿，再发布给访客。');
        const value = defaultCopyFromForm(form);
        const publishedRows = await request('/rest/v1/museum_content?id=eq.' + PUBLISHED_ID + '&select=revision');
        const publishedRevision = publishedRows?.[0]?.revision ?? null;
        const saved = await writeContent(PUBLISHED_ID, value, publishedRevision, true);
        publishedCopy = saved.value;
        status('已发布。访客打开或刷新后可以看到这一版。');
      } catch (error) {
        status(error.message);
      }
    };

    panel.querySelector('#cloud-read').onclick = async () => {
      const local = { title: form.elements.title.value, intro: form.elements.intro.value };
      const shown = draftCopy || {};
      const dirty = local.title !== (shown.title || '') || local.intro !== (shown.intro || '');
      try {
        await loadDraft();
        if (dirty) {
          form.elements.title.value = local.title;
          form.elements.intro.value = local.intro;
          status('已读到云端版本，你刚改的文字还留在本页，没有被覆盖。');
        } else {
          form.elements.title.value = draftCopy?.title || '';
          form.elements.intro.value = draftCopy?.intro || '';
          status('已读取最新云端文案。');
        }
      } catch (error) {
        status(error.message);
      }
    };

    panel.querySelector('#cloud-preview').onclick = () => go('home');
    panel.querySelector('#cloud-logout').onclick = async () => {
      try { await request('/auth/v1/logout', { method: 'POST' }); } catch {}
      session = null;
      draftCopy = null;
      draftRevision = null;
      draftLoaded = false;
      remember();
      go('home');
    };
    panel.querySelector('#cloud-wish-up').onclick = async () => {
      try {
        status(await uploadWishes());
      } catch (error) {
        status(error.message);
      }
    };
    panel.querySelector('#cloud-wish-down').onclick = async () => {
      try {
        status(await mergeWishes());
      } catch (error) {
        status(error.message);
      }
    };
  }

  let wishMeta = {};
  try { wishMeta = JSON.parse(localStorage.getItem(WISH_META_KEY) || '{}') || {}; } catch {}
  if (typeof wishMeta !== 'object' || Array.isArray(wishMeta)) wishMeta = {};

  let wishSnapshot = {};
  if (typeof wishState === 'object' && wishState && !Array.isArray(wishState)) {
    wishSnapshot = { ...wishState };
  }

  function persistWishMeta() {
    localStorage.setItem(WISH_META_KEY, JSON.stringify(wishMeta));
  }

  function stampWishChanges() {
    if (typeof wishState !== 'object' || !wishState) return;
    const now = new Date().toISOString();
    const keys = new Set([...Object.keys(wishSnapshot), ...Object.keys(wishState)]);
    keys.forEach(key => {
      const previous = wishSnapshot[key] || '';
      const next = wishState[key] || '';
      if (previous !== next) {
        const status = next === 'planned' || next === 'done' ? next : 'cancelled';
        wishMeta[key] = { status, updated_at: now };
      }
    });
    wishSnapshot = { ...wishState };
  }

  if (typeof saveWishState === 'function') {
    const previousSaveWishState = saveWishState;
    saveWishState = function () {
      const previousMeta = { ...wishMeta };
      stampWishChanges();
      const ok = previousSaveWishState();
      if (ok) persistWishMeta();
      else {
        wishMeta = previousMeta;
        wishSnapshot = { ...(typeof wishState === 'object' && wishState ? wishState : {}) };
      }
      return ok;
    };
  }

  function wishTitle(index) {
    return typeof wishIdeas !== 'undefined' && wishIdeas[index] ? wishIdeas[index].title : '';
  }

  async function uploadWishes() {
    if (typeof wishIdeas === 'undefined') throw Error('愿望册还没准备好。');
    stampWishChanges();
    const entries = [];
    Object.keys(wishMeta).forEach(key => {
      const index = Number(key);
      if (!Number.isInteger(index) || !wishIdeas[index]) return;
      const meta = wishMeta[key];
      const live = wishState[index] || '';
      const status = live === 'planned' || live === 'done' ? live : (meta.status || 'cancelled');
      entries.push({
        id: 'idea-' + index,
        title: wishIdeas[index].title,
        status,
        updated_at: meta.updated_at || new Date().toISOString()
      });
    });
    if (!entries.length) return '请先在愿望册中选择、完成或取消项目，再上传。';
    await request('/rest/v1/museum_wishes?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(entries)
    });
    persistWishMeta();
    return '愿望进度已上传到云端，取消的项目也会同步。';
  }

  async function mergeWishes() {
    if (typeof wishIdeas === 'undefined' || typeof saveWishState !== 'function') throw Error('愿望册还没准备好。');
    const rows = await request('/rest/v1/museum_wishes?select=*');
    const previousState = { ...wishState };
    const previousMeta = { ...wishMeta };
    stampWishChanges();
    for (const row of rows) {
      const match = /^idea-(\d+)$/.exec(row.id);
      if (!match) continue;
      const index = Number(match[1]);
      if (!wishIdeas[index] || wishIdeas[index].title !== row.title) continue;
      const localMeta = wishMeta[index] || wishMeta[String(index)];
      const localTime = localMeta?.updated_at || '';
      if (localTime && row.updated_at && row.updated_at < localTime) continue;
      if (row.status === 'cancelled') delete wishState[index];
      else if (row.status === 'planned' || row.status === 'done') wishState[index] = row.status;
      wishMeta[index] = { status: row.status, updated_at: row.updated_at || localTime };
    }
    if (!saveWishState()) {
      wishState = previousState;
      wishMeta = previousMeta;
      wishSnapshot = { ...wishState };
      throw Error('本机保存失败。');
    }
    persistWishMeta();
    wishSnapshot = { ...wishState };
    return '已合并云端愿望进度。较新的取消不会被旧记录救活，打开愿望册即可查看。';
  }

  async function readPublishedContent(id) {
    const rows = await request('/rest/v1/museum_content?id=eq.' + encodeURIComponent(id) + '&published=eq.true&select=value,revision', {}, false);
    return rows?.[0] || null;
  }

  async function readOwnedContent(id) {
    const rows = await request('/rest/v1/museum_content?id=eq.' + encodeURIComponent(id) + '&select=value,revision');
    return rows?.[0] || null;
  }

  const previousAnnounce = announce;
  announce = function () {
    previousAnnounce();
    window.museumCloud = window.museumCloud || {};
    window.museumCloud.readPublishedContent = readPublishedContent;
    window.museumCloud.readOwnedContent = readOwnedContent;
    window.museumCloud.writeContent = writeContent;
  };

  window.MuseumEditor = {
    isLoggedIn: hasEditorSession,
    sync: syncEditorFlag,
    openLogin() {
      this._loginRequested = true;
      originalGo('manage');
    },
    _loginRequested: false
  };
  announce();
  if (typeof route !== 'undefined' && route === 'manage' && !hasEditorSession()) go('home');
  loadPublishedCopy().catch(() => {});
  if (session) loadDraft().catch(() => { draftLoaded = false; });
})();
