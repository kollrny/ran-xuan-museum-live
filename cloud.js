
(() => {
  const config = {"url":"https://wuuomtgwcgamnryvwari.supabase.co","publishableKey":"sb_publishable_HQpB4joB4imTr1KPF5OKBw_xUrjg8kv"};
  let session = null;
  let copy = null;
  try { session = JSON.parse(localStorage.getItem('museum-cloud-session') || sessionStorage.getItem('museum-cloud-session') || 'null'); } catch {}
  const originalRender = render;
  function remember() {
    const persistent = localStorage.getItem('museum-cloud-remember') === 'yes';
    localStorage.removeItem('museum-cloud-session');
    sessionStorage.removeItem('museum-cloud-session');
    if (session) (persistent ? localStorage : sessionStorage).setItem('museum-cloud-session', JSON.stringify(session));
  }
  async function request(path, options = {}, authenticated = true) {
    if (authenticated && !session) throw Error('请先登录编辑账号。');
    if (authenticated && session.expires_at * 1000 < Date.now() + 60000) {
      const refreshed = await request('/auth/v1/token?grant_type=refresh_token', {method:'POST',body:JSON.stringify({refresh_token:session.refresh_token})}, false);
      session = refreshed; remember();
    }
    const response = await fetch(config.url + path, {...options, headers:{apikey:config.publishableKey,'Content-Type':'application/json',...(authenticated ? {Authorization:'Bearer '+session.access_token}:{}),...options.headers}});
    const text = await response.text();
    let data = null; try { data = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) throw Error(data?.msg || data?.message || data?.error_description || '连接失败，请稍后重试。');
    return data;
  }
  function applyCopy() {
    if (route !== 'home' || !copy) return;
    const heading = document.querySelector('.hero-copy h1');
    const intro = document.querySelector('.hero-copy p');
    if (heading) { heading.textContent = copy.title; heading.style.whiteSpace='pre-line'; }
    if (intro) { intro.textContent = copy.intro; intro.style.whiteSpace='pre-line'; }
  }
  async function loadCopy() {
    const rows = await request('/rest/v1/museum_content?id=eq.home-copy&select=*');
    copy = rows?.[0]?.value || null; applyCopy();
  }
  render = function () {
    originalRender(); applyCopy();
    if (route === 'manage') renderManager();
  };
  function renderManager() {
    const app = document.getElementById('app');
    app.innerHTML = '<section class="page-head"><h1>把喜欢，慢慢写好。</h1><p>登录后修改首页文案，保存到云端。</p></section><section class="cloud-panel"></section><p id="cloud-status" role="status"></p>';
    const panel = app.querySelector('.cloud-panel');
    const status = message => { const node=document.getElementById('cloud-status'); if(node)node.textContent=message; };
    if (!session) {
      panel.innerHTML='<form id="cloud-login"><label>登录邮箱<input name="email" type="email" autocomplete="username" required></label><label>登录密码<input name="password" type="password" autocomplete="current-password" required></label><label class="cloud-check"><input name="remember" type="checkbox">记住这台设备</label><button>登录编辑后台</button></form>';
      panel.querySelector('form').onsubmit=async event=>{
        event.preventDefault(); const form=event.currentTarget; const button=form.querySelector('button'); button.disabled=true;
        try { session=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:form.elements.email.value.trim(),password:form.elements.password.value})},false); localStorage.setItem('museum-cloud-remember',form.elements.remember.checked?'yes':'no');remember();await loadCopy();renderManager(); }
        catch(error){status(error.message);} finally{button.disabled=false;}
      }; return;
    }
    panel.innerHTML='<form id="cloud-copy"><label>首页标题<textarea name="title" maxlength="100" required></textarea></label><label>首页介绍<textarea name="intro" maxlength="1000" required></textarea></label><button>保存首页文案</button></form><div class="cloud-actions"><button id="cloud-read">读取云端文案</button><button id="cloud-preview">返回首页查看</button><button id="cloud-wish-up">上传本机愿望进度</button><button id="cloud-wish-down">合并云端愿望进度</button><button id="cloud-logout">退出编辑账号</button></div><p class="small">愿望进度采用手动上传和合并。保存文案后，其他已登录设备读取云端即可看到更新。</p>';
    const form=panel.querySelector('form');form.elements.title.value=copy?.title || '有些偏心，\n只给你看。';form.elements.intro.value=copy?.intro || '从一句舍不得结束的晚安，\n到终于可以靠近你的日子。';
    form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button');button.disabled=true;try{const value={title:form.elements.title.value.trim(),intro:form.elements.intro.value.trim()};const rows=await request('/rest/v1/museum_content?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:'home-copy',value,updated_at:new Date().toISOString(),updated_by:session.user.id})});if(!rows?.length)throw Error('没有保存成功，请检查编辑权限。');copy=value;status('已保存到云端，返回首页即可查看。');}catch(error){status(error.message)}finally{button.disabled=false}};
    panel.querySelector('#cloud-read').onclick=async()=>{try{await loadCopy();renderManager();status('已读取最新云端文案。')}catch(error){status(error.message)}};
    panel.querySelector('#cloud-preview').onclick=()=>go('home');
    panel.querySelector('#cloud-logout').onclick=async()=>{try{await request('/auth/v1/logout',{method:'POST'})}catch{}session=null;copy=null;remember();renderManager()};
    panel.querySelector('#cloud-wish-up').onclick=async()=>{try{const entries=wishIdeas.flatMap((idea,index)=>['planned','done'].includes(wishState[index])?[{id:'idea-'+index,title:idea.title,status:wishState[index],updated_at:new Date().toISOString()}]:[]);if(!entries.length){status('请先在愿望册中选择计划或完成项目。');return;}await request('/rest/v1/museum_wishes?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify(entries)});status('愿望进度已上传到云端。')}catch(error){status(error.message)}};
    panel.querySelector('#cloud-wish-down').onclick=async()=>{try{const rows=await request('/rest/v1/museum_wishes?select=*');const previous={...wishState};for(const row of rows){const match=/^idea-(\d+)$/.exec(row.id);if(!match)continue;const index=Number(match[1]);if(!wishIdeas[index]||wishIdeas[index].title!==row.title)continue;if(row.status==='done'||wishState[index]!=='done')wishState[index]=row.status;}if(!saveWishState()){wishState=previous;throw Error('本机保存失败。')}status('已合并云端愿望进度，打开愿望册查看。')}catch(error){status(error.message)}};
  }
  if(session)loadCopy().catch(()=>{});
})();
